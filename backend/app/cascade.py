from typing import Any
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import Transaction

def trace_cascade(db: Session, start_tx_id: str) -> list[dict[str, Any]]:
    """
    Given a starting transaction ID, perform a Breadth-First Search (BFS)
    to find all downstream transactions that cascaded from it (MO-2).
    Returns a list of transaction dictionaries.
    """
    queue = [start_tx_id]
    visited = set()
    result = []
    
    while queue:
        current_id = queue.pop(0)
        if current_id in visited:
            continue
        visited.add(current_id)
        
        tx = db.get(Transaction, current_id)
        if tx:
            result.append({
                "id": tx.id,
                "buyer_id": tx.buyer_id,
                "seller_id": tx.seller_id,
                "amount": tx.amount,
                "status": tx.status,
                "parent_tx_id": tx.parent_tx_id,
                "expected_schema": tx.expected_schema,
                "rejection_reason": tx.rejection_reason,
                "created_at": tx.created_at.isoformat() if tx.created_at else None,
            })
            
            stmt = select(Transaction.id).where(Transaction.parent_tx_id == current_id)
            children_ids = db.scalars(stmt).all()
            queue.extend(children_ids)
            
    return result
