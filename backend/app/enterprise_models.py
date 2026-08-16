import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


def _uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


class Enterprise_Orgs(Base):
    """
    Stores organizational tenant data for enterprise isolation.
    """
    __tablename__ = "enterprise_orgs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    users: Mapped[list["Users_RBAC"]] = relationship("Users_RBAC", back_populates="org")
    rules: Mapped[list["Escrow_Threshold_Rules"]] = relationship("Escrow_Threshold_Rules", back_populates="org")


class Users_RBAC(Base):
    """
    Role-Based Access Control mapping users to roles within Orgs.
    """
    __tablename__ = "users_rbac"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("enterprise_orgs.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String, nullable=False, index=True) # Typically matches an external IdP subject ID
    role: Mapped[str] = mapped_column(String, nullable=False) # e.g., 'admin', 'auditor', 'developer'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)

    org: Mapped["Enterprise_Orgs"] = relationship("Enterprise_Orgs", back_populates="users")

    __table_args__ = (
        Index("ix_users_rbac_org_user", "org_id", "user_id", unique=True),
    )


class Audit_Logs(Base):
    """
    Immutable, append-only table containing hashed event data for SOC2 compliance.
    """
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    event_type: Mapped[str] = mapped_column(String, nullable=False, index=True) # Schema Pass, Schema Fail, Escrow Lock, Escrow Release
    tx_id: Mapped[str] = mapped_column(String, nullable=True, index=True) # Associated transaction ID if any
    payload_hash: Mapped[str] = mapped_column(String, nullable=False) # SHA-256 hash of the payload
    actor_id: Mapped[str | None] = mapped_column(String, nullable=True) # Who triggered the event (System or User ID)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False, index=True)


class Escrow_Threshold_Rules(Base):
    """
    Org-specific rules for escrow thresholds (e.g., locking requiring approval for amounts > $1,000).
    """
    __tablename__ = "escrow_threshold_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(String, ForeignKey("enterprise_orgs.id"), nullable=False, index=True)
    threshold_usd: Mapped[float] = mapped_column(Float, nullable=False, default=1000.0)
    requires_approval: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)

    org: Mapped["Enterprise_Orgs"] = relationship("Enterprise_Orgs", back_populates="rules")
