from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, func, text

from app.models import Transaction, Agent, Dispute

def get_agent_trust_score(db: Session, agent_id: str) -> dict:
    """Compute Parallax Trust Score™ for a given agent over a rolling 7-day window."""
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    agent = db.get(Agent, agent_id)
    if not agent:
        return {"error": "Agent not found"}

    stmt = select(
        func.count(Transaction.id).label("cnt"),
        func.avg(Transaction.entropy_score).label("avg_entropy"),
        func.avg(Transaction.validation_time_ms).label("avg_latency"),
        func.sum(
            func.case(
                (Transaction.status == "REJECTED_DRIFT", 1),
                else_=0
            )
        ).label("rejections")
    ).where(
        Transaction.seller_id == agent_id,
        Transaction.created_at >= seven_days_ago,
        Transaction.status.in_(["CLEARED", "REJECTED_DRIFT"])
    )
    
    res = db.execute(stmt).fetchone()
    if not res or res.cnt == 0:
        return {
            "score": 0.0,
            "verified_by_court": False,
            "components": {
                "avg_entropy": 0.0,
                "rejection_rate": 0.0,
                "latency_score": 0.0,
                "dispute_loss_rate": 0.0,
                "volume_consistency": 0.0
            }
        }
    
    cnt = res.cnt
    avg_entropy = float(res.avg_entropy or 0.0)
    avg_latency = float(res.avg_latency or 0.0)
    rejections = int(res.rejections or 0)
    
    rejection_rate = rejections / cnt
    
    # latency_score = clamp(1 − (avg_latency−1000)/4000)
    latency_score = 1.0 - ((avg_latency - 1000) / 4000)
    latency_score = max(0.0, min(1.0, latency_score))
    
    # Dispute loss rate
    dispute_stmt = select(
        func.count(Dispute.id).label("total_disputes"),
        func.sum(func.case((Dispute.outcome == "OVERTURNED", 1), else_=0)).label("lost_disputes")
    ).join(Transaction, Dispute.tx_id == Transaction.id).where(
        Transaction.seller_id == agent_id,
        Dispute.created_at >= seven_days_ago
    )
    
    dispute_res = db.execute(dispute_stmt).fetchone()
    disputes_total = dispute_res.total_disputes if dispute_res else 0
    disputes_lost = dispute_res.lost_disputes if dispute_res else 0
    dispute_loss_rate = disputes_lost / disputes_total if disputes_total > 0 else 0.0
    
    # volume_consistency = 1 − normalized_variance of daily volume
    daily_stmt = select(
        func.date(Transaction.created_at).label("day"),
        func.count(Transaction.id).label("daily_cnt")
    ).where(
        Transaction.seller_id == agent_id,
        Transaction.created_at >= seven_days_ago
    ).group_by(func.date(Transaction.created_at))
    
    daily_rows = db.execute(daily_stmt).all()
    vals = [row.daily_cnt for row in daily_rows]
    while len(vals) < 7:
        vals.append(0)
        
    mean_val = sum(vals) / 7
    if mean_val == 0:
        volume_consistency = 0.0
    else:
        variance = sum((v - mean_val) ** 2 for v in vals) / 7
        stddev = variance ** 0.5
        normalized_variance = stddev / mean_val
        volume_consistency = max(0.0, 1.0 - normalized_variance)

    score = 100 * (
        (0.4 * avg_entropy) + 
        (0.2 * (1.0 - rejection_rate)) + 
        (0.15 * latency_score) + 
        (0.15 * (1.0 - dispute_loss_rate)) +
        (0.1 * volume_consistency)
    )

    return {
        "score": round(score, 2),
        "verified_by_court": cnt >= 10,
        "components": {
            "avg_entropy": round(avg_entropy, 4),
            "rejection_rate": round(rejection_rate, 4),
            "latency_score": round(latency_score, 4),
            "dispute_loss_rate": round(dispute_loss_rate, 4),
            "volume_consistency": round(volume_consistency, 4)
        }
    }
