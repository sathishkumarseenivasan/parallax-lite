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
def fetch_price_hallucination():
    print("Agent Beta: Fetching price... (simulating LLM hallucination)")
    # Returns a string for in_stock instead of a boolean
    return {"price": -5.0, "in_stock": "yes"} 

if __name__ == "__main__":
    print("Agent Alpha: Submitting task to clearinghouse...")
    try:
        result = fetch_price_hallucination()
        print(f"Success?! {result}")
    except Exception as e:
        print(f"\nCaught Expected Rejection!")
        print(f"Parallax Referee says: {e}")
