from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.chain import verify_chain
from app.models import Transaction
import os

router = APIRouter(prefix="/api/system", tags=["system"])

@router.get("/doctor")
def system_doctor(db: Session = Depends(get_db)):
    """Internal doctor endpoint for CLI."""
    # DB health
    try:
        with engine.connect() as conn:
            journal_mode = conn.execute(text("PRAGMA journal_mode")).scalar()
        wal_enabled = str(journal_mode).lower() == "wal"
        migrations_ok = True
    except Exception:
        wal_enabled = False
        migrations_ok = False
        
    # FTS
    try:
        tx_count = db.query(Transaction).count()
        with engine.connect() as conn:
            fts_count = conn.execute(text("SELECT COUNT(*) FROM transactions_fts")).scalar()
        fts_synced = tx_count == fts_count
    except Exception:
        fts_synced = False
        
    # Judge
    api_key = os.getenv("JUDGE_API_KEY", "")
    masked_key = f"{api_key[:4]}...{api_key[-4:]}" if len(api_key) > 8 else "UNSET"
    judge_status = "configured" if api_key else "missing"
    
    # Chain
    try:
        chain_result = verify_chain(db)
        chain_valid = chain_result.get("valid", False)
        chain_head = chain_result.get("head")
    except Exception:
        chain_valid = False
        chain_head = None
        
    return {
        "db_health": {"wal_enabled": wal_enabled, "migrations_ok": migrations_ok},
        "fts_sync": {"synced": fts_synced},
        "judge_provider": {"status": judge_status, "masked_key": masked_key},
        "chain_head": {"valid": chain_valid, "head_id": chain_head}
    }
