import hashlib
import json
from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import select, asc
from app.models import Transaction, SystemMeta

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

def canonical_tx(tx: Transaction) -> str:
    """Return a deterministic string representation of the transaction payload."""
    payload = {
        "id": tx.id,
        "buyer_id": tx.buyer_id,
        "seller_id": tx.seller_id,
        "amount": float(tx.amount) if tx.amount is not None else 0.0,
        "status": tx.status,
        "expected_schema": tx.expected_schema,
        "actual_output": tx.actual_output,
        "rejection_reason": tx.rejection_reason,
        "parent_tx_id": tx.parent_tx_id,
        "seq": tx.seq
    }
    tx_str = json.dumps(payload, sort_keys=True)
    
    # ADR-010 VERDICT RECEIPTS ON THE INTEGRITY CHAIN
    vd_str = tx.verdict_breakdown or "{}"
    if isinstance(vd_str, str):
        try:
            vd_parsed = json.loads(vd_str)
            vd_str = json.dumps(vd_parsed, sort_keys=True)
        except json.JSONDecodeError:
            pass
            
    return tx_str + vd_str

def get_last_hash(db: Session) -> str:
    stmt = select(SystemMeta).where(SystemMeta.key == "last_record_hash")
    meta = db.execute(stmt).scalar_one_or_none()
    return meta.value if meta else GENESIS_HASH

def update_last_hash(db: Session, new_hash: str):
    stmt = select(SystemMeta).where(SystemMeta.key == "last_record_hash")
    meta = db.execute(stmt).scalar_one_or_none()
    if meta:
        meta.value = new_hash
    else:
        meta = SystemMeta(key="last_record_hash", value=new_hash)
        db.add(meta)

def compute_record_hash(prev_hash: str, tx: Transaction) -> str:
    canonical = canonical_tx(tx)
    data = prev_hash + canonical
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def sign_transaction(db: Session, tx: Transaction):
    """Sign the transaction on write by computing its hash based on the chain."""
    # We expect tx.seq to be set before signing, if it matters.
    # Actually, if we're assigning seq, we should do it first.
    prev_hash = get_last_hash(db)
    new_hash = compute_record_hash(prev_hash, tx)
    tx.record_hash = new_hash
    update_last_hash(db, new_hash)

def verify_chain(db: Session) -> dict[str, Any]:
    """Verify the entire integrity chain."""
    stmt = select(Transaction).where(Transaction.record_hash.isnot(None)).order_by(asc(Transaction.seq))
    transactions = db.scalars(stmt).all()

    verified_count = 0
    first_broken = None
    
    current_hash = GENESIS_HASH

    for tx in transactions:
        expected = compute_record_hash(current_hash, tx)
        if not tx.record_hash or tx.record_hash != expected:
            first_broken = tx.seq
            break
        current_hash = expected
        verified_count += 1
        
    return {
        "valid": first_broken is None,
        "head_hash": current_hash if transactions else GENESIS_HASH,
        "verified_count": verified_count,
        "first_broken_seq": first_broken
    }
