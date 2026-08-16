#!/bin/bash
set -e

echo "Journey: Autonomous Agent"
API="http://localhost:8000/api"

# 1. Onboard
curl -s "$API/onboard?format=llm" > /dev/null

# 2. Register
echo "Registering agent_curl..."
curl -s -X POST "$API/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"id":"agent_curl","name":"cURL Agent","role":"buyer"}' > /dev/null

# 3. Fund
echo "Funding agent_curl..."
# Wait, funding is simulated or we just assume they have balance?
# By default Agents have 0 balance, so we might need a fund endpoint. Is there a fund endpoint?
# Let's check the schema or assume the register created it with 0 and we can't fund it.
# Actually, the python seed script uses db.add with balance=1000.0. Wait, does POST /agents/register accept balance?
# Looking at schemas.py: AgentCreate has `balance: float = Field(default=0.0, ge=0.0)`
# So we can register with balance!
curl -s -X POST "$API/agents/register" \
  -H "Content-Type: application/json" \
  -d '{"id":"agent_curl","name":"cURL Agent","role":"buyer","balance":1000.0}' > /dev/null || true

# 4. Submit
echo "Submitting task..."
TX_JSON=$(curl -s -X POST "$API/transactions/submit" \
  -H "Content-Type: application/json" \
  -d '{"buyer_id":"agent_curl","seller_id":"agent_beta","task_description":"Curl test","expected_schema_name":"PriceCheck","payment_amount":10.0,"simulated_output":"{\"price\":42}"}')

TX_ID=$(echo "$TX_JSON" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# 5. Verdict (already cleared since it's synchronous)
if echo "$TX_JSON" | grep -q '"status":"CLEARED"'; then
  echo "Task cleared!"
else
  echo "[FAIL] Task not cleared: $TX_JSON"
  exit 1
fi

# 6. Receipt
echo "Fetching receipt..."
curl -s "$API/receipts/$TX_ID" | grep -q "$TX_ID"

echo "[PASS] Autonomous Agent journey completed."
