import asyncio
import httpx
import time
import numpy as np

async def fetch(client, url):
    start = time.perf_counter()
    response = await client.get(url)
    end = time.perf_counter()
    return end - start, response.status_code

async def main():
    url = "http://localhost:8000/api/agents"
    concurrency = 20
    total_requests = 500
    
    times = []
    status_codes = []
    
    async with httpx.AsyncClient() as client:
        # Warmup
        for _ in range(5):
            await client.get(url)
            
        # Benchmark
        tasks = set()
        completed = 0
        
        while completed < total_requests or tasks:
            while len(tasks) < concurrency and completed + len(tasks) < total_requests:
                tasks.add(asyncio.create_task(fetch(client, url)))
            
            done, tasks = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            
            for task in done:
                t, code = task.result()
                times.append(t)
                status_codes.append(code)
                completed += 1
                
    times_ms = [t * 1000 for t in times]
    p50 = np.percentile(times_ms, 50)
    p95 = np.percentile(times_ms, 95)
    
    print("--- Load Test Results ---")
    print(f"Total Requests: {total_requests}")
    print(f"Concurrency: {concurrency}")
    print(f"p50: {p50:.2f} ms")
    print(f"p95: {p95:.2f} ms")
    print(f"200 OKs: {status_codes.count(200)}")
    
    if p95 < 80:
        print("✅ PASS: p95 < 80ms")
    else:
        print("❌ FAIL: p95 >= 80ms")

if __name__ == "__main__":
    asyncio.run(main())
