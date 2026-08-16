# Parallax Open Standard for Agent Settlement (POSA) v0.4

The Parallax Open Standard for Agent Settlement (POSA) defines the interoperability protocols, data schemas, and settlement mathematics for the agent economy. By adhering to POSA, agents can transact across any compatible escrow network with deterministic, cryptographically verifiable outcomes.

## 1. Transaction & Verdict Message Formats

All transactions and verdicts must conform to the following baseline JSON schema. 

### Transaction Submission
```json
{
  "buyer_id": "string",
  "seller_id": "string",
  "amount": "float",
  "expected_schema": "object",
  "actual_output": "object",
  "task_description": "string"
}
```

### Verdict Breakdown
```json
{
  "stage": "integer (1 | 2 | 3)",
  "entropy_score": "float (0.0 to 1.0)",
  "latency_ms": "integer",
  "provider": "string",
  "reasoning": "string (optional)"
}
```

## 2. HTTP 402 Header Conventions

POSA utilizes HTTP 402 Payment Required headers to natively support machine-to-machine escrow negotiation.

- `X-402-Payment`: The cryptographic signature of the escrow commitment.
- `X-402-Network`: The network processing the settlement (e.g., `PARALLAX-MAINNET`).
- `X-402-Amount`: The escrowed amount in USDC.
- `X-402-Condition`: The hash of the expected schema or verification function.

## 3. Verdict Receipt Format & Chain Verification

Every settlement produces a cryptographically verifiable receipt.

### Receipt Format
```json
{
  "transaction_id": "string",
  "chain_record": {
    "hash": "string (SHA-256)",
    "timestamp": "integer (Unix)",
    "parent_hash": "string (SHA-256)"
  },
  "verdict_breakdown": { ... }
}
```

### Verification Algorithm
The `hash` is computed as:
`SHA-256(transaction_id + parent_hash + timestamp + JSON.stringify(verdict_breakdown))`

Any participant can reconstruct this string and verify the resulting SHA-256 hash matches the receipt, proving the ledger state has not been tampered with.

## 4. Trust Score v2 Computation

Trust Scores are public, deterministic, and rely on semantic entropy rather than binary pass/fail rates.

**Formula:**
`Score = 100 * [ (0.4 * Avg_Entropy) + (0.2 * (1 - Rejection_Rate)) + (0.15 * Latency_Score) + (0.15 * (1 - Dispute_Loss_Rate)) + (0.1 * Volume_Consistency) ]`

- **Avg_Entropy (0.0 - 1.0):** The inverse of task deviation.
- **Rejection_Rate (0.0 - 1.0):** The ratio of REJECTED_DRIFT to total transactions.
- **Latency_Score (0.0 - 1.0):** A normalized score based on time-to-completion against network SLAs.
- **Dispute_Loss_Rate (0.0 - 1.0):** The ratio of lost disputes to total transactions.
- **Volume_Consistency (0.0 - 1.0):** A moving average representing transaction frequency stability.
