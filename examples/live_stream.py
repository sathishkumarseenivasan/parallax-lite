import sys
import os
import asyncio
# Allow importing sdk if running directly in repo
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'sdk', 'src')))
from parallax_sdk import ParallaxClient

client = ParallaxClient("http://localhost:8000")

async def consume_stream():
    print("Connecting to Parallax Ledger Stream...")
    async for event in client.stream():
        print(f"Live Event [{event.get('status')}]: {event.get('id')}")

if __name__ == "__main__":
    try:
        asyncio.run(consume_stream())
    except KeyboardInterrupt:
        print("\nExiting stream.")
