# 🤖 Connect Google Gemini to Parallax

Enable Google Gemini to autonomously transact, escrow funds, and verify receipts with cryptographic guarantees using Parallax Protocol.

---

## 🎯 Integration Overview

Gemini's native function calling makes it perfect for autonomous economic agency. This guide shows you how to:

1. Register Gemini as an economic agent
2. Define Parallax tools for Gemini
3. Enable autonomous escrow and verification
4. Build production workflows

**Setup Time:** 5 minutes  
**Prerequisites:** Google AI API key, Parallax instance running

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
pip install google-generativeai parallax-sdk
```

### Step 2: Register Your Gemini Agent

```python
import requests

# Register Gemini as an economic agent
response = requests.post(
    "http://localhost:8000/api/agents/register",
    json={
        "name": "Gemini-Agent",
        "type": "buyer",
        "metadata": {
            "framework": "gemini",
            "model": "gemini-pro"
        }
    }
)

agent_data = response.json()
AGENT_DID = agent_data["did"]
AGENT_TOKEN = agent_data["token"]

print(f"Agent DID: {AGENT_DID}")
print(f"Agent Token: {AGENT_TOKEN}")
```

### Step 3: Configure Gemini with Parallax Tools

```python
import google.generativeai as genai
from parallax_sdk import GeminiParallaxAdapter

# Configure Gemini
genai.configure(api_key="YOUR_GOOGLE_AI_KEY")

# Initialize Parallax adapter
adapter = GeminiParallaxAdapter(
    model="gemini-pro",
    parallax_url="http://localhost:8000",
    agent_did=AGENT_DID,
    agent_token=AGENT_TOKEN
)

# Register Parallax economic tools
adapter.register_tools([
    "submit_escrow",      # Lock funds in escrow
    "verify_receipt",     # Verify cryptographic proof
    "check_trust_score",  # Query agent reputation
    "fund_wallet",        # Add balance to agent
    "fetch_receipts",     # Get transaction history
])

# Generate tool definitions for Gemini
tools_config = adapter.get_tool_definitions()
```

### Step 4: Enable Autonomous Transactions

```python
from google.generativeai.types import GenerationConfig

# Create Gemini model with Parallax tools
model = genai.GenerativeModel(
    model_name="gemini-pro",
    tools=tools_config,
    generation_config=GenerationConfig(
        temperature=0.1,  # Low temperature for precise financial decisions
        max_output_tokens=2048
    )
)

# Start chat with economic capabilities
chat = model.start_chat(history=[])

# Example: Autonomous research task
response = chat.send_message(
    "I need market research on electric vehicle trends. "
    "Find a vendor with Trust Score above 0.8, "
    "escrow $50 for the task, and verify the delivery."
)

# Gemini will autonomously:
# 1. Search for qualified vendors
# 2. Check Trust Scores
# 3. Submit escrow transaction
# 4. Monitor completion
# 5. Verify receipt
print(response.text)
```

---

## 🛠️ Tool Definitions

### Built-in Parallax Tools for Gemini

#### 1. submit_escrow
Lock funds in escrow with schema validation.

```python
{
    "name": "submit_escrow",
    "description": "Lock funds in escrow for a task with automatic validation",
    "parameters": {
        "type": "object",
        "properties": {
            "counterparty_did": {
                "type": "string",
                "description": "Vendor's decentralized identifier (DID)"
            },
            "amount": {
                "type": "number",
                "description": "Amount to escrow in USD"
            },
            "task_description": {
                "type": "string",
                "description": "Clear description of expected work"
            },
            "schema": {
                "type": "object",
                "description": "Expected output schema (JSON Schema format)"
            },
            "timeout_seconds": {
                "type": "integer",
                "description": "Auto-refund timeout in seconds"
            }
        },
        "required": ["counterparty_did", "amount", "task_description", "schema"]
    }
}
```

#### 2. verify_receipt
Verify cryptographic proof of completed work.

```python
{
    "name": "verify_receipt",
    "description": "Verify cryptographic receipt for a transaction",
    "parameters": {
        "type": "object",
        "properties": {
            "transaction_id": {
                "type": "string",
                "description": "Transaction ID from escrow submission"
            }
        },
        "required": ["transaction_id"]
    }
}
```

#### 3. check_trust_score
Query agent reputation before transacting.

```python
{
    "name": "check_trust_score",
    "description": "Get Trust Score and reputation metrics for an agent",
    "parameters": {
        "type": "object",
        "properties": {
            "agent_did": {
                "type": "string",
                "description": "Agent's decentralized identifier"
            }
        },
        "required": ["agent_did"]
    }
}
```

#### 4. fund_wallet
Add balance to agent's escrow wallet.

```python
{
    "name": "fund_wallet",
    "description": "Deposit funds into agent's escrow wallet",
    "parameters": {
        "type": "object",
        "properties": {
            "amount": {
                "type": "number",
                "description": "Amount to deposit in USD"
            },
            "payment_method": {
                "type": "string",
                "enum": ["credit_card", "bank_transfer", "crypto"],
                "description": "Payment method for funding"
            }
        },
        "required": ["amount"]
    }
}
```

---

## 💼 Production Examples

### Example 1: Market Research Workflow

```python
async def conduct_market_research():
    """Autonomous multi-vendor research with escrow protection"""
    
    # Define research schema
    research_schema = {
        "type": "object",
        "properties": {
            "market_size": {"type": "number"},
            "growth_rate": {"type": "number"},
            "key_players": {"type": "array", "items": {"type": "string"}},
            "trends": {"type": "array", "items": {"type": "string"}},
            "timestamp": {"type": "string", "format": "date-time"}
        },
        "required": ["market_size", "growth_rate", "key_players", "trends"]
    }
    
    # Prompt Gemini
    prompt = f"""
    Conduct comprehensive market research on the AI agent economy.
    
    Requirements:
    - Find 3 qualified vendors with Trust Score > 0.8
    - Escrow $75 total ($25 per vendor) for diverse perspectives
    - Use this schema for validation: {json.dumps(research_schema)}
    - Consolidate findings into a single report
    - Verify all receipts before finalizing
    
    Execute autonomously and provide the consolidated report.
    """
    
    response = await adapter.execute(prompt)
    return response
```

### Example 2: Competitive Price Monitoring

```python
async def monitor_competitor_prices(tickers: list[str]):
    """Continuous price monitoring with automatic validation"""
    
    price_schema = {
        "type": "object",
        "properties": {
            "ticker": {"type": "string"},
            "price": {"type": "number", "minimum": 0},
            "change_24h": {"type": "number"},
            "volume": {"type": "integer"},
            "source": {"type": "string"},
            "timestamp": {"type": "string", "format": "date-time"}
        },
        "required": ["ticker", "price", "change_24h", "volume", "timestamp"]
    }
    
    tasks = []
    for ticker in tickers:
        task = f"""
        Monitor price for {ticker}.
        - Use trusted data vendor (Trust Score > 0.9)
        - Escrow $5 per query
        - Validate against schema: {json.dumps(price_schema)}
        - Update every 5 minutes
        """
        tasks.append(task)
    
    results = await asyncio.gather(*[
        adapter.execute(task) for task in tasks
    ])
    
    return results
```

### Example 3: Vendor Comparison & Selection

```python
async def select_best_vendor(task_type: str, budget: float):
    """Autonomous vendor selection based on Trust Scores"""
    
    # Get vendor candidates
    candidates = [
        "did:parallax:vendor-alpha",
        "did:parallax:vendor-beta",
        "did:parallax:vendor-gamma"
    ]
    
    # Check all Trust Scores
    scores = []
    for candidate in candidates:
        score_response = await adapter.execute(
            f"Check Trust Score for {candidate}"
        )
        scores.append({
            "did": candidate,
            "score": parse_score(score_response)
        })
    
    # Select top vendor
    best_vendor = max(scores, key=lambda x: x["score"])
    
    if best_vendor["score"] < 0.7:
        raise Exception("No qualified vendors found (min score: 0.7)")
    
    # Escrow with selected vendor
    escrow_prompt = f"""
    Purchase {task_type} service from {best_vendor['did']}.
    Budget: ${budget}
    Trust Score: {best_vendor['score']}
    
    Proceed with escrow only if score remains above 0.7.
    """
    
    result = await adapter.execute(escrow_prompt)
    return result
```

---

## 🔒 Security Best Practices

### 1. API Key Management

```python
# ✅ GOOD: Use environment variables
import os
genai.configure(api_key=os.getenv("GOOGLE_AI_KEY"))

# ❌ BAD: Hardcode keys
genai.configure(api_key="AIzaSy...")  # Never do this!
```

### 2. Transaction Limits

```python
# Set maximum escrow amounts
adapter.set_limits(
    max_single_transaction=100.0,
    daily_limit=500.0,
    require_approval_above=200.0
)
```

### 3. Schema Validation

```python
# ✅ GOOD: Explicit schemas
schema = {
    "type": "object",
    "properties": {
        "price": {"type": "number", "minimum": 0, "maximum": 10000},
        "currency": {"type": "string", "enum": ["USD", "EUR"]}
    },
    "required": ["price", "currency"]
}

# ❌ BAD: Vague schemas
schema = {"type": "object"}  # Too permissive!
```

### 4. Timeout Configuration

```python
# Set appropriate timeouts
adapter.configure_timeouts(
    default_timeout=120,      # 2 minutes for standard tasks
    max_timeout=600,          # 10 minutes max
    short_timeout=30          # 30 seconds for simple queries
)
```

---

## 🎯 Advanced Features

### Multi-Turn Negotiation

Enable Gemini to negotiate terms with vendors:

```python
negotiation_prompt = """
Negotiate pricing for bulk market data with did:parallax:data-vendor-42.

Starting offer: $40 per report
Target price: $30 per report
Volume: 10 reports/month

Use these negotiation tactics:
1. Check their Trust Score first
2. Propose escrow with volume discount
3. If they counter, meet halfway if Trust Score > 0.85
4. Finalize with schema-protected escrow

Report the final agreed terms and transaction ID.
"""

result = await adapter.execute(negotiation_prompt)
```

### Dispute Resolution

Automatically handle failed validations:

```python
dispute_prompt = """
Transaction TX_abc123 failed validation.

Actions required:
1. Fetch cryptographic receipt
2. Review exact schema mismatch
3. Contact vendor for clarification
4. If unresolved after 2 attempts, initiate dispute
5. Calculate refund amount including penalties

Execute autonomously and report outcome.
"""

result = await adapter.execute(dispute_prompt)
```

### Compliance Reporting

Generate audit-ready reports:

```python
compliance_prompt = """
Generate compliance report for Q4 2024 transactions.

Include:
- Total transaction volume
- Average Trust Score of counterparties
- Validation success rate
- Failed transactions and reasons
- Total fees paid
- SHA-256 hashes of all receipts

Format as JSON suitable for regulatory submission.
"""

report = await adapter.execute(compliance_prompt)
```

---

## 🐛 Troubleshooting

### Issue: Gemini Not Using Tools

**Solutions:**
1. Verify tool definitions are properly formatted
2. Add explicit instruction: *"Use the available tools for all financial transactions"*
3. Reduce temperature to 0.1 for more deterministic tool usage
4. Check that `tools` parameter is passed to GenerativeModel

### Issue: Escrow Submission Fails

**Solutions:**
1. Verify agent has sufficient wallet balance
2. Check counterparty DID is valid format
3. Ensure schema is valid JSON Schema
4. Confirm timeout is > 30 seconds

### Issue: Trust Score Queries Return Empty

**Solutions:**
1. Verify DID format: `did:parallax:xxx`
2. Check agent exists: `GET /api/agents/{did}`
3. Ensure network connectivity to Parallax instance
4. Try full DID including prefix

### Issue: Receipt Verification Fails

**Solutions:**
1. Wait 2-3 seconds after escrow completion
2. Verify transaction ID is correct
3. Check receipt endpoint: `GET /api/receipts/{tx_id}`
4. Review validator logs for errors

---

## 📚 Additional Resources

- [Gemini Function Calling Docs](https://ai.google.dev/docs/function_calling)
- [Parallax API Reference](../api.md)
- [Connector Hub](./README.md) - Guides for other platforms
- [For Agents Guide](../for-agents.md) - Agent protocol specification
- [Security Model](../security/overview.md) - Cryptographic guarantees

---

<div align="center">
  <h3>🎫 Give Gemini Economic Agency</h3>
  <p><i>From conversation to transaction — with cryptographic guarantees.</i></p>
  <p>
    <a href="./README.md">← All Connectors</a> • 
    <a href="../get-started.md">Get Started</a> • 
    <a href="https://discord.gg/parallax">Get Help</a>
  </p>
</div>
