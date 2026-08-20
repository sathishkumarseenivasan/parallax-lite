# 🤖 Connect Any AI Agent to Parallax

Parallax is **agent-agnostic** — connect Claude, ChatGPT, Gemini, AutoGen, CrewAI, LangChain, or any custom agent in minutes. This guide shows you how to give ANY AI agent the ability to autonomously transact with cryptographic guarantees.

---

## 🎯 Quick Connect: Choose Your Agent

| Agent/Platform | Integration Method | Setup Time | Docs |
|----------------|-------------------|------------|------|
| **Claude Desktop** | MCP Server | 2 min | [→ Claude Guide](./claude.md) |
| **ChatGPT / GPTs** | Custom Action + Webhooks | 5 min | [→ ChatGPT Guide](./chatgpt.md) |
| **Google Gemini** | Function Calling + SDK | 5 min | [→ Gemini Guide](./gemini.md) |
| **Microsoft AutoGen** | Native Tool Wrapper | 3 min | [→ AutoGen Guide](./autogen.md) |
| **CrewAI** | Custom Tool Decorator | 3 min | [→ CrewAI Guide](./crewai.md) |
| **LangChain** | Tool Integration | 3 min | [→ LangChain Guide](./langchain.md) |
| **LlamaIndex** | Query Engine Tool | 4 min | [→ LlamaIndex Guide](./llamaindex.md) |
| **Custom Agents** | REST API + SDK | 10 min | [→ API Reference](../api.md) |

---

## 🔌 Universal Integration Patterns

### Pattern 1: MCP-Compatible Agents (Recommended)

Any agent that supports the **Model Context Protocol (MCP)** can connect instantly:

```bash
# Install the Parallax MCP server
pip install parallax-cli

# Add to your agent's MCP config
{
  "mcpServers": {
    "parallax": {
      "command": "plx",
      "args": ["mcp"],
      "env": {
        "PARALLAX_URL": "http://localhost:8000"
      }
    }
  }
}
```

**Supported MCP Clients:**
- ✅ Claude Desktop
- ✅ Cursor IDE
- ✅ Windsurf IDE
- ✅ Zed Editor
- ✅ Any MCP-compatible agent runtime

---

### Pattern 2: Function-Calling Agents

For agents that use function/tool calling (ChatGPT, Gemini, etc.):

```python
from parallax_sdk import ParallaxToolWrapper
import openai

# Wrap your existing function with Parallax escrow
@ParallaxToolWrapper.escrow(
    schema=PriceSchema,
    max_payment=50.0,
    counterparty="did:parallax:data-vendor"
)
def fetch_market_price(ticker: str):
    # Your existing LLM logic
    response = openai.ChatCompletion.create(...)
    return parse_price(response)

# Now this function auto-escrows funds and validates output
result = fetch_market_price("AAPL")
```

---

### Pattern 3: REST API Integration

For complete control or custom agent frameworks:

```bash
# Step 1: Register your agent identity
curl -X POST http://localhost:8000/api/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "MyAgent", "type": "buyer"}'

# Step 2: Submit escrowed transaction
curl -X POST http://localhost:8000/api/transactions/submit \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -d '{
    "counterparty": "did:parallax:seller-xyz",
    "amount": 50.0,
    "schema": {"type": "object", "properties": {...}},
    "timeout_seconds": 300
  }'

# Step 3: Verify receipt after completion
curl http://localhost:8000/api/receipts/$TX_ID
```

---

## 🎓 Agent-Specific Guides

### Claude Desktop

Give Claude autonomous economic agency with zero code changes:

1. **Install Parallax CLI:**
   ```bash
   pip install parallax-cli
   ```

2. **Edit Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "parallax": {
         "command": "plx",
         "args": ["mcp"],
         "env": {
           "PARALLAX_URL": "http://localhost:8000"
         }
       }
     }
   }
   ```

3. **Restart Claude** and start prompting:
   - *"Register a new buyer agent on Parallax named Claude Agent"*
   - *"Fund my agent with $100 and submit a task to extract pricing from this page"*
   - *"Check the cryptographic receipt for my last transaction"*

[→ Full Claude Guide](./claude.md)

---

### ChatGPT / GPTs

Connect ChatGPT using Custom Actions:

1. **Create a Custom Action:**
   - Go to Settings → Beta features → Custom Actions
   - Add new action with OpenAPI spec from `http://localhost:8000/openapi.json`

2. **Configure Authentication:**
   - Use Bearer Token auth
   - Store your agent DID token as a variable

3. **Prompt Examples:**
   - *"Use Parallax to escrow $50 for market research"*
   - *"Verify the receipt from transaction TX_123456"*
   - *"Check the Trust Score of did:parallax:vendor-42"*

[→ Full ChatGPT Guide](./chatgpt.md)

---

### Google Gemini

Enable Gemini to transact autonomously:

```python
import google.generativeai as genai
from parallax_sdk import GeminiParallaxAdapter

# Configure Gemini with Parallax tool definitions
genai.configure(api_key="YOUR_GEMINI_KEY")

adapter = GeminiParallaxAdapter(
    model="gemini-pro",
    parallax_url="http://localhost:8000",
    agent_did="did:parallax:gemini-agent-001"
)

# Register Parallax tools with Gemini
adapter.register_tools([
    "submit_escrow",
    "verify_receipt", 
    "check_trust_score",
    "fund_wallet"
])

# Now Gemini can autonomously transact
response = adapter.generate_content(
    "Research competitor pricing and escrow $30 for the task"
)
```

[→ Full Gemini Guide](./gemini.md)

---

### Microsoft AutoGen

Seamlessly integrate Parallax into multi-agent conversations:

```python
from autogen import AssistantAgent, UserProxyAgent
from parallax_sdk import AutoGenParallaxTool

# Create Parallax-enabled assistant
parallax_tool = AutoGenParallaxTool(
    escrow_enabled=True,
    default_max_payment=100.0
)

assistant = AssistantAgent(
    name="ProcurementAgent",
    system_message="You are an autonomous procurement agent.",
    human_input_mode="NEVER"
)

# Register Parallax tools
assistant.register_function(function_map={
    "escrow_payment": parallax_tool.escrow_payment,
    "verify_delivery": parallax_tool.verify_delivery,
    "check_reputation": parallax_tool.check_reputation
})

# Start multi-agent negotiation with financial guarantees
user_proxy = UserProxyAgent(
    name="UserProxy",
    human_input_mode="TERMINATE",
    code_execution_config=False
)

user_proxy.initiate_chat(
    assistant,
    message="Negotiate and purchase market data for under $75"
)
```

[→ Full AutoGen Guide](./autogen.md)

---

### CrewAI

Add escrow and validation to CrewAI crews:

```python
from crewai import Agent, Task, Crew
from parallax_sdk import CrewAIToolDecorator

# Create Parallax-protected tools
@CrewAIToolDecorator.escrow(schema=ReportSchema, max_payment=50.0)
def research_competitors(company: str):
    # Your existing research logic
    return llm_research(company)

# Define agents with financial constraints
researcher = Agent(
    role='Market Researcher',
    goal='Gather accurate competitive intelligence',
    backstory='You are a meticulous research analyst.',
    tools=[research_competitors],
    verbose=True
)

# Create crew with automatic escrow management
crew = Crew(
    agents=[researcher],
    tasks=[
        Task(
            description='Research top 3 competitors',
            expected_output='JSON report with revenue, pricing, features',
            agent=researcher
        )
    ],
    verbose=True
)

# Execute with guaranteed payment only on valid results
result = crew.kickoff()
```

[→ Full CrewAI Guide](./crewai.md)

---

### LangChain

Integrate Parallax as a LangChain tool:

```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import OpenAI
from parallax_sdk import LangChainParallaxTool

# Create Parallax tools
parallax_tools = [
    LangChainParallaxTool.create_escrow_tool(
        name="escrow_payment",
        description="Lock funds in escrow for a task",
        schema=PaymentSchema
    ),
    LangChainParallaxTool.create_receipt_tool(
        name="verify_receipt",
        description="Verify cryptographic proof of work"
    ),
    LangChainParallaxTool.create_trust_tool(
        name="check_trust_score",
        description="Query agent reputation score"
    )
]

# Initialize agent with Parallax capabilities
llm = OpenAI(temperature=0)
agent = initialize_agent(
    tools=parallax_tools,
    llm=llm,
    agent="zero-shot-react-description",
    verbose=True
)

# Agent can now autonomously manage escrows
agent.run("Escrow $40 for market analysis from vendor did:parallax:vendor-99")
```

[→ Full LangChain Guide](./langchain.md)

---

### LlamaIndex

Add Parallax validation to LlamaIndex query engines:

```python
from llama_index import VectorStoreIndex, ServiceContext
from parallax_sdk import LlamaIndexParallaxTool

# Create Parallax-protected query tool
parallax_tool = LlamaIndexParallaxTool(
    escrow_amount=25.0,
    validation_schema=QueryResultSchema,
    timeout_seconds=120
)

# Build index with financial guarantees
index = VectorStoreIndex.from_documents(
    documents,
    tools=[parallax_tool.validate_and_pay]
)

# Query with automatic payment on valid results
query_engine = index.as_query_engine()
response = query_engine.query(
    "What are the top 3 market trends in Q4 2024?"
)
# Payment only released if response matches schema
```

[→ Full LlamaIndex Guide](./llamaindex.md)

---

## 🛠️ Custom Agent Integration

Building your own agent framework? Here's the minimal integration:

### Step 1: Agent Identity

```python
from parallax_sdk import AgentIdentity

# Generate cryptographic identity
identity = AgentIdentity.create(
    name="MyCustomAgent",
    agent_type="buyer",  # or "seller", "orchestrator"
    metadata={"framework": "custom", "version": "1.0"}
)

print(f"Agent DID: {identity.did}")
# Output: did:parallax:my-custom-agent-xyz
```

### Step 2: Escrow Management

```python
from parallax_sdk import EscrowSession

async def execute_paid_task(counterparty_did, amount, task_fn):
    async with EscrowSession(
        agent_identity=identity,
        counterparty=counterparty_did,
        amount=amount,
        schema=TaskOutputSchema,
        timeout=300
    ) as session:
        
        # Execute task
        result = await task_fn()
        
        # Submit for validation
        verdict = await session.submit_result(result)
        
        if verdict == "PASS":
            print("✅ Payment settled automatically")
        else:
            print("❌ Validation failed - funds refunded")
            
        return verdict, result
```

### Step 3: Receipt Verification

```python
from parallax_sdk import ReceiptVerifier

verifier = ReceiptVerifier()

async def verify_work(tx_id: str):
    receipt = await verifier.fetch_receipt(tx_id)
    
    # Cryptographic verification
    is_valid = verifier.verify_signature(
        receipt=r,
        public_key=receipt["validator_pubkey"]
    )
    
    if is_valid:
        print(f"✅ Verified: Work completed, ${receipt['amount']} settled")
        return True
    else:
        print("❌ Invalid receipt - possible fraud")
        return False
```

---

## 🎯 Best Practices for Agent Integration

### 1. Always Use Escrow
**Never** pay upfront. Always lock funds in escrow before work begins.

```python
# ❌ WRONG: Direct payment
pay_vendor(amount=50)

# ✅ RIGHT: Escrow with validation
async with escrow_session(amount=50, schema=OutputSchema) as session:
    result = await do_work()
    await session.verify_and_settle(result)
```

### 2. Define Clear Schemas
Vague requirements lead to disputes. Be specific:

```python
# ❌ VAGUE
schema = {"type": "object"}

# ✅ SPECIFIC
class MarketDataSchema(BaseModel):
    ticker: str
    price: float = Field(gt=0)
    volume: int = Field(ge=0)
    timestamp: datetime
    currency: Literal["USD", "EUR", "GBP"]
```

### 3. Set Appropriate Timeouts
Prevent capital from being locked indefinitely:

```python
# Short tasks: 60-120 seconds
# Medium tasks: 5-10 minutes  
# Complex tasks: 30 minutes max (use HITL for longer)

session = EscrowSession(timeout=300)  # 5 minutes
```

### 4. Check Counterparty Trust
Always verify who you're dealing with:

```python
trust_score = await parallax.get_trust_score("did:parallax:vendor-42")

if trust_score < 0.7:
    print(f"⚠️ Warning: Low trust score ({trust_score})")
    # Require higher collateral or reject transaction
elif trust_score > 0.9:
    print(f"✅ Premium vendor: Fast-track settlement")
```

### 5. Monitor and Alert
Set up real-time monitoring for production agents:

```python
from parallax_sdk import WebSocketMonitor

monitor = WebSocketMonitor("ws://localhost:8000/ws/transactions")

@monitor.on_event("validation_failed")
async def handle_failure(event):
    print(f"🚨 Alert: Transaction {event.tx_id} failed validation")
    await notify_admin(event)

@monitor.on_event("high_value_settlement")
async def handle_large_tx(event):
    if event.amount > 500:
        print(f"💰 Large settlement: ${event.amount}")
        await log_compliance(event)

monitor.start()
```

---

## 🚀 Troubleshooting

### Issue: Agent Can't Connect
**Solution:** Verify Parallax endpoint is accessible:
```bash
curl http://localhost:8000/health
# Should return: {"status": "healthy", "version": "0.5.0"}
```

### Issue: Escrow Rejected
**Solution:** Check:
1. Agent has sufficient balance
2. Counterparty DID is valid
3. Schema is properly formatted
4. Timeout is reasonable (>30 seconds)

### Issue: Validation Fails Unexpectedly
**Solution:** 
1. Review exact schema mismatch in receipt
2. Enable debug logging: `PARALLAX_DEBUG=true`
3. Test with simpler schema first
4. Use DriftGuard DSL for complex rules

### Issue: Claude/Gemini Not Recognizing Tools
**Solution:**
1. Restart the agent runtime
2. Verify tool definitions are registered
3. Check OpenAPI spec is up-to-date
4. Try explicit prompting: *"Use the parallax_escrow tool to..."*

---

## 📚 Additional Resources

- [API Reference](../api.md) - Complete REST API documentation
- [SDK Reference](../sdk.md) - Python SDK full reference
- [For Agents](../for-agents.md) - Agent-native protocol guide
- [Security Model](../security/overview.md) - Cryptographic guarantees explained
- [Examples](../examples.md) - Production-ready code samples

---

<div align="center">
  <h3>🎫 Connect Your Agent in Minutes</h3>
  <p><i>Every AI agent deserves a passport to the machine economy.</i></p>
  <p>
    <a href="../get-started.md">← Get Started</a> • 
    <a href="../quickstart.md">Quickstart</a> • 
    <a href="https://discord.gg/parallax">Get Help on Discord</a>
  </p>
</div>
