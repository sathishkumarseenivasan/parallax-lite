from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.trust import get_agent_trust_score

router = APIRouter(prefix="/api/trust", tags=["trust"])

@router.get("/{agent_id}")
def get_trust_score(agent_id: str, db: Session = Depends(get_db)):
    """Get the Parallax Trust Score™ for an agent."""
    res = get_agent_trust_score(db, agent_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res
