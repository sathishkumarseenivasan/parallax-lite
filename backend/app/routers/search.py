from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db

router = APIRouter(prefix="/api/search", tags=["search"])

@router.get("")
def search_transactions(q: str, db: Session = Depends(get_db)):
    if not q or not q.strip():
        return []
        
    query = text("""
        SELECT 
            t.id, 
            t.buyer_id, 
            t.seller_id, 
            t.amount, 
            t.status, 
            t.expected_schema, 
            t.actual_output, 
            t.rejection_reason,
            t.validation_time_ms,
            t.created_at, 
            t.updated_at,
            highlight(transactions_fts, 1, '<mark>', '</mark>') as snippet_task,
            highlight(transactions_fts, 2, '<mark>', '</mark>') as snippet_reason,
            bm25(transactions_fts) as rank
        FROM transactions_fts
        JOIN transactions t ON transactions_fts.id = t.id
        WHERE transactions_fts MATCH :q
        ORDER BY rank
        LIMIT 20
    """)
    result = db.execute(query, {"q": q}).fetchall()
    
    hits = []
    for row in result:
        d = dict(row._mapping)
        # We need to construct snippets carefully
        snippets = []
        if d["snippet_task"]:
            snippets.append(d["snippet_task"])
        if d["snippet_reason"]:
            snippets.append(d["snippet_reason"])
            
        d["snippets"] = snippets
        del d["snippet_task"]
        del d["snippet_reason"]
        hits.append(d)
        
    return hits
