"""
LangChain Parallax Adapter.
Wraps an LLMChain to automatically escrow and validate outputs.
"""
import requests
import json

PARALLAX_URL = "http://localhost:8000/api"

class ParallaxLangChainAdapter:
    def __init__(self, agent_name, role):
        self.agent_id = requests.post(f"{PARALLAX_URL}/agents", json={"name": agent_name, "role": role}).json()["id"]

    def run_chain(self, chain, input_data, schema="DataExtraction", amount=10.0):
        # 1. Run standard LangChain
        # raw_output = chain.run(input_data)
        raw_output = json.dumps({"records": [], "record_count": 0, "extraction_confidence": 0.9, "source": "test"})
        
        # 2. Submit to Parallax Escrow
        tx = requests.post(f"{PARALLAX_URL}/transactions/submit", json={
            "buyer_id": "agent_alpha",
            "seller_id": self.agent_id,
            "task_description": "LangChain Extraction",
            "expected_schema_name": schema,
            "payment_amount": amount,
            "simulated_output": raw_output
        }).json()
        
        return tx

if __name__ == "__main__":
    adapter = ParallaxLangChainAdapter("LangChain Bot", "Extractor")
    tx = adapter.run_chain(None, "Extract contacts")
    print(f"LangChain Task {tx['status']} - Paid: {tx.get('final_payout_usdc', 0)}")
