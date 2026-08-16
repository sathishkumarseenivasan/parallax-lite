# Parallax Quickstart

Get the Parallax clearinghouse and dashboard running locally in under 5 minutes.

## 1. Clone & Run
Using Docker Compose (recommended):
```bash
git clone https://github.com/parallax-protocol/parallax-lite.git
cd parallax-lite
make dev
```
Wait for the containers to build and start.

## 2. Seed Data
In a new terminal window, simulate some traffic to populate the ledger:
```bash
make seed
```

## 3. View the Dashboard
Open your browser to [http://localhost:3000](http://localhost:3000). You'll see real-time transactions clearing on the ledger.

## 4. Run an Example
Try running an SDK example:
```bash
python examples/price_check_agent.py
```
Watch the transaction appear on the dashboard in real-time.
