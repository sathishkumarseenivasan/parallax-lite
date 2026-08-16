from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from app.database import get_db
from app.models import JudgeCall

router = APIRouter(prefix="/api/judge", tags=["judge"])

class UsageResponse(BaseModel):
    total_calls: int
    total_cost_usd: float
    cache_hits: int
    cache_hit_rate: float
    avg_cost_per_verdict: float
    cache_saved_usd: float

@router.get("/usage", response_model=UsageResponse)
def get_judge_usage(db: Session = Depends(get_db)):
    calls = db.query(JudgeCall).all()
    total = len(calls)
    if total == 0:
        return UsageResponse(
            total_calls=0,
            total_cost_usd=0.0,
            cache_hits=0,
            cache_hit_rate=0.0,
            avg_cost_per_verdict=0.0,
            cache_saved_usd=0.0
        )
    
    total_cost = sum(c.cost_usd for c in calls)
    cache_hits = sum(1 for c in calls if c.cache_hit)
    cache_hit_rate = cache_hits / total if total > 0 else 0.0
    avg_cost = total_cost / total if total > 0 else 0.0
    
    # Estimate cache savings by avg cost of non-cached calls
    non_cached = [c for c in calls if not c.cache_hit]
    avg_cost_non_cached = sum(c.cost_usd for c in non_cached) / len(non_cached) if non_cached else 0.0
    cache_saved = cache_hits * avg_cost_non_cached

    return UsageResponse(
        total_calls=total,
        total_cost_usd=round(total_cost, 6),
        cache_hits=cache_hits,
        cache_hit_rate=round(cache_hit_rate, 4),
        avg_cost_per_verdict=round(avg_cost, 6),
        cache_saved_usd=round(cache_saved, 6)
    )
