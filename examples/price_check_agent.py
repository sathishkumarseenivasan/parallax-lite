import sys
import os
from pydantic import BaseModel
# Allow importing sdk if running directly in repo
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sdk', 'src')))
from parallax_sdk import ParallaxClient

client = ParallaxClient("http://localhost:8000")

class PriceCheck(BaseModel):
    price: float
    in_stock: bool

@client.verified_task(schema=PriceCheck, buyer_id="agent_alpha", seller_id="agent_beta", payment_amount=50.0)
def fetch_price():
    print("Agent Beta: Fetching price... (simulating LLM work)")
    return {"price": 199.99, "in_stock": True}

if __name__ == "__main__":
    print("Agent Alpha: Submitting task to clearinghouse...")
    try:
        result = fetch_price()
        print(f"Transaction Success: {result['id']} - Status: {result['status']}")
    except Exception as e:
        print(f"Transaction Failed: {e}")
