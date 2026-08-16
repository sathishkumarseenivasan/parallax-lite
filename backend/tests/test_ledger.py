"""
Tests for the EscrowLedger service.
Tests cover the full state machine: locking, clearing, rejecting, and error paths.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.ledger import (
    EscrowLedger,
    InsufficientFundsError,
    InvalidStateTransitionError,
    TransactionNotFoundError,
)
from app.models import Agent, Transaction
from app.schemas import TransactionStatus


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def engine():
    """In-memory SQLite engine for isolated tests."""
    eng = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=eng)
    from sqlalchemy import text
    with eng.begin() as conn:
        conn.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS transactions_fts USING fts5(
                id, task_description, rejection_reason, buyer_name, seller_name
            );
        """))
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture()
def db(engine) -> Session:
    """Provide a fresh session and rollback after each test."""
    SessionTest = sessionmaker(bind=engine)
    session = SessionTest()
    yield session
    session.close()


@pytest.fixture()
def seeded_db(db: Session) -> Session:
    """Database pre-seeded with Agent Alpha (buyer) and Agent Beta (seller)."""
    db.add(Agent(id="agent_alpha", name="Agent Alpha", role="buyer", balance=500.0))
    db.add(Agent(id="agent_beta", name="Agent Beta", role="seller", balance=0.0))
    db.commit()
    return db


@pytest.fixture()
def escrow() -> EscrowLedger:
    return EscrowLedger()


# ---------------------------------------------------------------------------
# Test 1: Lock escrow — success path
# ---------------------------------------------------------------------------

def test_lock_escrow_success(seeded_db: Session, escrow: EscrowLedger) -> None:
    """Locking escrow should deduct buyer balance and create a LOCKED transaction."""
    tx = escrow.lock_escrow(
        db=seeded_db,
        buyer_id="agent_alpha",
        seller_id="agent_beta",
        amount=100.0,
        schema_name="PriceCheck",
        simulated_output='{"item_name":"X","price":1.0,"in_stock":true,"source_url":"http://x.com"}',
    )

    assert tx.status == TransactionStatus.LOCKED
    assert tx.amount == 100.0
    assert tx.buyer_id == "agent_alpha"
    assert tx.seller_id == "agent_beta"

    buyer = seeded_db.get(Agent, "agent_alpha")
    assert buyer is not None
    assert buyer.balance == pytest.approx(400.0)
    assert buyer.total_transactions == 1


# ---------------------------------------------------------------------------
# Test 2: Lock escrow — insufficient funds
# ---------------------------------------------------------------------------

def test_lock_escrow_insufficient_funds(seeded_db: Session, escrow: EscrowLedger) -> None:
    """Attempting to lock more than the buyer's balance should raise InsufficientFundsError."""
    with pytest.raises(InsufficientFundsError) as exc_info:
        escrow.lock_escrow(
            db=seeded_db,
            buyer_id="agent_alpha",
            seller_id="agent_beta",
            amount=9999.0,
            schema_name="PriceCheck",
        )

    err = exc_info.value
    assert err.agent_id == "agent_alpha"
    assert err.required == 9999.0
    assert err.available == 500.0

    # Balance must be unchanged after the failure
    buyer = seeded_db.get(Agent, "agent_alpha")
    assert buyer is not None
    assert buyer.balance == pytest.approx(500.0)


# ---------------------------------------------------------------------------
# Test 3: Clear escrow — success path
# ---------------------------------------------------------------------------

def test_clear_escrow_success(seeded_db: Session, escrow: EscrowLedger) -> None:
    """Clearing a LOCKED transaction should credit the seller and set status to CLEARED."""
    tx = escrow.lock_escrow(
        db=seeded_db,
        buyer_id="agent_alpha",
        seller_id="agent_beta",
        amount=50.0,
        schema_name="DataExtraction",
    )

    cleared_tx = escrow.clear_escrow(db=seeded_db, transaction_id=tx.id)

    assert cleared_tx.status == TransactionStatus.CLEARED

    seller = seeded_db.get(Agent, "agent_beta")
    assert seller is not None
    assert seller.balance == pytest.approx(50.0)
    assert seller.total_transactions == 1


# ---------------------------------------------------------------------------
# Test 4: Reject escrow — buyer refunded
# ---------------------------------------------------------------------------

def test_reject_escrow_refunds_buyer(seeded_db: Session, escrow: EscrowLedger) -> None:
    """Rejecting a LOCKED transaction should refund the buyer and record the reason."""
    original_balance = 500.0
    amount = 75.0

    tx = escrow.lock_escrow(
        db=seeded_db,
        buyer_id="agent_alpha",
        seller_id="agent_beta",
        amount=amount,
        schema_name="PriceCheck",
    )

    buyer_mid = seeded_db.get(Agent, "agent_alpha")
    assert buyer_mid is not None
    assert buyer_mid.balance == pytest.approx(original_balance - amount)

    rejected_tx = escrow.reject_escrow(
        db=seeded_db,
        transaction_id=tx.id,
        reason="Missing required field: 'in_stock'",
    )

    assert rejected_tx.status == TransactionStatus.REJECTED_DRIFT
    assert rejected_tx.rejection_reason == "Missing required field: 'in_stock'"

    buyer_after = seeded_db.get(Agent, "agent_alpha")
    assert buyer_after is not None
    assert buyer_after.balance == pytest.approx(original_balance)  # fully refunded
    assert buyer_after.total_rejected == 1

    # Seller balance must be unchanged
    seller = seeded_db.get(Agent, "agent_beta")
    assert seller is not None
    assert seller.balance == pytest.approx(0.0)


# ---------------------------------------------------------------------------
# Test 5: Full pipeline — valid output → CLEARED
# ---------------------------------------------------------------------------

def test_full_pipeline_valid_output(seeded_db: Session, escrow: EscrowLedger) -> None:
    """
    End-to-end test: valid PriceCheck output should flow through
    lock → validate → clear, leaving the seller with the funds.
    """
    import json
    from app.assertions import validator

    valid_output = json.dumps({
        "item_name": "Laptop",
        "price": 999.99,
        "currency": "USD",
        "in_stock": True,
        "source_url": "https://store.example.com/laptop",
    })

    tx = escrow.lock_escrow(
        db=seeded_db,
        buyer_id="agent_alpha",
        seller_id="agent_beta",
        amount=5.0,
        schema_name="PriceCheck",
        simulated_output=valid_output,
    )

    result = validator.validate("PriceCheck", valid_output)
    assert result.is_valid is True
    assert result.errors == []

    cleared = escrow.clear_escrow(db=seeded_db, transaction_id=tx.id)
    assert cleared.status == TransactionStatus.CLEARED

    seller = seeded_db.get(Agent, "agent_beta")
    assert seller is not None
    assert seller.balance == pytest.approx(5.0)

    buyer = seeded_db.get(Agent, "agent_alpha")
    assert buyer is not None
    assert buyer.balance == pytest.approx(495.0)


# ---------------------------------------------------------------------------
# Test 6: Full pipeline — invalid output → REJECTED_DRIFT
# ---------------------------------------------------------------------------

def test_full_pipeline_invalid_output(seeded_db: Session, escrow: EscrowLedger) -> None:
    """
    End-to-end test: invalid output (negative price) should be rejected
    and buyer should receive a full refund.
    """
    import json
    from app.assertions import validator

    bad_output = json.dumps({
        "item_name": "Scam Widget",
        "price": -99.0,  # violates gt=0 constraint
        "currency": "USD",
        "in_stock": True,
        "source_url": "https://scam.io",
    })

    tx = escrow.lock_escrow(
        db=seeded_db,
        buyer_id="agent_alpha",
        seller_id="agent_beta",
        amount=3.0,
        schema_name="PriceCheck",
        simulated_output=bad_output,
    )

    result = validator.validate("PriceCheck", bad_output)
    assert result.is_valid is False
    assert len(result.errors) > 0

    rejection_reason = "; ".join(result.errors)
    rejected = escrow.reject_escrow(
        db=seeded_db,
        transaction_id=tx.id,
        reason=rejection_reason,
    )

    assert rejected.status == TransactionStatus.REJECTED_DRIFT
    assert rejected.rejection_reason is not None

    # Buyer fully refunded
    buyer = seeded_db.get(Agent, "agent_alpha")
    assert buyer is not None
    assert buyer.balance == pytest.approx(500.0)

    # Seller untouched
    seller = seeded_db.get(Agent, "agent_beta")
    assert seller is not None
    assert seller.balance == pytest.approx(0.0)
