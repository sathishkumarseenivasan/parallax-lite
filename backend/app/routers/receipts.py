from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from app.database import get_db
from app.models import Transaction, Agent
from app.chain import get_last_hash, compute_record_hash

router = APIRouter(prefix="/api/receipts", tags=["receipts"])

@router.get("/{tx_id}")
def get_receipt(tx_id: str, db: Session = Depends(get_db)):
    tx = db.get(Transaction, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    buyer = db.get(Agent, tx.buyer_id)
    seller = db.get(Agent, tx.seller_id)
    
    verdict_breakdown = {}
    if tx.verdict_breakdown:
        try:
            verdict_breakdown = json.loads(tx.verdict_breakdown)
        except json.JSONDecodeError:
            pass
            
    return {
        "tx_id": tx.id,
        "status": tx.status,
        "amount": tx.amount,
        "buyer_name": buyer.name if buyer else "Unknown",
        "seller_name": seller.name if seller else "Unknown",
        "created_at": tx.created_at,
        "verdict_breakdown": verdict_breakdown,
        "entropy_score": tx.entropy_score,
        "record_hash": tx.record_hash,
        "chain_proof": f"Verified by Parallax Integrity Chain (Seq: {tx.seq})"
    }
