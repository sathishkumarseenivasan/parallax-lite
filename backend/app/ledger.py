"""
Escrow ledger — the financial brain of Parallax Lite.
All state transitions are atomic within a single DB session.
All balance mutations are strictly validated before commit.
"""
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import Agent, Transaction
from app.schemas import MetricsResponse, TransactionStatus, TransactionResponse
from app.bus import bus


# ---------------------------------------------------------------------------
# Custom exceptions
# ---------------------------------------------------------------------------

class InsufficientFundsError(ValueError):
    """Raised when a buyer doesn't have enough balance to lock escrow."""

    def __init__(self, agent_id: str, required: float, available: float) -> None:
        self.agent_id = agent_id
        self.required = required
        self.available = available
        super().__init__(
            f"Agent '{agent_id}' has {available:.4f} credits but needs {required:.4f}"
        )


class TransactionNotFoundError(LookupError):
    """Raised when a transaction ID doesn't exist."""

    def __init__(self, transaction_id: str) -> None:
        self.transaction_id = transaction_id
        super().__init__(f"Transaction '{transaction_id}' not found")


class InvalidStateTransitionError(ValueError):
    """Raised when a transaction is in an unexpected state for the operation."""

    def __init__(self, tx_id: str, current: str, expected: str) -> None:
        super().__init__(
            f"Transaction '{tx_id}' is in state '{current}', expected '{expected}'"
        )


# ---------------------------------------------------------------------------
# Escrow Ledger
# ---------------------------------------------------------------------------

class EscrowLedger:
    """
    Manages the complete lifecycle of an escrow-protected transaction.

    State machine:
        PENDING → LOCKED (lock_escrow)
        LOCKED  → CLEARED (clear_escrow)
        LOCKED  → REJECTED_DRIFT (reject_escrow)

    All methods require an active SQLAlchemy session.
    """

    @staticmethod
    def _with_db_retry(max_attempts=2, backoff=0.1):
        import time
        from functools import wraps
        from sqlalchemy.exc import OperationalError

        def decorator(func):
            @wraps(func)
            def wrapper(self, db: Session, *args, **kwargs):
                last_exc = None
                for attempt in range(max_attempts):
                    try:
                        return func(self, db, *args, **kwargs)
                    except OperationalError as e:
                        if "database is locked" in str(e).lower():
                            db.rollback()
                            last_exc = e
                            if attempt < max_attempts - 1:
                                time.sleep(backoff * (2 ** attempt))
                        else:
                            raise
                raise last_exc
            return wrapper
        return decorator

    @_with_db_retry()
    def lock_escrow(
        self,
        db: Session,
        buyer_id: str,
        seller_id: str,
        amount: float,
        schema_name: str,
        simulated_output: str = "",
        task_description: str = "",
    ) -> Transaction:
        """
        Deduct funds from buyer and create a LOCKED transaction.

        Args:
            db:               Active database session.
            buyer_id:         ID of the agent paying for the task.
            seller_id:        ID of the agent performing the task.
            amount:           Credits to lock in escrow.
            schema_name:      Name of the validation schema to use.
            simulated_output: Seller's raw output string.

        Returns:
            The newly created LOCKED Transaction.

        Raises:
            InsufficientFundsError: If the buyer cannot cover the amount.
            LookupError: If buyer or seller agent doesn't exist.
        """
        buyer = db.get(Agent, buyer_id)
        if buyer is None:
            raise LookupError(f"Buyer agent '{buyer_id}' not found")

        seller = db.get(Agent, seller_id)
        if seller is None:
            raise LookupError(f"Seller agent '{seller_id}' not found")

        if buyer.balance < amount:
            raise InsufficientFundsError(buyer_id, amount, buyer.balance)

        # Atomic deduction
        buyer.balance -= amount
        buyer.total_transactions += 1
        buyer.updated_at = datetime.now(timezone.utc)

        seq = bus.next_seq()
        tx = Transaction(
            buyer_id=buyer_id,
            seller_id=seller_id,
            amount=amount,
            status=TransactionStatus.LOCKED,
            expected_schema=schema_name,
            actual_output=simulated_output,
            seq=seq,
        )
        db.add(tx)
        db.flush()
        
        # Sync to FTS table
        from sqlalchemy import text
        db.execute(
            text("""
                INSERT INTO transactions_fts (id, task_description, rejection_reason, buyer_name, seller_name)
                VALUES (:id, :td, :rr, :bn, :sn)
            """),
            {
                "id": tx.id,
                "td": task_description,
                "rr": "",
                "bn": buyer.name,
                "sn": seller.name,
            }
        )

        from app.chain import sign_transaction
        sign_transaction(db, tx)

        db.commit()
        db.refresh(tx)
        
        # Publish events
        tx_data = TransactionResponse.model_validate(tx).model_dump(mode="json")
        bus.publish_sync("tx.created", tx_data, seq=seq)
        metrics = self.get_metrics(db)
        bus.publish_sync("metrics.tick", metrics.model_dump(mode="json"))
        
        return tx

    @_with_db_retry()
    def clear_escrow(self, db: Session, transaction_id: str) -> Transaction:
        """
        Release escrowed funds to the seller after successful validation.

        Args:
            db:             Active database session.
            transaction_id: ID of the LOCKED transaction to clear.

        Returns:
            The updated CLEARED Transaction.

        Raises:
            TransactionNotFoundError: If the transaction doesn't exist.
            InvalidStateTransitionError: If the transaction isn't LOCKED.
        """
        tx = self._get_locked_tx(db, transaction_id)

        seller = db.get(Agent, tx.seller_id)
        if seller is None:
            raise LookupError(f"Seller agent '{tx.seller_id}' not found")

        # Credit seller
        seller.balance += tx.amount
        seller.total_transactions += 1
        seller.updated_at = datetime.now(timezone.utc)

        seq = bus.next_seq()
        tx.status = TransactionStatus.CLEARED
        tx.updated_at = datetime.now(timezone.utc)
        tx.seq = seq

        from app.chain import sign_transaction
        sign_transaction(db, tx)

        db.commit()
        db.refresh(tx)
        
        # Publish events
        tx_data = TransactionResponse.model_validate(tx).model_dump(mode="json")
        bus.publish_sync("tx.updated", tx_data, seq=seq)
        metrics = self.get_metrics(db)
        bus.publish_sync("metrics.tick", metrics.model_dump(mode="json"))
        
        return tx

    @_with_db_retry()
    def reject_escrow(
        self, db: Session, transaction_id: str, reason: str
    ) -> Transaction:
        """
        Refund escrowed funds to the buyer after validation failure.

        Args:
            db:             Active database session.
            transaction_id: ID of the LOCKED transaction to reject.
            reason:         Human-readable rejection reason to store.

        Returns:
            The updated REJECTED_DRIFT Transaction.

        Raises:
            TransactionNotFoundError: If the transaction doesn't exist.
            InvalidStateTransitionError: If the transaction isn't LOCKED.
        """
        tx = self._get_locked_tx(db, transaction_id)

        buyer = db.get(Agent, tx.buyer_id)
        if buyer is None:
            raise LookupError(f"Buyer agent '{tx.buyer_id}' not found")

        # Refund buyer
        buyer.balance += tx.amount
        buyer.total_rejected += 1
        buyer.updated_at = datetime.now(timezone.utc)

        seq = bus.next_seq()
        tx.status = TransactionStatus.REJECTED_DRIFT
        tx.rejection_reason = reason
        tx.updated_at = datetime.now(timezone.utc)
        tx.seq = seq

        # Sync to FTS table
        from sqlalchemy import text
        db.execute(
            text("""
                UPDATE transactions_fts 
                SET rejection_reason = :rr
                WHERE id = :id
            """),
            {"rr": reason, "id": tx.id}
        )

        from app.chain import sign_transaction
        sign_transaction(db, tx)

        db.commit()
        db.refresh(tx)
        
        # Publish events
        tx_data = TransactionResponse.model_validate(tx).model_dump(mode="json")
        bus.publish_sync("tx.updated", tx_data, seq=seq)
        metrics = self.get_metrics(db)
        bus.publish_sync("metrics.tick", metrics.model_dump(mode="json"))
        
        return tx

    def get_metrics(self, db: Session) -> MetricsResponse:
        """
        Compute aggregated dashboard metrics from the transaction history.

        Returns:
            MetricsResponse with counts, volumes, and rejection rate.
        """
        from sqlalchemy import func, select

        # Pull aggregates in a single query
        rows = db.execute(
            select(
                Transaction.status,
                func.count(Transaction.id).label("cnt"),
                func.coalesce(func.sum(Transaction.amount), 0.0).label("vol"),
            ).group_by(Transaction.status)
        ).all()

        totals: dict[str, int] = {}
        volumes: dict[str, float] = {}
        for row in rows:
            totals[row.status] = row.cnt
            volumes[row.status] = float(row.vol)

        cleared = totals.get(TransactionStatus.CLEARED, 0)
        rejected = totals.get(TransactionStatus.REJECTED_DRIFT, 0)
        locked = totals.get(TransactionStatus.LOCKED, 0)
        pending = totals.get(TransactionStatus.PENDING, 0)

        total = cleared + rejected + locked + pending
        total_volume = sum(volumes.values())
        funds_saved = volumes.get(TransactionStatus.REJECTED_DRIFT, 0.0)

        settled = cleared + rejected
        rejection_rate = (rejected / settled) if settled > 0 else 0.0

        return MetricsResponse(
            total_transactions=total,
            cleared_count=cleared,
            rejected_count=rejected,
            locked_count=locked,
            total_funds_saved=round(funds_saved, 4),
            total_volume=round(total_volume, 4),
            rejection_rate=round(rejection_rate, 4),
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _get_locked_tx(self, db: Session, transaction_id: str) -> Transaction:
        """Fetch a transaction and assert it is in LOCKED state."""
        tx = db.get(Transaction, transaction_id)
        if tx is None:
            raise TransactionNotFoundError(transaction_id)
        if tx.status != TransactionStatus.LOCKED:
            raise InvalidStateTransitionError(transaction_id, tx.status, "LOCKED")
        return tx


# Module-level singleton
ledger = EscrowLedger()
