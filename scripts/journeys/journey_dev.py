import sys
import subprocess
import httpx

def main():
    print("Journey: Developer")
    try:
        # Run the example script
        result = subprocess.run([sys.executable, "examples/price_check_agent.py"], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[FAIL] Script failed: {result.stderr}")
            sys.exit(1)
        
        # We can extract the TX ID from stdout or fetch the latest
        # Example stdout: Transaction Success: 123... - Status: CLEARED
        print(result.stdout)
        
        r = httpx.get("http://localhost:8000/api/transactions?limit=1")
        r.raise_for_status()
        tx = r.json()[0]
        assert tx["status"] == "CLEARED", f"Expected CLEARED, got {tx['status']}"
        tx_id = tx["id"]
        
        # Fetch receipt
        r2 = httpx.get(f"http://localhost:8000/api/receipts/{tx_id}")
        r2.raise_for_status()
        receipt = r2.json()
        assert receipt["tx_id"] == tx_id
        
        print(f"[PASS] Dev journey completed. Receipt: {receipt['signature'][:10]}...")
        sys.exit(0)
    except Exception as e:
        print(f"[FAIL] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
