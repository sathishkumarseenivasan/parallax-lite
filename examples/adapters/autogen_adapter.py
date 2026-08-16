"""
AutoGen Parallax Adapter.
Hooks into AutoGen's `reply_func` to route messages through Parallax.
"""
import requests
import json

PARALLAX_URL = "http://localhost:8000/api"

def parallax_hook(sender_name, recipient_name, message, schema="CodeGeneration"):
    # Create agents if they don't exist
    seller_id = requests.post(f"{PARALLAX_URL}/agents", json={"name": sender_name, "role": "Coder"}).json()["id"]
    buyer_id = requests.post(f"{PARALLAX_URL}/agents", json={"name": recipient_name, "role": "Reviewer"}).json()["id"]
    
    raw_out = json.dumps({"language": "python", "code": message, "passes_tests": True, "line_count": len(message.split())})
    
    tx = requests.post(f"{PARALLAX_URL}/transactions/submit", json={
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "task_description": "AutoGen Code Task",
        "expected_schema_name": schema,
        "payment_amount": 15.0,
        "simulated_output": raw_out
    }).json()
    return tx

if __name__ == "__main__":
    tx = parallax_hook("Assistant", "UserProxy", "print('hello world')")
    print(f"AutoGen Message Sent -> {tx['status']}")
