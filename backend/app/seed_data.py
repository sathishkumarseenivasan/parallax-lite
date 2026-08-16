"""
Standalone seed script. Run with: python -m app.seed_data

Creates Agent Alpha (buyer, 1000 credits) and Agent Beta (seller, 0 credits),
then generates 25–30 realistic transactions with a realistic distribution.
"""
import json
import random
import sys
from datetime import datetime, timedelta, timezone

# Ensure the backend/ directory is on the path when run as a module
from app.assertions import SCHEMA_REGISTRY, validator
from app.database import SessionLocal, init_db
from sqlalchemy import select
from app.models import Agent, Transaction
from app.schemas import TransactionStatus
from app.bus import bus


VALID_OUTPUTS: dict[str, str] = {
    "PriceCheck": json.dumps({
        "item_name": "MacBook Pro 16-inch M3 Max",
        "price": 2499.99,
        "currency": "USD",
        "in_stock": True,
        "source_url": "https://apple.com/shop/buy-mac/macbook-pro",
    }),
    "DataExtraction": json.dumps({
        "records": [
            {"id": 1, "company": "Acme Corp", "revenue": 4200000},
            {"id": 2, "company": "Globex", "revenue": 8100000},
            {"id": 3, "company": "Initech", "revenue": 1500000},
        ],
        "record_count": 3,
        "extraction_confidence": 0.94,
        "source": "https://api.crunchbase.com/v4/entities",
    }),
    "CodeGeneration": json.dumps({
        "language": "Python",
        "code": (
            "def binary_search(arr: list[int], target: int) -> int:\n"
            "    lo, hi = 0, len(arr) - 1\n"
            "    while lo <= hi:\n"
            "        mid = (lo + hi) // 2\n"
            "        if arr[mid] == target:\n"
            "            return mid\n"
            "        elif arr[mid] < target:\n"
            "            lo = mid + 1\n"
            "        else:\n"
            "            hi = mid - 1\n"
            "    return -1\n"
        ),
        "passes_tests": True,
        "line_count": 11,
    }),
}

INVALID_CASES: list[tuple[str, str, str]] = [
    (
        '{"item_name": "Broken Widget", "price": -14.99, "currency": "USD", "in_stock": true, "source_url": "https://shop.io"}',
        "PriceCheck",
        "Value constraint failed: price must be > 0, got -14.99",
    ),
    (
        '{"item_name": "Gadget X", "price": "nineteen dollars", "in_stock": false, "source_url": "https://shop.io"}',
        "PriceCheck",
        "Type mismatch: expected float for 'price', got str",
    ),
    (
        '{"item_name": "Mystery Item", "currency": "EUR", "in_stock": true, "source_url": "https://shop.io"}',
        "PriceCheck",
        "Missing required field: 'price'",
    ),
    (
        '{"records": {"user_id": 1, "broken": true}, "record_count": 0, "extraction_confidence": 0.5, "source": "db"}',
        "DataExtraction",
        "Schema violation: 'records' must be a list, got dict",
    ),
    (
        '{"records": [], "record_count": 5, "extraction_confidence": 1.5, "source": "api.example.com"}',
        "DataExtraction",
        "Value constraint failed: extraction_confidence must be in [0.0, 1.0]",
    ),
    (
        '{broken json output from seller at position 42}',
        "PriceCheck",
        "JSON parse error: unexpected token at position 1",
    ),
    (
        '{"language": "TypeScript", "code": "", "passes_tests": false, "line_count": 0}',
        "CodeGeneration",
        "Value constraint failed: line_count must be > 0, got 0",
    ),
    (
        'null',
        "DataExtraction",
        "JSON parse error: expected object, got null",
    ),
]


def run_seed(n_transactions: int = 27) -> None:
    """Seed the database with demo agents and mixed transactions."""
    init_db()
    db = SessionLocal()

    print("=" * 52)
    print("  Parallax Lite - Seed Data Generator")
    print("=" * 52)

    try:
        # --- Agents ---
        alpha = db.get(Agent, "agent_alpha")
        if alpha is None:
            alpha = Agent(id="agent_alpha", name="Agent Alpha", role="buyer", balance=1000.0)
            db.add(alpha)
            print("  Created: Agent Alpha (buyer, 1000 credits)")
        else:
            alpha.balance = 1000.0
            print("  Reset:   Agent Alpha balance -> 1000 credits")

        beta = db.get(Agent, "agent_beta")
        if beta is None:
            beta = Agent(id="agent_beta", name="Agent Beta", role="seller", balance=0.0)
            db.add(beta)
            print("  Created: Agent Beta  (seller, 0 credits)")
        else:
            beta.balance = 0.0
            print("  Reset:   Agent Beta balance -> 0 credits")

        # Reset counters
        alpha.total_transactions = 0
        alpha.total_rejected = 0
        beta.total_transactions = 0
        beta.total_rejected = 0
        db.commit()

        # --- Transactions ---
        now = datetime.now(timezone.utc)
        cleared = rejected = locked = 0
        schema_names = list(SCHEMA_REGISTRY.keys())

        for i in range(n_transactions):
            rand_offset = timedelta(
                minutes=random.randint(0, 29),
                seconds=random.randint(0, 59),
            )
            ts = now - rand_offset
            amount = round(random.uniform(0.5, 8.0), 2)
            schema_name = random.choice(schema_names)
            roll = random.random()

            if roll < 0.60:
                # CLEARED
                output = VALID_OUTPUTS[schema_name]
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
                cleared += 1

            elif roll < 0.85:
                # REJECTED_DRIFT
                inv_output, inv_schema, _ = random.choice(INVALID_CASES)
                result = validator.validate(inv_schema, inv_output)
                reason = "; ".join(result.errors) if result.errors else "Validation error"
                tx = Transaction(
                    buyer_id="agent_alpha",
                    seller_id="agent_beta",
                    amount=amount,
                    status=TransactionStatus.REJECTED_DRIFT,
                    expected_schema=inv_schema,
                    actual_output=inv_output,
                    rejection_reason=reason,
                    validation_time_ms=result.time_ms,
                    entropy_score=round(random.uniform(0.2, 0.7), 4),
                    created_at=ts,
                    updated_at=ts,
                )
                alpha.total_transactions += 1
                alpha.total_rejected += 1
                rejected += 1

            else:
                output = VALID_OUTPUTS[schema_name]
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
                locked += 1

            if i > 0 and random.random() < 0.3:
                # Randomly assign a parent_tx_id from previously generated transactions
                prev_tx = db.scalars(select(Transaction).order_by(Transaction.seq.desc()).limit(1)).first()
                if prev_tx:
                    tx.parent_tx_id = prev_tx.id

            tx.seq = bus.next_seq(db)
            db.add(tx)
            db.flush()
            
            from app.chain import sign_transaction
            sign_transaction(db, tx)
            db.flush()
            
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

        alpha.updated_at = now
        beta.updated_at = now
        db.commit()

        print()
        print("  -- Transaction Summary --")
        print(f"  Total generated : {n_transactions}")
        print(f"  CLEARED         : {cleared}")
        print(f"  REJECTED_DRIFT  : {rejected}")
        print(f"  LOCKED          : {locked}")
        print()
        print("  -- Final Balances --")
        print(f"  Agent Alpha     : {alpha.balance:.4f} credits")
        print(f"  Agent Beta      : {beta.balance:.4f} credits")
        print()
        print("  [OK] Seed complete.")
        print("=" * 52)

    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
    sys.exit(0)
