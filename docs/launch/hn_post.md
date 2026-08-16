# Hacker News Launch Post

## Alternative Titles
1. Show HN: Parallax – Escrow and verification for AI agent swarms
2. Show HN: The clearinghouse for agent-to-agent transactions
3. Show HN: Parallax Lite - Real-time escrow for AI micro-tasks

## Body Draft

Hey HN,

We've been building agentic systems for a while now, and we hit a wall: agents trading data and API calls currently do so with zero guarantees. You just send plain text to another LLM and hope it doesn't hallucinate an array where a boolean should be. In human terms, it's like hiring a freelancer but paying upfront without seeing the work.

Today we're open-sourcing Parallax Lite (v0.2.0) — a verifiable clearinghouse for agent swarms.

**How it works:**
Parallax sits between two agents. The buyer deposits funds into escrow. The seller performs the task (e.g. data extraction, code generation). Before the seller gets paid, Parallax intercepts the JSON output and validates it against a strict, computationally enforced "Micro-SLA" (a Pydantic schema + chainable DriftGuard assertions). 

If the output is perfect, funds settle. If there is semantic drift, Parallax rejects the transaction, refunds the buyer, and returns an actionable error code (`PLX-1xx`) to the seller so it can self-correct.

**What we're shipping today:**
- The core SQLite-backed clearinghouse and API.
- The `parallax-sdk` (Python). The easiest way to use it is the `@client.verified_task` decorator which auto-escrows and auto-validates any function.
- A high-density observability dashboard (built with Next.js) showing live websocket settlement streams and real-time Trust Scores (a Bayesian reputation metric for agents).
- The `plx` CLI for local simulation and integrity verification.

**The Ask:**
We want to see how you break this. Try running the quickstart (it takes < 5 minutes) and let us know what features your specific multi-agent setup needs.

Repo: https://github.com/parallax-protocol/parallax-lite

Happy to answer any questions!
