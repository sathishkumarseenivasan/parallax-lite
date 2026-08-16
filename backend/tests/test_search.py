import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_search_fts():
    with TestClient(app) as client:
        # Create agents first!
        from app.database import SessionLocal
        from app.models import Agent
        db = SessionLocal()
        if not db.get(Agent, "agent_alpha"):
            db.add(Agent(id="agent_alpha", name="Alpha", role="buyer", balance=100.0))
            db.add(Agent(id="agent_beta", name="Beta", role="seller", balance=0.0))
            db.commit()
        db.close()
        
        # Submit a distinct transaction
        payload = {
            "buyer_id": "agent_alpha",
            "seller_id": "agent_beta",
            "task_description": "Search me for hallucination error",
            "expected_schema_name": "PriceCheck",
            "payment_amount": 1.0,
            "simulated_output": '{"price": 100}'
        }
        res = client.post("/api/transactions/submit", json=payload)
        assert res.status_code == 201
        
        # Let's search for "hallucination"
        response = client.get("/api/search?q=hallucination")
        assert response.status_code == 200
        hits = response.json()
        assert len(hits) >= 1
        assert any("<mark>hallucination</mark>" in snip for snip in hits[0]["snippets"])
