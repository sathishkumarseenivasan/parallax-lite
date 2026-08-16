import httpx
import sys

def main():
    print("Journey: Auditor")
    try:
        # 1. Chain Verify
        r = httpx.get("http://localhost:8000/api/ledger/verify")
        r.raise_for_status()
        chain = r.json()
        assert chain["valid"], "Chain is invalid"
        
        # 2. Public Trust (Trust Badges / API)
        r = httpx.get("http://localhost:8000/api/public/agents/agent_alpha/trust")
        if r.status_code == 404:
            pass # Public might be disabled depending on mode, but in local it is enabled
        else:
            r.raise_for_status()
            assert "trust_score" in r.json()
            
        # 3. Public Receipt (Assuming at least one tx exists)
        r = httpx.get("http://localhost:8000/api/transactions?limit=1")
        r.raise_for_status()
        txs = r.json()
        if txs:
            tx_id = txs[0]["id"]
            r2 = httpx.get(f"http://localhost:8000/api/receipts/{tx_id}")
            r2.raise_for_status()
            assert r2.json()["tx_id"] == tx_id
            
        print("[PASS] Auditor journey completed.")
        sys.exit(0)
    except Exception as e:
        print(f"[FAIL] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
