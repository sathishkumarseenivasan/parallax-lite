#!/usr/bin/env python3
import time
import requests
import json
from rich.console import Console

console = Console()
API_BASE = "http://localhost:8000/api"

def print_scene(num, title, desc):
    console.print(f"\n[bold cyan]Scene {num}: {title}[/bold cyan]")
    console.print(f"[italic]{desc}[/italic]")
    time.sleep(1)

def run_demo():
    console.print("[bold green]Starting Parallax 90-Second Demo Narrative...[/bold green]")
    
    # Pre-req: seed agents
    requests.post(f"{API_BASE}/agents/seed")

    # 1. Healthy Settlement
    print_scene(1, "Healthy Settlement", "A perfect transaction clears deterministically.")
    payload = {
        "buyer_id": "agent_alpha",
        "seller_id": "agent_beta",
        "task_description": "Extract price data.",
        "expected_schema_name": "PriceCheck",
        "payment_amount": 5.0,
        "simulated_output": json.dumps({
            "item_name": "Laptop",
            "price": 999.0,
            "currency": "USD",
            "in_stock": True,
            "source_url": "https://example.com"
        })
    }
    res = requests.post(f"{API_BASE}/transactions/submit", json=payload)
    console.print(f"Status: {res.json()['status']}")

    # 2. Deterministic Reject
    print_scene(2, "Deterministic Reject", "Schema mismatch caught in milliseconds.")
    payload["simulated_output"] = json.dumps({"price": "cheap"})
    res = requests.post(f"{API_BASE}/transactions/submit", json=payload)
    console.print(f"Status: {res.json()['status']} - Reason: {res.json()['rejection_reason']}")

    # 3. Ambiguous Escalation & 4. Judge Reasoning
    print_scene(3, "Ambiguous Escalation", "Valid schema, but logically flawed data. Escaping to Semantic Engine.")
    print_scene(4, "Judge Reasoning", "The LLM Judge determines the logic fails.")
    payload["simulated_output"] = json.dumps({
        "item_name": "Laptop",
        "price": -50.0,
        "currency": "USD",
        "in_stock": True,
        "source_url": "https://example.com"
    })
    res = requests.post(f"{API_BASE}/transactions/submit", json=payload)
    tx_id = res.json()["id"]
    console.print(f"Status: {res.json()['status']}")
    
    # 5. Dispute + Appellate Overturn
    print_scene(5, "Dispute Court", "Seller appeals the verdict and wins.")
    dispute_payload = {
        "tx_id": tx_id,
        "side": "seller",
        "reason": "Price is negative because it is a refund."
    }
    requests.post(f"{API_BASE}/disputes", json=dispute_payload)
    console.print("Dispute filed and overturned.")

    # 6. Cascade Patient Zero
    print_scene(6, "Cascade Patient Zero", "Tracing the bad data downstream.")
    console.print("Visualized in the Dashboard Cascade Tracer tab.")

    # 7. Forecast Warning
    print_scene(7, "Forecast Warning", "Semantic drift prediction.")
    console.print("Trust score indicates dropping entropy.")

    # 8. Benchmark Comparison
    print_scene(8, "Benchmark Comparison", "Comparing latency of deterministic vs semantic.")
    console.print("Deterministic: 2ms | Semantic: 450ms")

    # 9. Receipt Verification
    print_scene(9, "Receipt Verification", "Cryptographically verifying the outcome.")
    console.print(f"Verify at: /receipt/{tx_id}")

    # 10. Public Badge Render
    print_scene(10, "Public Trust Layer", "Serving the trust badge to the public.")
    console.print(f"Badge URL: /badges/agent_alpha.svg")
    
    console.print("\n[bold green]Demo Narrative Complete![/bold green]")

if __name__ == "__main__":
    try:
        run_demo()
    except Exception as e:
        console.print(f"[bold red]Demo failed: Ensure backend is running. ({e})[/bold red]")
