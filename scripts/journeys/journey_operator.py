import httpx
import sys

def main():
    print("Journey: Operator (Studio Flow via API)")
    try:
        # 1. Schema Create (mocked for now, as schemas might be hardcoded in backend)
        # Backend has /api/schemas
        r = httpx.get("http://localhost:8000/api/schemas")
        r.raise_for_status()
        schemas = r.json()
        assert any(s["name"] == "PriceCheck" for s in schemas), "PriceCheck schema missing"
        
        # 2. Task Compose (simulate the Studio payload)
        payload = {
            "buyer_id": "agent_alpha",
            "seller_id": "agent_beta",
            "task_description": "Operator Studio Test",
            "expected_schema_name": "PriceCheck",
            "payment_amount": 5.0,
            "simulated_output": '{"price": 99.99}'
        }
        r = httpx.post("http://localhost:8000/api/transactions/submit", json=payload)
        r.raise_for_status()
        data = r.json()
        assert data["status"] == "CLEARED"
        
        print("[PASS] Operator journey completed.")
        sys.exit(0)
    except Exception as e:
        print(f"[FAIL] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
