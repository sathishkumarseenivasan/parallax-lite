from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
import os
import time

from app.database import get_db
from app.models import Transaction, Dispute, Agent
from app.verdict.engine import VerdictEngine
from app.verdict.dialect import normalize_to_json
from app.assertions import SCHEMA_REGISTRY
from app.ledger import ledger
from app.bus import bus
from app.schemas import TransactionResponse
from app.chain import sign_transaction

router = APIRouter(prefix="/api/disputes", tags=["disputes"])

class DisputeRequest(BaseModel):
    tx_id: str
    reason: str
    side: str # "buyer" or "seller"

@router.post("")
def file_dispute(payload: DisputeRequest, db: Session = Depends(get_db)):
    tx = db.get(Transaction, payload.tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    if tx.status not in ["CLEARED", "REJECTED_DRIFT"]:
        raise HTTPException(status_code=400, detail="Transaction must be CLEARED or REJECTED_DRIFT to dispute")
        
    if payload.side == "buyer" and tx.status != "CLEARED":
        raise HTTPException(status_code=400, detail="Buyer can only dispute a CLEARED verdict")
    if payload.side == "seller" and tx.status != "REJECTED_DRIFT":
        raise HTTPException(status_code=400, detail="Seller can only appeal a REJECTED verdict")
        
    # Mark as disputed
    original_status = tx.status
    tx.status = "DISPUTED"
    seq = bus.next_seq()
    tx.seq = seq
    
    # Actually wait, if the tx was CLEARED, funds were already released. 
    # The requirement says "re-settle payout/refund live via WS".
    # We will simulate re-settling by just doing the math right now.
    
    # Undo original balance changes for the transaction
    buyer = db.get(Agent, tx.buyer_id)
    seller = db.get(Agent, tx.seller_id)
    
    if original_status == "CLEARED":
        seller.balance -= tx.amount
        seller.total_transactions -= 1
        # put funds back into "escrow" (meaning buyer balance, logically, but we will lock it)
        # Actually in ledger, locked means buyer has been deducted but seller not paid.
    elif original_status == "REJECTED_DRIFT":
        buyer.balance -= tx.amount
        buyer.total_rejected -= 1
        
    sign_transaction(db, tx)
    db.commit()
    db.refresh(tx)
    
    # WS Event
    tx_data = TransactionResponse.model_validate(tx).model_dump(mode="json")
    bus.publish_sync("tx.disputed", tx_data, seq=seq)
    
    # 2. APPELLATE TIER (Stronger Judge)
    engine = VerdictEngine()
    engine.judge.model = os.getenv("JUDGE_APPELLATE_MODEL", "gpt-4-turbo")
    
    schema_cls = SCHEMA_REGISTRY.get(tx.expected_schema)
    expected_schema_dict = schema_cls.model_json_schema() if schema_cls else {}
    
    verdict = engine.evaluate(
        expected=expected_schema_dict,
        raw_actual=tx.actual_output or "{}",
        amount=tx.amount
    )
    
    # Outcome
    is_valid = verdict.get("entropy_score", 0) >= 0.75 # Appellate strict threshold
    
    if is_valid:
        new_status = "CLEARED"
    else:
        new_status = "REJECTED_DRIFT"
        
    outcome = "UPHELD" if new_status == original_status else "OVERTURNED"
    
    # Log dispute
    dispute = Dispute(
        tx_id=tx.id,
        side=payload.side,
        reason=payload.reason,
        outcome=outcome
    )
    db.add(dispute)
    
    # Re-settle
    tx.status = "LOCKED"
    db.commit()
    
    if new_status == "CLEARED":
        ledger.clear_escrow(db, tx.id)
    else:
        ledger.reject_escrow(db, tx.id, verdict.get("reasoning", "Appellate rejected"))
        
    return {"status": outcome, "verdict": verdict}
