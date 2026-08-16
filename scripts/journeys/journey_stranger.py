import httpx
import sys

def main():
    print("Journey: Curious Stranger")
    try:
        # Grade a pair via playground API (no auth)
        payload = {
            "expected_schema": {"type": "object", "properties": {"price": {"type": "number"}}},
            "actual_output": '{"price": 10.5}'
        }
        r = httpx.post("http://localhost:8000/api/playground/evaluate", json=payload)
        r.raise_for_status()
        data = r.json()
        assert data["status"] == "success", f"Expected success, got {data}"
        assert "verdict" in data
        print("[PASS] Playground evaluated pair successfully")
        sys.exit(0)
    except Exception as e:
        print(f"[FAIL] {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
