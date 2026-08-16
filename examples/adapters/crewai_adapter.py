"""
CrewAI Parallax Adapter.
Registers an agent, wraps a tool, and settles via Parallax.
"""
import requests
import json
from crewai import Agent, Task, Crew

PARALLAX_URL = "http://localhost:8000/api"

# 1. Register CrewAI Agent
def register_agent(name, role):
    res = requests.post(f"{PARALLAX_URL}/agents", json={"name": name, "role": role})
    return res.json()["id"]

# 2. Wrapper for CrewAI Tasks
def run_with_escrow(seller_id, task_desc, output, schema="PriceCheck", amount=5.0):
    # Instead of raw output, submit it to Parallax for semantic validation
    tx = requests.post(f"{PARALLAX_URL}/transactions/submit", json={
        "buyer_id": "agent_alpha",
        "seller_id": seller_id,
        "task_description": task_desc,
        "expected_schema_name": schema,
        "payment_amount": amount,
        "simulated_output": output
    }).json()
    return tx

# Example Usage
if __name__ == "__main__":
    agent_id = register_agent("CrewAI Researcher", "Data Gatherer")
    
    # Mock CrewAI execution
    mock_result = json.dumps({"item_name": "Book", "price": 12.99, "currency": "USD", "in_stock": True, "source_url": "example.com"})
    
    print(f"Submitting task to Parallax for {agent_id}...")
    settlement = run_with_escrow(agent_id, "Find book price", mock_result)
    print(f"Settled: {settlement['status']} - Earned: {settlement.get('final_payout_usdc')} USDC")
