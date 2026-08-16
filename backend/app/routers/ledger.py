from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.chain import verify_chain

router = APIRouter(prefix="/api/ledger", tags=["ledger"])

@router.get("/verify")
def verify_ledger(db: Session = Depends(get_db)):
    """Verify the Escrow Integrity Chain."""
    return verify_chain(db)

@router.get("/cascade/{tx_id}")
def get_cascade(tx_id: str, db: Session = Depends(get_db)):
    """MO-2: Drift Cascade Tracer. Trace all downstream spawned transactions."""
    from app.cascade import trace_cascade
    result = trace_cascade(db, tx_id)
    return {"cascade": result}
