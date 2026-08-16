import time
from datetime import datetime, timezone, timedelta
from typing import Literal, Dict, List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db

router = APIRouter(prefix="/api/metrics", tags=["analytics"])

@router.get("/timeseries")
def get_timeseries(
    time_range: Literal["1h", "6h", "24h", "7d"] = Query("1h", alias="range"),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    if time_range == "1h":
        start_time = now - timedelta(hours=1)
        bucket = 60 * 5 # 5 min buckets
    elif time_range == "6h":
        start_time = now - timedelta(hours=6)
        bucket = 60 * 15 # 15 min buckets
    elif time_range == "24h":
        start_time = now - timedelta(hours=24)
        bucket = 60 * 60 # 1 hour buckets
    else:
        start_time = now - timedelta(days=7)
        bucket = 60 * 60 * 6 # 6 hour buckets

    query = text("""
        SELECT 
            (CAST(strftime('%s', created_at) AS INTEGER) / :bucket) * :bucket as bucket_ts,
            status,
            COUNT(id) as cnt
        FROM transactions
        WHERE created_at >= :start_time
        GROUP BY bucket_ts, status
        ORDER BY bucket_ts ASC
    """)
    
    # We must generate zero-filled buckets!
    start_ts = int(start_time.timestamp())
    start_ts = (start_ts // bucket) * bucket
    end_ts = int(now.timestamp())
    end_ts = (end_ts // bucket) * bucket
    
    buckets_dict = {}
    for ts in range(start_ts, end_ts + bucket, bucket):
        buckets_dict[ts] = {"timestamp": ts, "cleared": 0, "rejected": 0, "locked": 0, "pending": 0}
        
    result = db.execute(query, {"bucket": bucket, "start_time": start_time}).fetchall()
    
    for row in result:
        ts = row.bucket_ts
        status = row.status.lower()
        if ts in buckets_dict:
            if status == "cleared":
                buckets_dict[ts]["cleared"] += row.cnt
            elif status == "rejected_drift":
                buckets_dict[ts]["rejected"] += row.cnt
            elif status == "locked":
                buckets_dict[ts]["locked"] += row.cnt
            elif status == "pending":
                buckets_dict[ts]["pending"] += row.cnt

    return list(buckets_dict.values())

@router.get("/distributions")
def get_distributions(db: Session = Depends(get_db)):
    # Latency histogram (0-50, 50-100, 100-200, 200-500, 500+)
    # Amount histogram
    # To keep it simple, we do it in python memory as SQLite histograms are complex
    from app.models import Transaction
    from sqlalchemy import select
    
    txs = db.execute(select(Transaction.amount, Transaction.validation_time_ms)).fetchall()
    
    latency_buckets = {"0-50": 0, "50-100": 0, "100-200": 0, "200-500": 0, "500+": 0}
    amount_buckets = {"0-1": 0, "1-5": 0, "5-20": 0, "20-50": 0, "50+": 0}
    
    for tx in txs:
        amt = tx.amount
        if amt < 1: amount_buckets["0-1"] += 1
        elif amt < 5: amount_buckets["1-5"] += 1
        elif amt < 20: amount_buckets["5-20"] += 1
        elif amt < 50: amount_buckets["20-50"] += 1
        else: amount_buckets["50+"] += 1
        
        lat = tx.validation_time_ms
        if lat is not None:
            if lat < 50: latency_buckets["0-50"] += 1
            elif lat < 100: latency_buckets["50-100"] += 1
            elif lat < 200: latency_buckets["100-200"] += 1
            elif lat < 500: latency_buckets["200-500"] += 1
            else: latency_buckets["500+"] += 1

    return {
        "latency": latency_buckets,
        "amount": amount_buckets
    }

@router.get("/heatmap")
def get_heatmap(db: Session = Depends(get_db)):
    # 7 days (0-6 where 0 is Monday) x 24 hours
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(days=7)
    
    query = text("""
        SELECT 
            CAST(strftime('%w', created_at) AS INTEGER) as day_of_week,
            CAST(strftime('%H', created_at) AS INTEGER) as hour_of_day,
            status,
            COUNT(id) as cnt
        FROM transactions
        WHERE created_at >= :start_time
        GROUP BY day_of_week, hour_of_day, status
    """)
    result = db.execute(query, {"start_time": start_time}).fetchall()
    
    heatmap = []
    for d in range(7):
        for h in range(24):
            heatmap.append({"day": d, "hour": h, "cleared": 0, "rejected": 0, "total": 0})
            
    # Quick lookup
    hm_dict = {(d, h): idx for idx, (d, h) in enumerate([(day, hour) for day in range(7) for hour in range(24)])}
    
    for row in result:
        # SQLite %w is 0-6 where 0 is Sunday.
        d = row.day_of_week
        h = row.hour_of_day
        idx = hm_dict[(d, h)]
        heatmap[idx]["total"] += row.cnt
        if row.status.lower() == "cleared":
            heatmap[idx]["cleared"] += row.cnt
        elif row.status.lower() == "rejected_drift":
            heatmap[idx]["rejected"] += row.cnt
            
    return heatmap
