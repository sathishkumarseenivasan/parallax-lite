import argparse
import sys
import httpx
import json



def cmd_simulate(args):
    print(f"Simulating scenario '{args.scenario}' with {args.count} iterations...")
    
    for i in range(args.count):
        print(f"[{i+1}/{args.count}] Submitting transaction...")
        if args.scenario == "drift_spike":
            output = '{"price": -50, "in_stock": "yes"}' # intentional bad data
        else:
            output = '{"price": 10.5, "in_stock": true}'
        
        payload = {
            "buyer_id": "agent_alpha",
            "seller_id": "agent_beta",
            "task_description": "CLI Simulation",
            "expected_schema_name": "PriceCheck",
            "payment_amount": 10.0,
            "simulated_output": output
        }
        try:
            resp = httpx.post("http://localhost:8000/api/transactions/submit", json=payload)
            if resp.is_success:
                print(f"   \033[92mCLEARED: {resp.json().get('id')}\033[0m")
            else:
                print(f"   \033[91mREJECTED: {resp.json().get('code')} - {resp.json().get('message')}\033[0m")
        except Exception as e:
            print(f"   \033[91mERROR: {e}\033[0m")

def cmd_verify(args):
    print("Running Integrity Chain verification...")
    try:
        resp = httpx.get("http://localhost:8000/api/ledger/verify")
        resp.raise_for_status()
        data = resp.json()
        if data.get("valid"):
            print("\033[92m* Chain is VALID\033[0m")
            sys.exit(0)
        else:
            print("\033[91m* Chain is INVALID\033[0m")
            sys.exit(1)
    except Exception as e:
        print(f"\033[91m* Verification Failed: {e}\033[0m")
        sys.exit(1)

def cmd_init(args):
    with open(".env", "w") as f:
        f.write("PARALLAX_API_URL=http://localhost:8000\n")
        f.write("PARALLAX_ENV=development\n")
    print("\033[92m● Initialized .env and config\033[0m")

def cmd_doctor(args):
    print("Running Parallax Doctor...\n")
    checks = []
    
    # 1. Server & Mode
    try:
        r = httpx.get("http://localhost:8000/api/health")
        if r.status_code == 200:
            data = r.json()
            checks.append(("Server Reachable", "PASS", "Running on :8000"))
            
            sdk_version = "0.3.0"
            server_version = data.get("version")
            if server_version == sdk_version:
                checks.append(("Version Match", "PASS", f"SDK {sdk_version} == Server {server_version}"))
            else:
                checks.append(("Version Match", "WARN", f"SDK {sdk_version} != Server {server_version}"))
                
            checks.append(("Mode", "PASS", f"{data.get('mode', 'unknown')}"))
        else:
            checks.append(("Server Reachable", "FAIL", "Status code not 200. Check logs."))
    except Exception as e:
        checks.append(("Server Reachable", "FAIL", "Is the backend running?"))

    # 2. Doctor Internal Checks
    try:
        r = httpx.get("http://localhost:8000/api/system/doctor")
        if r.status_code == 200:
            doc = r.json()
            
            # DB Health
            db = doc.get("db_health", {})
            if db.get("wal_enabled") and db.get("migrations_ok"):
                checks.append(("DB Health", "PASS", "WAL active, Migrations OK"))
            else:
                checks.append(("DB Health", "FAIL", "WAL or migrations failing. Run `make reset-db`"))
                
            # FTS
            fts = doc.get("fts_sync", {})
            if fts.get("synced"):
                checks.append(("FTS Index", "PASS", "Synced"))
            else:
                checks.append(("FTS Index", "FAIL", "Out of sync. Run FTS rebuild script"))
                
            # Judge
            judge = doc.get("judge_provider", {})
            if judge.get("status") == "configured":
                checks.append(("Judge Provider", "PASS", f"Key masked: {judge.get('masked_key')}"))
            else:
                checks.append(("Judge Provider", "FAIL", "Missing JUDGE_API_KEY in .env"))
                
            # Chain
            chain = doc.get("chain_head", {})
            if chain.get("valid"):
                checks.append(("Integrity Chain", "PASS", f"Valid (Head: {chain.get('head_id')})"))
            else:
                checks.append(("Integrity Chain", "FAIL", "Drift detected. Run `plx verify`"))
        else:
            checks.append(("System Doctor", "FAIL", "Endpoint returned error"))
    except Exception:
        pass # Server unreachable handled above

    # 3. WS Handshake
    try:
        import asyncio
        import websockets
        async def check_ws():
            try:
                async with websockets.connect("ws://localhost:8000/api/stream/metrics") as ws:
                    pass
                return True
            except Exception:
                return False
        
        if asyncio.run(check_ws()):
            checks.append(("WS Handshake", "PASS", "Connected to /api/stream/metrics"))
        else:
            checks.append(("WS Handshake", "FAIL", "Connection failed. Check proxy config"))
    except ImportError:
        checks.append(("WS Handshake", "WARN", "websockets package not installed"))
        
    has_fail = False
    print(f"{'CHECK':<20} | {'STATUS':<6} | {'DETAILS'}")
    print("-" * 65)
    for name, status, details in checks:
        if status == "PASS":
            color = "\033[92m"
        elif status == "WARN":
            color = "\033[93m"
        else:
            color = "\033[91m"
            has_fail = True
            
        print(f"{name:<20} | {color}{status:<6}\033[0m | {details}")
        
    if has_fail:
        print("\n\033[91mDoctor found issues. Please fix the failing checks above.\033[0m")
        sys.exit(1)
    else:
        print("\n\033[92mAll checks passed. Parallax is ready.\033[0m")
        sys.exit(0)

def main():
    parser = argparse.ArgumentParser(description="Parallax Protocol CLI")
    parser.add_argument("--version", action="version", version="Parallax CLI v0.3.0")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    _ = subparsers.add_parser("doctor", help="Check Parallax core status and installation health")
    
    simulate_parser = subparsers.add_parser("simulate", help="Simulate agent traffic")
    simulate_parser.add_argument("--scenario", required=True, help="Scenario to simulate (e.g. drift_spike)")
    simulate_parser.add_argument("--count", type=int, default=10, help="Number of iterations")
    
    _ = subparsers.add_parser("verify", help="Run integrity chain check")
    
    _ = subparsers.add_parser("init", help="Scaffold .env and config")
    
    args = parser.parse_args()
    
    if args.command == "doctor":
        cmd_doctor(args)
    elif args.command == "simulate":
        cmd_simulate(args)
    elif args.command == "verify":
        cmd_verify(args)
    elif args.command == "init":
        cmd_init(args)

if __name__ == "__main__":
    main()
