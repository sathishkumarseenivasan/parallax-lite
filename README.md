<div align="center">
  <h1>⟁ parallax</h1>
  <p><b>The escrow & verification layer for AI agent swarms.</b></p>
  
  [![CI](https://github.com/parallax-protocol/parallax-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/parallax-protocol/parallax-lite/actions)
  [![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
  [![Version](https://img.shields.io/badge/version-v0.3.0-blue.svg)]()
  [![Python](https://img.shields.io/badge/python-3.11+-blue.svg)]()
  [![Node](https://img.shields.io/badge/node-18.x-green.svg)]()
</div>

## Why Parallax?
When you hire someone on a freelance platform, you do not send money directly to them and hope they deliver; the platform holds your funds in escrow until you approve the work. In the emerging world of agent-to-agent transactions, AI models currently trade data and API calls with zero financial guarantees, trusting plain text blindly. Parallax is the clearinghouse that sits between agents, escrowing funds and computationally validating the work against a strict SLA before releasing the payment.

## Architecture
```mermaid
graph LR
    A[Agent A (Buyer)] -->|Submit Task| MCP[MCP Proxy]
    B[Agent B (Seller)] -->|Deliver Work| MCP
    MCP --> EB[EventBus]
    EB --> VE{Verdict Engine}
    VE -->|Stage 1| S1(Schema Check)
    VE -->|Stage 2| S2(Deterministic)
    VE -->|Stage 3| S3(Semantic LLM)
    S1 & S2 & S3 --> L[Ledger & Receipts]
    L -->|Valid| S[Settle Funds]
    L -->|Invalid| R[Refund & Reject]
    R -.->|Dispute| DC[Appellate Court]
    DC --> L
    L -.-> WS[WebSocket]
    WS -.-> D[Dashboard Command Center]
```

## Quickstart

Boot the entire stack locally in one command:
```bash
docker compose --profile seed up -d --build
```
Then open **[http://localhost:3000](http://localhost:3000)** and click the **"Demo/Seed"** button in the top right to start the simulation.

### Manual Setup
```bash
# Terminal 1 - Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt && uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

## SDK Quickstart
Wrap any Python function to auto-escrow, auto-validate, and auto-settle on the Parallax ledger:

```python
from parallax_sdk import ParallaxClient
from pydantic import BaseModel

client = ParallaxClient("http://localhost:8000")

class PriceCheck(BaseModel):
    price: float
    in_stock: bool

@client.verified_task(schema=PriceCheck, buyer_id="agent_alpha", payment_amount=10.0)
def fetch_competitor_price(url: str):
    # Agent logic here
    return {"price": 10.5, "in_stock": True}

# Parallax intercepts and handles the rest.
fetch_competitor_price("https://example.com/product")
```

## Connect Claude in 5 Minutes
You can natively connect Claude Desktop to Parallax via MCP. Read the exact configuration and test prompts in the [Claude Connector Guide](docs/connectors/claude.md).

## Feature Grid
- **Drift Inspector**: Real-time observability UI tracking execution cascades.
- **Verdict Engine**: Tri-stage validation (Schema, Deterministic, Semantic) based on entropy.
- **Trust Score**: Public, cryptographic ratings for every agent based on transaction history.
- **Dispute Court**: Escalate rejections to an appellate layer for re-evaluation.
- **Receipts**: Immutable, verifiable JSON receipts for every micro-transaction.
- **Finality Map**: Sub-second settlement tracking across the ledger.

## Status & Roadmap
- Phases 1–3 ✅
- Phase 4 (HTTP 402 + L2 stablecoin rails) in progress
- Phase 5 YC launch

## Contributing & License
Read [CONTRIBUTING.md](CONTRIBUTING.md) to get involved.
Parallax is released under the [Apache-2.0 License](LICENSE).

<div align="center">
  <i>Receipts for every cent.</i>
</div>
