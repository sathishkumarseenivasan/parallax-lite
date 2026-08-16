"""
Pydantic V2 schemas for request/response validation.
These are the API contract types — separate from SQLAlchemy ORM models.
"""
from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class TransactionStatus(str, Enum):
    """Valid transaction lifecycle states."""
    PENDING = "PENDING"
    LOCKED = "LOCKED"
    CLEARED = "CLEARED"
    REJECTED_DRIFT = "REJECTED_DRIFT"
    REFUNDED = "REFUNDED"
    DISPUTED = "DISPUTED"


class AgentRole(str, Enum):
    """Valid agent roles."""
    BUYER = "buyer"
    SELLER = "seller"
    VALIDATOR = "validator"


# ---------------------------------------------------------------------------
# Agent schemas
# ---------------------------------------------------------------------------

class AgentResponse(BaseModel):
    """Public representation of an agent."""
    id: str
    name: str
    role: AgentRole
    balance: float
    total_transactions: int
    total_rejected: int
    created_at: datetime
    # MO-1 Trust Score
    trust_score: float | None = None

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "agent_alpha",
                "name": "Agent Alpha",
                "role": "buyer",
                "balance": 1000.0,
                "total_transactions": 15,
                "total_rejected": 2,
                "created_at": "2026-08-16T00:00:00Z",
                "trust_score": 0.95
            }
        }
    }


class AgentCreate(BaseModel):
    """Payload for creating a new agent."""
    id: str = Field(..., min_length=1, max_length=64)
    name: str = Field(..., min_length=1, max_length=128)
    role: AgentRole
    balance: float = Field(default=0.0, ge=0.0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "agent_gamma",
                "name": "Agent Gamma",
                "role": "buyer",
                "balance": 500.0
            }
        }
    }


# ---------------------------------------------------------------------------
# Transaction schemas
# ---------------------------------------------------------------------------

class TransactionResponse(BaseModel):
    """Public representation of a transaction."""
    id: str
    buyer_id: str
    seller_id: str
    amount: float
    status: TransactionStatus
    expected_schema: str
    actual_output: Optional[str] = None
    rejection_reason: Optional[str] = None
    validation_time_ms: Optional[float] = None
    entropy_score: float = 1.0
    verdict_breakdown: Optional[str] = None
    parent_tx_id: Optional[str] = None
    seq: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "buyer_id": "agent_alpha",
                "seller_id": "agent_beta",
                "amount": 5.0,
                "status": "CLEARED",
                "expected_schema": "PriceCheck",
                "actual_output": '{"item_name": "MacBook"}',
                "rejection_reason": None,
                "validation_time_ms": 12.5,
                "seq": 1001,
                "created_at": "2026-08-16T00:00:00Z",
                "updated_at": "2026-08-16T00:00:05Z"
            }
        }
    }


class TaskSubmission(BaseModel):
    """
    Payload for submitting a new agent-to-agent task.
    The caller provides a simulated_output to test the validation pipeline.
    """
    buyer_id: str = Field(..., description="ID of the paying agent")
    seller_id: str = Field(..., description="ID of the agent delivering work")
    task_description: str = Field(..., min_length=1, max_length=1024)
    expected_schema_name: str = Field(
        ...,
        description="One of: PriceCheck, DataExtraction, CodeGeneration",
    )
    payment_amount: float = Field(..., gt=0.0, le=10_000.0)
    simulated_output: str = Field(
        ..., description="Raw string output from the seller agent (JSON expected)"
    )

    @field_validator("expected_schema_name")
    @classmethod
    def validate_schema_name(cls, v: str) -> str:
        """Ensure the schema name is one we support."""
        valid = {"PriceCheck", "DataExtraction", "CodeGeneration"}
        if v not in valid:
            raise ValueError(f"expected_schema_name must be one of {valid}")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "buyer_id": "agent_alpha",
                "seller_id": "agent_beta",
                "task_description": "Extract price from Amazon",
                "expected_schema_name": "PriceCheck",
                "payment_amount": 5.0,
                "simulated_output": '{"item_name": "MacBook", "price": 1200.0, "currency": "USD", "in_stock": true, "source_url": "https://amazon.com"}'
            }
        }
    }


# ---------------------------------------------------------------------------
# Metrics schemas
# ---------------------------------------------------------------------------

class MetricsResponse(BaseModel):
    """Aggregated dashboard metrics."""
    total_transactions: int
    cleared_count: int
    rejected_count: int
    locked_count: int
    total_funds_saved: float = Field(
        ..., description="Sum of amounts refunded due to drift rejections"
    )
    total_volume: float = Field(..., description="Total amount across all transactions")
    rejection_rate: float = Field(..., description="Fraction of non-pending txns rejected")

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_transactions": 100,
                "cleared_count": 80,
                "rejected_count": 15,
                "locked_count": 5,
                "total_funds_saved": 45.5,
                "total_volume": 350.0,
                "rejection_rate": 0.1578
            }
        }
    }


# ---------------------------------------------------------------------------
# Health schema
# ---------------------------------------------------------------------------

class FeaturesResponse(BaseModel):
    public_endpoints: bool
    rate_limits: bool
    machine_onboarding: bool
    seed: bool
    simulate: bool

class HealthResponse(BaseModel):
    """API health check response."""
    status: str
    version: str
    database: str
    mode: str
    features: FeaturesResponse

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "ok",
                "version": "0.6.0",
                "database": "sqlite",
                "mode": "local",
                "features": {
                    "public_endpoints": True,
                    "rate_limits": False,
                    "machine_onboarding": True,
                    "seed": True,
                    "simulate": True
                }
            }
        }
    }
