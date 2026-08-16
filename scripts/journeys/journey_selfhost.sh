#!/bin/bash
set -e

echo "Journey: Self-host Team"
docker compose --profile seed up -d --build

echo "Waiting for backend health..."
for i in {1..30}; do
  if curl -s http://localhost:8000/api/health | grep -q '"status":"ok"'; then
    echo "Backend is healthy!"
    break
  fi
  sleep 2
done

echo "Waiting for frontend health..."
for i in {1..30}; do
  if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -q "200"; then
    echo "Frontend is healthy!"
    break
  fi
  sleep 2
done

# One TX via API
echo "Submitting TX..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/transactions/submit \
  -H "Content-Type: application/json" \
  -d '{"buyer_id":"agent_alpha","seller_id":"agent_beta","task_description":"docker test","expected_schema_name":"PriceCheck","payment_amount":1.0,"simulated_output":"{\"price\":10}"}')

if echo "$RESPONSE" | grep -q '"status":"CLEARED"'; then
  echo "[PASS] Self-host journey completed."
  # Cleanup
  docker compose down
  exit 0
else
  echo "[FAIL] Transaction failed: $RESPONSE"
  docker compose down
  exit 1
fi
