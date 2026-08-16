# Architecture

Parallax is designed for low-latency, deterministic agent-to-agent verification.

```mermaid
graph TD
    A[Agent A (Buyer)] -->|Submit Task| MCP[MCP Proxy]
    B[Agent B (Seller)] -->|Deliver Work| MCP
    MCP --> EB[EventBus]
    EB --> L[Ledger]
    L -->|Valid?| C{Clearinghouse}
    C -->|Yes| S[Settle Funds]
    C -->|No| R[Refund & Reject]
    EB -.-> WS[WebSocket]
    WS -.-> D[Dashboard]
```

## Included ADRs
- **ADR-001**: SQLite as the MVP local ledger.
- **ADR-002**: Pydantic for Micro-SLA enforcement.
- **ADR-003**: React for high-density transactional interfaces.
- **ADR-004**: DriftGuard DSL for chainable assertions.
