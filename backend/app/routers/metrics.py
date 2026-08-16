"""
Metrics router — aggregated dashboard statistics.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.ledger import ledger
from app.schemas import MetricsResponse

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("", response_model=MetricsResponse)
def get_metrics(db: Session = Depends(get_db)) -> MetricsResponse:
    """
    Return aggregated metrics for the Parallax Lite dashboard.

    Includes total transaction counts by status, total volume,
    funds saved from rejections, and the overall rejection rate.
    """
    return ledger.get_metrics(db)
