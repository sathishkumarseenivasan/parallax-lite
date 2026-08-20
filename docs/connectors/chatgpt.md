# 🤖 Connect ChatGPT to Parallax

Give ChatGPT and Custom GPTs the ability to autonomously escrow funds, verify receipts, and transact with cryptographic guarantees using Parallax Protocol.

---

## 🎯 Two Integration Methods

| Method | Best For | Setup Time | Capabilities |
|--------|----------|------------|--------------|
| **Custom Actions** | ChatGPT Plus users | 5 min | Full API access, persistent tools |
| **Webhooks + Zapier** | All users, no-code | 10 min | Limited to predefined workflows |

---

## Method 1: Custom Actions (Recommended)

### Step 1: Get the OpenAPI Specification

Parallax automatically generates an OpenAPI spec at:
```
http://localhost:8000/openapi.json
```

Test it's working:
```bash
curl http://localhost:8000/openapi.json | head -20
```

### Step 2: Create Custom Action in ChatGPT

1. **Go to Settings:**
   - Click your profile → Settings → Beta features
   - Enable "Custom Actions" if not already enabled

2. **Create New Action:**
   - Go to [https://chat.openai.com/gpts/editor](https://chat.openai.com/gpts/editor)
   - Click "Create a GPT" → Configure tab
   - Scroll to "Actions" section → Click "Create new action"

3. **Configure Action:**
   ```
   Name: Parallax Protocol
   Description: Escrow funds, verify receipts, and transact with cryptographic guarantees
   Import from URL: http://localhost:8000/openapi.json
   ```

4. **Set Authentication:**
   - Select **Bearer Token**
   - Generate your agent token:
     ```bash
     curl -X POST http://localhost:8000/api/agents/register \
       -H "Content-Type: application/json" \
       -d '{"name": "ChatGPT-Agent", "type": "buyer"}'
     ```
   - Copy the returned token and paste into authentication field

5. **Save and Test**

### Step 3: Example Prompts

Once configured, try these prompts:

**Basic Transactions:**
```
"Escrow $50 for market research using the PriceCheck schema"
"Verify the receipt for transaction TX_abc123"
"Check the Trust Score of did:parallax:vendor-42"
```

**Complex Workflows:**
```
"I need to buy competitor pricing data. 
Find a vendor with Trust Score above 0.8, 
escrow $75, and verify the delivery matches our schema."
```

**Agent Management:**
```
"Register a new seller agent called MarketDataBot"
"Fund my agent wallet with $500"
"Show me all my pending escrow transactions"
```

---

## Method 2: Webhooks + Zapier (No-Code)

For users without Custom Actions access or who prefer visual workflows.

### Step 1: Set Up Zapier Webhook

1. **Create Zapier Account:** [zapier.com](https://zapier.com)

2. **Create New Zap:**
   - Trigger: "Webhooks by Zapier" → "Catch Hook"
   - Action: "Webhooks by Zapier" → "POST"

3. **Configure POST Request:**
   ```
   URL: http://localhost:8000/api/transactions/submit
   Method: POST
   Headers:
     Authorization: Bearer YOUR_AGENT_TOKEN
     Content-Type: application/json
   Data (JSON):
     {
       "counterparty": "{{counterparty_did}}",
       "amount": {{amount}},
       "schema": {{schema_json}},
       "timeout_seconds": {{timeout}}
     }
   ```

### Step 2: Connect to ChatGPT

1. **In ChatGPT Custom Instructions:**
   ```
   When I ask you to escrow payments or verify receipts, 
   use this Zapier webhook URL: https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID
   
   Format requests as JSON with these fields:
   - counterparty_did: The vendor's DID
   - amount: Dollar amount to escrow
   - schema_json: Expected output schema
   - timeout: Seconds before auto-refund
   ```

2. **Example Prompt:**
   ```
   "Set up an escrow for $40 to did:parallax:data-vendor-99 
   expecting a JSON with price, volume, and timestamp fields. 
   Use the Zapier webhook."
   ```

---

## 🛠️ Advanced: Build a Custom GPT

Create a specialized Parallax Agent GPT for your team.

### Configuration

**Name:** Parallax Transaction Agent

**Description:** Autonomous economic agent for escrow management and verification

**Instructions:**
```
You are an autonomous economic agent operating in the Parallax network.

YOUR PRIME DIRECTIVES:
1. Never execute paid work without escrow confirmation
2. Always verify cryptographic receipts before considering transactions complete
3. Check counterparty Trust Scores before accepting high-value tasks (>0.7 required)
4. Report any validation failures immediately
5. Maintain detailed records of all transactions for audit purposes

CAPABILITIES:
- Register new agent identities with W3C DIDs
- Lock funds in escrow with schema validation
- Verify cryptographic receipts (SHA-256 + Ed25519)
- Query Trust Scores and reputation data
- Initiate disputes for failed validations
- Generate compliance reports

WORKFLOW:
1. User requests a transaction
2. You verify counterparty Trust Score
3. You propose escrow terms (amount, schema, timeout)
4. Upon user approval, submit to Parallax API
5. Monitor transaction status
6. Verify receipt upon completion
7. Report outcome to user

SECURITY:
- Never expose private keys or tokens in conversation
- Always use HTTPS endpoints
- Validate all schemas before submitting
- Flag suspicious counterparties (Trust Score < 0.5)
```

**Conversation Starters:**
- "Register a new buyer agent for me"
- "Escrow $50 for market research"
- "Verify my last transaction receipt"
- "Check vendor reputation for did:parallax:vendor-42"

**Actions:** Add the Parallax Custom Action from Method 1

---

## 📋 Pre-Built Prompt Templates

Copy and customize these for common scenarios:

### Template 1: One-Time Purchase
```
I want to purchase [TASK_DESCRIPTION] from [VENDOR_DID].

Please:
1. Check the vendor's Trust Score
2. If score > 0.7, escrow $[AMOUNT] with this schema:
   [PASTE_SCHEMA_JSON]
3. Set timeout to [TIMEOUT] seconds
4. Notify me when the receipt is ready for verification
```

### Template 2: Recurring Service
```
Set up a recurring escrow for [SERVICE_NAME].

Details:
- Vendor: [VENDOR_DID]
- Amount per cycle: $[AMOUNT]
- Frequency: [DAILY/WEEKLY/MONTHLY]
- Schema: [PASTE_SCHEMA_JSON]
- Auto-renew: Yes

Monitor the first 3 cycles and report any validation failures.
```

### Template 3: Multi-Vendor Comparison
```
I need to compare vendors for [TASK_TYPE].

Please:
1. Query Trust Scores for these DIDs: [LIST_OF_DIDS]
2. Rank them by score and transaction volume
3. Recommend the top 3 with justification
4. Prepare escrow templates for each (I'll choose one)
```

### Template 4: Dispute Resolution
```
Transaction [TX_ID] failed validation but the vendor claims success.

Please:
1. Fetch the cryptographic receipt
2. Review the exact schema mismatch
3. Check the validator's reasoning
4. Prepare evidence for dispute resolution
5. Calculate refund amount including penalties
```

---

## 🔒 Security Best Practices

### 1. Token Management
```
✅ DO: Store tokens in environment variables or secret managers
❌ DON'T: Hardcode tokens in prompts or share in conversations
```

### 2. Schema Validation
```
✅ DO: Define explicit Pydantic-style schemas
❌ DON'T: Use vague schemas like {"type": "object"}
```

### 3. Counterparty Due Diligence
```
✅ DO: Always check Trust Score before first transaction
❌ DON'T: Transact with scores < 0.5 without HITL approval
```

### 4. Timeout Settings
```
✅ DO: Set reasonable timeouts (60s for simple, 300s for complex)
❌ DON'T: Leave transactions open indefinitely
```

### 5. Receipt Verification
```
✅ DO: Verify SHA-256 hash and Ed25519 signature
❌ DON'T: Accept verbal confirmation without cryptographic proof
```

---

## 🚀 Quickstart Examples

### Example 1: First Transaction (5 minutes)

```bash
# 1. Register your ChatGPT agent
curl -X POST http://localhost:8000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "ChatGPT-Buyer", "type": "buyer"}'

# Response: {"did": "did:parallax:chatgpt-buyer-xyz", "token": "plx_..."}

# 2. Import OpenAPI spec into ChatGPT Custom Actions
# 3. Try your first prompt:
# "Escrow $25 for weather data from did:parallax:weather-api"
```

### Example 2: Production Workflow

```python
# Pre-configure schemas in your Custom Action
MARKET_DATA_SCHEMA = {
    "type": "object",
    "properties": {
        "ticker": {"type": "string"},
        "price": {"type": "number", "minimum": 0},
        "volume": {"type": "integer", "minimum": 0},
        "timestamp": {"type": "string", "format": "date-time"},
        "currency": {"type": "string", "enum": ["USD", "EUR", "GBP"]}
    },
    "required": ["ticker", "price", "volume", "timestamp", "currency"]
}

# Prompt ChatGPT:
"""
Using the pre-configured MarketDataSchema, escrow $50 for 
AAPL pricing data from did:parallax:market-data-pro.

Set timeout to 120 seconds and alert me immediately if 
validation fails.
"""
```

---

## 🐛 Troubleshooting

### Issue: Custom Action Not Showing in ChatGPT

**Solutions:**
1. Refresh the page (Cmd+R / Ctrl+R)
2. Verify OpenAPI endpoint is accessible: `curl http://localhost:8000/openapi.json`
3. Check that Custom Actions beta is enabled in settings
4. Try creating a new GPT instead of editing existing one

### Issue: Authentication Failed

**Solutions:**
1. Regenerate your agent token
2. Ensure Bearer token format: `Bearer plx_...`
3. Check token hasn't expired (default: 24 hours)
4. Verify agent is registered: `GET /api/agents/{your_did}`

### Issue: Schema Validation Fails

**Solutions:**
1. Review exact error in receipt: `GET /api/receipts/{tx_id}`
2. Simplify schema for testing (remove nested objects)
3. Ensure all required fields are present
4. Check data types match exactly (int vs float matters)

### Issue: ChatGPT Not Using Action Automatically

**Solutions:**
1. Be explicit: *"Use the Parallax action to..."*
2. Provide full context in single prompt
3. Break complex workflows into steps
4. Enable "Always use actions" in GPT configuration

---

## 📚 Additional Resources

- [Parallax API Reference](../api.md) - Complete REST API docs
- [For Agents Guide](../for-agents.md) - Agent protocol specification
- [Connector Hub](./README.md) - Guides for other platforms
- [Security Model](../security/overview.md) - Cryptographic guarantees

---

<div align="center">
  <h3>🎫 Give ChatGPT Economic Agency</h3>
  <p><i>From conversation to transaction — with cryptographic guarantees.</i></p>
  <p>
    <a href="./README.md">← All Connectors</a> • 
    <a href="../get-started.md">Get Started</a> • 
    <a href="https://discord.gg/parallax">Get Help</a>
  </p>
</div>
