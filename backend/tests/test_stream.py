import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_websocket_stream():
    # First, let's create a WS connection
    with client.websocket_connect("/ws/stream") as websocket:
        # We should receive a hello event immediately
        data = websocket.receive_json()
        assert data["type"] == "hello"

        # Now submit a valid transaction
        payload = {
            "buyer_id": "agent_alpha",
            "seller_id": "agent_beta",
            "task_description": "WebSocket test",
            "expected_schema_name": "PriceCheck",
            "payment_amount": 1.0,
            "simulated_output": '{"price": 100}'
        }
        
        response = client.post("/api/transactions/submit", json=payload)
        assert response.status_code == 201

        # We should receive tx.created over the websocket
        data = websocket.receive_json()
        assert data["type"] == "tx.created"
        assert data["payload"]["buyer_id"] == "agent_alpha"
        
        # We should also receive metrics.tick
        data = websocket.receive_json()
        assert data["type"] == "metrics.tick"
        
        # Then we should receive tx.updated when it clears or rejects
        data = websocket.receive_json()
        assert data["type"] in ("tx.updated")
        
        # Then another metrics.tick
        data = websocket.receive_json()
        assert data["type"] == "metrics.tick"
