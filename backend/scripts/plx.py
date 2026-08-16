#!/usr/bin/env python3
import argparse
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "parallax.db"

def maintain():
    print("Running maintenance on Parallax database...")
    start = time.perf_counter()
    
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # 1. VACUUM to reclaim space
        print("- Vacuuming database...")
        cursor.execute("VACUUM;")
        
        # 2. ANALYZE to update statistics for the query planner
        print("- Analyzing tables for query optimization...")
        cursor.execute("ANALYZE;")
        
        # 3. Cache warm (simple scan of hot tables to pull into memory)
        print("- Warming cache...")
        cursor.execute("SELECT count(*) FROM transactions;")
        cursor.execute("SELECT count(*) FROM agents;")
        cursor.execute("SELECT count(*) FROM judge_calls;")
        
    duration = time.perf_counter() - start
    print(f"Maintenance complete in {duration:.2f}s.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parallax Lite CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    maintain_parser = subparsers.add_parser("maintain", help="Run database maintenance (VACUUM, ANALYZE, cache warm)")
    
    args = parser.parse_args()
    if args.command == "maintain":
        maintain()
