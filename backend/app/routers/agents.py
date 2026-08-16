"""
Agents router — manage and query agent wallets.
"""
import json
import random
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.assertions import SCHEMA_REGISTRY, validator
from app.database import get_db
from app.ledger import ledger
from app.models import Agent, Transaction
from app.schemas import AgentCreate, AgentResponse, TransactionStatus

router = APIRouter(prefix="/api/agents", tags=["agents"])


@router.get("", response_model=list[AgentResponse])
def list_agents(
    db: Session = Depends(get_db),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="created_at"),
    dir: str = Query(default="desc"),
    since_seq: int | None = Query(default=None),
) -> list[AgentResponse]:
    """List all registered agents with their current balances."""
    from sqlalchemy import select
    from sqlalchemy.orm import class_mapper
    from app.trust import get_agent_trust_score

    stmt = select(Agent)

    mapper = class_mapper(Agent)
    if sort in mapper.columns:
        col = mapper.columns[sort]
        if dir.lower() == "asc":
            stmt = stmt.order_by(col.asc())
        else:
            stmt = stmt.order_by(col.desc())
    else:
        stmt = stmt.order_by(Agent.created_at.desc())

    stmt = stmt.offset(offset).limit(limit)

    agents = db.scalars(stmt).all()
    
    if not agents:
        return []
        
    agent_ids = [a.id for a in agents]
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    
    # Bulk query 1: basic stats
    from sqlalchemy import select, func
    from app.models import Transaction, Dispute
    
    stats_stmt = select(
        Transaction.seller_id,
        func.count(Transaction.id).label("cnt"),
        func.avg(Transaction.entropy_score).label("avg_entropy"),
        func.avg(Transaction.validation_time_ms).label("avg_latency"),
        func.sum(func.case((Transaction.status == "REJECTED_DRIFT", 1), else_=0)).label("rejections")
    ).where(
        Transaction.seller_id.in_(agent_ids),
        Transaction.created_at >= seven_days_ago,
        Transaction.status.in_(["CLEARED", "REJECTED_DRIFT"])
    ).group_by(Transaction.seller_id)
    
    stats_rows = db.execute(stats_stmt).all()
    stats_map = {row.seller_id: row for row in stats_rows}
    
    # Bulk query 2: disputes
    disp_stmt = select(
        Transaction.seller_id,
        func.count(Dispute.id).label("total_disputes"),
        func.sum(func.case((Dispute.outcome == "OVERTURNED", 1), else_=0)).label("lost_disputes")
    ).join(Transaction, Dispute.tx_id == Transaction.id).where(
        Transaction.seller_id.in_(agent_ids),
        Dispute.created_at >= seven_days_ago
    ).group_by(Transaction.seller_id)
    
    disp_rows = db.execute(disp_stmt).all()
    disp_map = {row.seller_id: row for row in disp_rows}
    
    # Bulk query 3: daily volume
    daily_stmt = select(
        Transaction.seller_id,
        func.date(Transaction.created_at).label("day"),
        func.count(Transaction.id).label("daily_cnt")
    ).where(
        Transaction.seller_id.in_(agent_ids),
        Transaction.created_at >= seven_days_ago
    ).group_by(Transaction.seller_id, func.date(Transaction.created_at))
    
    daily_rows = db.execute(daily_stmt).all()
    import collections
    daily_map = collections.defaultdict(list)
    for row in daily_rows:
        daily_map[row.seller_id].append(row.daily_cnt)
    
    results = []
    for a in agents:
        res = AgentResponse.model_validate(a)
        
        # Calculate trust score
        stats = stats_map.get(a.id)
        if not stats or stats.cnt == 0:
            res.trust_score = 0.0
            results.append(res)
            continue
            
        cnt = stats.cnt
        avg_entropy = float(stats.avg_entropy or 0.0)
        avg_latency = float(stats.avg_latency or 0.0)
        rejections = int(stats.rejections or 0)
        rejection_rate = rejections / cnt
        
        latency_score = max(0.0, min(1.0, 1.0 - ((avg_latency - 1000) / 4000)))
        
        disp = disp_map.get(a.id)
        disputes_total = disp.total_disputes if disp else 0
        disputes_lost = disp.lost_disputes if disp else 0
        dispute_loss_rate = disputes_lost / disputes_total if disputes_total > 0 else 0.0
        
        vals = daily_map.get(a.id, [])
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
        
        res.trust_score = round(score, 2)
        
        # NOTE: verified_by_court is cnt >= 10, but not currently exposed in AgentResponse schema 
        results.append(res)
        
    return results


@router.post("", response_model=AgentResponse, status_code=201)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)) -> Agent:
    """Create a new agent. Fails if the ID already exists."""
    if db.get(Agent, payload.id) is not None:
        raise HTTPException(status_code=409, detail=f"Agent '{payload.id}' already exists")

    agent = Agent(
        id=payload.id,
        name=payload.name,
        role=payload.role.value,
        balance=payload.balance,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent


@router.post("/seed", status_code=201)
def seed_demo_data(db: Session = Depends(get_db)) -> dict[str, str]:
    """
    Seed the database with realistic demo data.
    Creates 2 agents and 25 mixed transactions if not already seeded.
    Safe to call multiple times (idempotent per agent ID).
    """
    # --- Ensure agents exist ---
    alpha = db.get(Agent, "agent_alpha")
    if alpha is None:
        alpha = Agent(
            id="agent_alpha",
            name="Agent Alpha",
            role="buyer",
            balance=1000.0,
        )
        db.add(alpha)

    beta = db.get(Agent, "agent_beta")
    if beta is None:
        beta = Agent(
            id="agent_beta",
            name="Agent Beta",
            role="seller",
            balance=0.0,
        )
        db.add(beta)

    db.commit()
    db.refresh(alpha)
    db.refresh(beta)

    # --- Generate 25 transactions ---
    schema_names = list(SCHEMA_REGISTRY.keys())

    valid_outputs: dict[str, str] = {
        "PriceCheck": json.dumps({
            "item_name": "MacBook Pro 16-inch",
            "price": 2499.99,
            "currency": "USD",
            "in_stock": True,
            "source_url": "https://apple.com/shop/buy-mac/macbook-pro",
        }),
        "DataExtraction": json.dumps({
            "records": [
                {"id": 1, "name": "Alice", "email": "alice@example.com"},
                {"id": 2, "name": "Bob", "email": "bob@example.com"},
            ],
            "record_count": 2,
            "extraction_confidence": 0.97,
            "source": "https://api.example.com/users",
        }),
        "CodeGeneration": json.dumps({
            "language": "Python",
            "code": "def add(a: int, b: int) -> int:\n    return a + b",
            "passes_tests": True,
            "line_count": 2,
        }),
    }

    invalid_outputs = [
        ('{"item_name": "Widget", "price": -14.99, "currency": "USD", "in_stock": true, "source_url": "https://shop.io"}', "PriceCheck"),
        ('{"item_name": "Gadget", "price": "not-a-number", "in_stock": false, "source_url": "https://shop.io"}', "PriceCheck"),
        ('{"item_name": "Thingy", "currency": "USD", "in_stock": true, "source_url": "https://shop.io"}', "PriceCheck"),
        ('{"records": {"broken": true}, "record_count": 0, "extraction_confidence": 0.5, "source": "db"}', "DataExtraction"),
        ('{"records": [], "record_count": 3, "extraction_confidence": 1.5, "source": "db"}', "DataExtraction"),
        ('{"language": "JavaScript", "code": "", "passes_tests": false, "line_count": 0}', "CodeGeneration"),
        ('{broken json output here}', "PriceCheck"),
        ('null', "DataExtraction"),
    ]

    now = datetime.now(timezone.utc)
    created_count = 0

    for i in range(25):
        rand_minutes = random.randint(0, 29)
        rand_seconds = random.randint(0, 59)
        ts = now - timedelta(minutes=rand_minutes, seconds=rand_seconds)

        amount = round(random.uniform(0.5, 8.0), 2)
        schema_name = random.choice(schema_names)

        # Distribution: 60% CLEARED, 25% REJECTED_DRIFT, 15% LOCKED
        roll = random.random()

        if roll < 0.60:
            # CLEARED
            output = valid_outputs[schema_name]
            result = validator.validate(schema_name, output)
            tx = Transaction(
                buyer_id="agent_alpha",
                seller_id="agent_beta",
                amount=amount,
                status=TransactionStatus.CLEARED,
                expected_schema=schema_name,
                actual_output=output,
                validation_time_ms=result.time_ms,
                entropy_score=round(random.uniform(0.85, 1.0), 4),
                created_at=ts,
                updated_at=ts,
            )
            alpha.total_transactions += 1
            beta.total_transactions += 1
            beta.balance += amount
            alpha.balance -= amount

        elif roll < 0.85:
            # REJECTED_DRIFT
            inv_output, inv_schema = random.choice(invalid_outputs)
            schema_name = inv_schema
            result = validator.validate(schema_name, inv_output)
            reason = "; ".join(result.errors) if result.errors else "Unknown validation error"
            tx = Transaction(
                buyer_id="agent_alpha",
                seller_id="agent_beta",
                amount=amount,
                status=TransactionStatus.REJECTED_DRIFT,
                expected_schema=schema_name,
                actual_output=inv_output,
                rejection_reason=reason,
                validation_time_ms=result.time_ms,
                entropy_score=round(random.uniform(0.2, 0.7), 4),
                created_at=ts,
                updated_at=ts,
            )
            alpha.total_transactions += 1
            alpha.total_rejected += 1

        else:
            # LOCKED (pending validation)
            output = valid_outputs[schema_name]
            tx = Transaction(
                buyer_id="agent_alpha",
                seller_id="agent_beta",
                amount=amount,
                status=TransactionStatus.LOCKED,
                expected_schema=schema_name,
                actual_output=output,
                entropy_score=1.0,
                created_at=ts,
                updated_at=ts,
            )
            alpha.balance -= amount

        from app.bus import bus
        tx.seq = bus.next_seq()
        from app.chain import sign_transaction
        sign_transaction(db, tx)
        db.add(tx)
        
        # Sync to FTS table (since seed bypasses ledger)
        from sqlalchemy import text
        db.execute(
            text("""
                INSERT INTO transactions_fts (id, task_description, rejection_reason, buyer_name, seller_name)
                VALUES (:id, :td, :rr, :bn, :sn)
            """),
            {
                "id": tx.id,
                "td": "Generated seed transaction",
                "rr": tx.rejection_reason or "",
                "bn": alpha.name,
                "sn": beta.name,
            }
        )
        created_count += 1

    alpha.updated_at = now
    beta.updated_at = now
    db.commit()

    return {
        "message": f"Seeded {created_count} transactions",
        "alpha_balance": str(round(alpha.balance, 4)),
        "beta_balance": str(round(beta.balance, 4)),
    }
