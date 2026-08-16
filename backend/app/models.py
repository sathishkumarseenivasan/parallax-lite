"""
SQLAlchemy ORM models for Parallax Lite.
All models use UUID primary keys and proper indexes for query performance.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


def _uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


class Agent(Base):
    """
    Represents an AI agent that can act as buyer, seller, or validator.
    Tracks wallet balance and transaction statistics.
    """

    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String, nullable=False)  # buyer | seller | validator
    balance: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_transactions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_rejected: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    # Relationships
    purchases: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        foreign_keys="Transaction.buyer_id",
        back_populates="buyer",
    )
    sales: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        foreign_keys="Transaction.seller_id",
        back_populates="seller",
    )

    def __repr__(self) -> str:
        return f"<Agent id={self.id!r} name={self.name!r} role={self.role!r} balance={self.balance}>"


class Transaction(Base):
    """
    Represents an escrow-managed agent-to-agent transaction.
    Tracks the full lifecycle from PENDING → LOCKED → CLEARED | REJECTED_DRIFT.
    """

    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    buyer_id: Mapped[str] = mapped_column(
        String, ForeignKey("agents.id"), nullable=False, index=True
    )
    seller_id: Mapped[str] = mapped_column(
        String, ForeignKey("agents.id"), nullable=False, index=True
    )
    # MO-2 Drift Cascade
    parent_tx_id: Mapped[str | None] = mapped_column(
        String, ForeignKey("transactions.id"), nullable=True, index=True
    )
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING", index=True
    )
    # JSON string of the expected Pydantic schema definition
    expected_schema: Mapped[str] = mapped_column(String, nullable=False)
    # Raw output from the seller agent
    actual_output: Mapped[str | None] = mapped_column(String, nullable=True)
    # Why validation failed (nullable for CLEARED transactions)
    rejection_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    # How long validation took in milliseconds
    validation_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    # MO-1 Trust Score / Entropy
    entropy_score: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    # JSON string of verdict breakdown
    verdict_breakdown: Mapped[str | None] = mapped_column(String, nullable=True)
    seq: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # MO-5 Integrity Chain hash
    record_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    # Relationships
    buyer: Mapped["Agent"] = relationship(
        "Agent", foreign_keys=[buyer_id], back_populates="purchases"
    )
    seller: Mapped["Agent"] = relationship(
        "Agent", foreign_keys=[seller_id], back_populates="sales"
    )

    # Composite indexes for common query patterns
    __table_args__ = (
        Index("ix_transactions_status_created", "status", "created_at"),
        Index("ix_transactions_buyer_created", "buyer_id", "created_at"),
        Index("ix_transactions_seller_created", "seller_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Transaction id={self.id!r} status={self.status!r} amount={self.amount}>"

class Dispute(Base):
    """
    Tracks disputes filed against verdicts.
    """
    __tablename__ = "disputes"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    tx_id: Mapped[str] = mapped_column(String, ForeignKey("transactions.id"), nullable=False, index=True)
    side: Mapped[str] = mapped_column(String, nullable=False) # "buyer" or "seller"
    reason: Mapped[str] = mapped_column(String, nullable=False)
    outcome: Mapped[str] = mapped_column(String, nullable=False, default="PENDING") # UPHELD | OVERTURNED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

class SystemMeta(Base):
    """
    Key-value store for global system metadata (e.g. sequence numbers).
    """
    __tablename__ = "system_meta"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(String, nullable=False)

class JudgeCall(Base):
    """
    COST METERING
    Tracks cost and latency of the Verdict Engine LLM calls.
    """
    __tablename__ = "judge_calls"
    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    stage: Mapped[int] = mapped_column(Integer, nullable=False) # 2 or 3
    cache_hit: Mapped[bool] = mapped_column(Integer, default=False, nullable=False) # Boolean as 0/1 in sqlite
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)


