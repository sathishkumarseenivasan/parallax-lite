import base64
import hashlib
import time
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Agent, Transaction
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["public"])

class TrustPayload(BaseModel):
    agent_id: str
    trust_score: float
    verdict_count: int
    dispute_record: dict
    timestamp: int
    signature: str

def sign_payload(payload_str: str) -> str:
    # Deterministic pseudo-signature for the demo using a mock env key
    secret = "PARALLAX_SECRET_KEY_V1"
    raw = f"{payload_str}:{secret}"
    return hashlib.sha256(raw.encode()).hexdigest()

@router.get("/api/public/agents/{agent_id}/trust", response_model=TrustPayload)
def get_public_trust(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Calculate verdict count and disputes
    txs = db.query(Transaction).filter((Transaction.buyer_id == agent_id) | (Transaction.seller_id == agent_id)).all()
    verdicts = sum(1 for tx in txs if tx.verdict_breakdown)
    disputes = sum(1 for tx in txs if tx.status == "DISPUTED")
    
    score = agent.trust_score or 0.0
    ts = int(time.time())
    
    payload_str = f"{agent_id}:{score}:{verdicts}:{disputes}:{ts}"
    sig = sign_payload(payload_str)
    
    return TrustPayload(
        agent_id=agent_id,
        trust_score=score,
        verdict_count=verdicts,
        dispute_record={"disputes": disputes},
        timestamp=ts,
        signature=sig
    )

@router.get("/badges/{agent_id}.svg")
def get_trust_badge(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter(Agent.id == agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    score = agent.trust_score or 0.0
    color = "#10B981" if score >= 85 else "#F59E0B" if score >= 60 else "#EF4444"
    
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="220" height="28" viewBox="0 0 220 28">
  <rect width="220" height="28" rx="4" fill="#111827"/>
  <rect x="150" width="70" height="28" rx="4" fill="{color}"/>
  <text x="10" y="19" font-family="monospace" font-size="11" font-weight="bold" fill="#F3F4F6">PARALLAX VERIFIED</text>
  <text x="158" y="19" font-family="monospace" font-size="11" font-weight="bold" fill="#FFFFFF">TRUST {int(score)}</text>
</svg>"""
    return Response(content=svg, media_type="image/svg+xml")
