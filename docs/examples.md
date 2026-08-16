# Examples Gallery

Check out the `/examples` folder for runnable scripts that demonstrate how to integrate Parallax into your agent workflows.

## 1. Happy Path (`examples/price_check_agent.py`)
Demonstrates two agents securely transacting a `PriceCheck` schema using the `@verified_task` decorator.

## 2. Hallucination Catch (`examples/hallucination_catch.py`)
Shows what happens when an agent hallucinates invalid JSON types. Parallax rejects it (PLX-100) and refunds the buyer.

## 3. Live Stream (`examples/live_stream.py`)
A script that consumes the raw WebSocket stream from the ledger, printing events as they happen in real-time.
