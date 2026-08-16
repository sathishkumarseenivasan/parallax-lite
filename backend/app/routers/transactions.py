"""
Transactions router — submit tasks and query the transaction ledger.
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.assertions import validator
from app.database import get_db
from app.ledger import (
    InsufficientFundsError,
    InvalidStateTransitionError,
    TransactionNotFoundError,
    ledger,
)
from app.models import Transaction
from app.schemas import TaskSubmission, TransactionResponse, TransactionStatus

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.post("/submit", response_model=TransactionResponse, status_code=201)
def submit_task(payload: TaskSubmission, db: Session = Depends(get_db)) -> Transaction:
    """
    Execute a full escrow pipeline for an agent-to-agent task.

    1. Lock funds from buyer in escrow.
    2. Validate seller output against expected schema.
    3. Clear (pay seller) or Reject (refund buyer) based on result.

    Returns the final transaction record.
    """
    # Step 1: Lock escrow
    try:
        tx = ledger.lock_escrow(
            db=db,
            buyer_id=payload.buyer_id,
            seller_id=payload.seller_id,
            amount=payload.payment_amount,
            schema_name=payload.expected_schema_name,
            simulated_output=payload.simulated_output,
            task_description=payload.task_description,
        )
    except InsufficientFundsError as exc:
        raise HTTPException(status_code=402, detail=str(exc)) from exc
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    from app.verdict.engine import engine
    from app.errors import SemanticDriftError
    from app.assertions import SCHEMA_REGISTRY
    from app.models import JudgeCall

    schema_cls = SCHEMA_REGISTRY.get(payload.expected_schema_name)
    if not schema_cls:
        raise HTTPException(status_code=400, detail=f"Unknown schema: {payload.expected_schema_name}")

    expected_schema_dict = schema_cls.model_json_schema()

    # Step 2: Validate output via Verdict Engine
    is_valid = False
    rejection_reason = ""
    try:
        verdict = engine.evaluate(
            expected=expected_schema_dict,
            raw_actual=payload.simulated_output,
            amount=payload.payment_amount
        )
        is_valid = True
        tx.validation_time_ms = verdict.get("latency_ms", 0)
        tx.entropy_score = verdict.get("entropy_score", 1.0)
        import json
        tx.verdict_breakdown = json.dumps(verdict)
        
        # Insert JudgeCall if LLM was used (provider != "deterministic")
        provider = verdict.get("provider", "deterministic")
        if provider != "deterministic":
            jc = JudgeCall(
                provider=provider,
                model=verdict.get("model", "unknown"),
                prompt_tokens=0,
                completion_tokens=0,
                cost_usd=0.0004, # Stub cost
                stage=3 if not verdict.get("is_fallback") else 2,
                cache_hit=verdict.get("cache_hit", False)
            )
            db.add(jc)

    except SemanticDriftError as e:
        is_valid = False
        rejection_reason = str(e)
        tx.validation_time_ms = 0

    db.commit()

    # Step 3: Settle escrow
    try:
        if is_valid:
            tx = ledger.clear_escrow(db=db, transaction_id=tx.id)
        else:
            tx = ledger.reject_escrow(db=db, transaction_id=tx.id, reason=rejection_reason)
    except (TransactionNotFoundError, InvalidStateTransitionError) as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

    return tx


@router.get("", response_model=list[TransactionResponse])
def list_transactions(
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="created_at"),
    dir: str = Query(default="desc"),
    status: Optional[str] = Query(default=None),
    since_seq: Optional[int] = Query(default=None),
) -> list[Transaction]:
    """
    List recent transactions.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import class_mapper

    stmt = select(Transaction)

    if status:
        try:
            normalized = TransactionStatus(status.upper())
        except ValueError:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid status '{status}'. Must be one of {[s.value for s in TransactionStatus]}",
            )
        stmt = stmt.where(Transaction.status == normalized)

    if since_seq is not None:
        stmt = stmt.where(Transaction.seq > since_seq)

    # Sort
    mapper = class_mapper(Transaction)
    if sort in mapper.columns:
        col = mapper.columns[sort]
        if dir.lower() == "asc":
            stmt = stmt.order_by(col.asc())
        else:
            stmt = stmt.order_by(col.desc())
    else:
        stmt = stmt.order_by(Transaction.created_at.desc())

    # Pagination
    stmt = stmt.offset(offset).limit(limit)

    return list(db.execute(stmt).scalars().all())


@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(transaction_id: str, db: Session = Depends(get_db)) -> Transaction:
    """Retrieve a single transaction by its UUID."""
    tx = db.get(Transaction, transaction_id)
    if tx is None:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found")
    return tx
