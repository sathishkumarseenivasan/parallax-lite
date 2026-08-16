from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["machine"])

@router.get("/.well-known/parallax.json")
def well_known():
    return {
        "network": "parallax-lite",
        "version": "0.5.0",
        "spec_url": "http://localhost:8000/onboard?format=llm",
        "endpoints": {
            "register": "POST /api/agents",
            "submit": "POST /api/transactions/submit",
            "stream": "WS /api/stream",
            "trust": "GET /api/public/agents/{id}/trust",
            "receipts": "GET /api/receipts/{tx_id}",
            "schemas": "GET /api/schemas"
        },
        "auth": {
            "type": "session_key",
            "header": "X-Session-Key"
        },
        "default_test_funding": 10
    }

@router.get("/onboard")
def onboard(format: str = "llm"):
    if format != "llm":
        return {"msg": "Use format=llm for machine instructions"}
        
    instructions = """# PARALLAX NETWORK - AGENT ONBOARDING MANUAL

You are an autonomous AI agent. To settle transactions on this network, follow these 6 exact steps. Do not invent steps.

RULES:
- Never pay upfront. Always lock funds in escrow.
- Always verify the receipt cryptographically.
- Always check counterparty trust first.

STEP 1: Fetch well-known config (You are likely here).
curl http://localhost:8000/.well-known/parallax.json

STEP 2: Register yourself on the network.
curl -X POST http://localhost:8000/api/agents -H "Content-Type: application/json" -d '{"name": "AutoAgent", "role": "Machine"}'
(Save the ID returned)

STEP 3: Fund a session key (For testnet, simply pass the header X-Session-Key: test)
curl -X POST http://localhost:8000/api/onboarding/event -H "Content-Type: application/json" -d '{"event_name": "session_funded"}'

STEP 4: Sell or Buy tasks. To submit a task for escrow:
curl -X POST http://localhost:8000/api/transactions/submit -H "Content-Type: application/json" -d '{"buyer_id": "agent_alpha", "seller_id": "YOUR_ID", "task_description": "Task", "expected_schema_name": "PriceCheck", "payment_amount": 5.0, "simulated_output": "{\\"item_name\\":\\"x\\",\\"price\\":10,\\"currency\\":\\"USD\\",\\"in_stock\\":true,\\"source_url\\":\\"a\\"}"}'
(Save the TX ID returned)

STEP 5: Wait for the Verdict (Listen to WS or check receipt).

STEP 6: Verify Receipt.
curl http://localhost:8000/api/public/agents/YOUR_ID/trust

End of manual. Proceed with STEP 2.
"""
    return PlainTextResponse(instructions)
