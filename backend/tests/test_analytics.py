import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_timeseries():
    with TestClient(app) as client:
        # Create agents first!
        from app.database import SessionLocal
        from app.models import Agent
        db = SessionLocal()
        # Add if not exists
        if not db.get(Agent, "agent_alpha"):
            db.add(Agent(id="agent_alpha", name="Alpha", role="buyer", balance=100.0))
            db.add(Agent(id="agent_beta", name="Beta", role="seller", balance=0.0))
            db.commit()
        db.close()

        # Submit a transaction first to make sure there's data
        payload = {
            "buyer_id": "agent_alpha",
            "seller_id": "agent_beta",
            "task_description": "Analytics test",
            "expected_schema_name": "PriceCheck",
            "payment_amount": 1.0,
            "simulated_output": '{"price": 100}'
        }
        res = client.post("/api/transactions/submit", json=payload)
        assert res.status_code == 201
    
        response = client.get("/api/metrics/timeseries?range=1h")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # verify zero-fill logic has keys
        assert "timestamp" in data[0]
        assert "cleared" in data[0]

def test_distributions():
    response = client.get("/api/metrics/distributions")
    assert response.status_code == 200
    data = response.json()
    assert "latency" in data
    assert "amount" in data

def test_heatmap():
    response = client.get("/api/metrics/heatmap")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 7 * 24
