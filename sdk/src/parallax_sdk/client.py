import asyncio
import json
import functools
from typing import AsyncGenerator, Dict, Any, Type, Optional, Callable
from pydantic import BaseModel
import httpx
import websockets

class ParallaxClient:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url.rstrip("/")
        self.ws_url = self.base_url.replace("http://", "ws://").replace("https://", "wss://")
        self._http = httpx.Client(base_url=self.base_url)

    def submit_task(self, buyer_id: str, seller_id: str, task_description: str,
                    expected_schema_name: str, payment_amount: float,
                    simulated_output: str) -> Dict[str, Any]:
        """Submit a task to the Parallax clearinghouse for escrow and validation."""
        payload = {
            "buyer_id": buyer_id,
            "seller_id": seller_id,
            "task_description": task_description,
            "expected_schema_name": expected_schema_name,
            "payment_amount": payment_amount,
            "simulated_output": simulated_output
        }
        resp = self._http.post("/api/transactions/submit", json=payload)
        
        if not resp.is_success:
            err = resp.json()
            if "code" in err:
                raise Exception(f"[{err['code']}] {err.get('message', 'Error')}")
            resp.raise_for_status()
            
        return resp.json()

    def get_transaction(self, tx_id: str) -> Dict[str, Any]:
        """Retrieve a specific transaction."""
        resp = self._http.get(f"/api/transactions/{tx_id}")
        resp.raise_for_status()
        return resp.json()

    def list_transactions(self) -> list[Dict[str, Any]]:
        """List all transactions."""
        resp = self._http.get("/api/transactions")
        resp.raise_for_status()
        return resp.json()

    async def stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream real-time settlement events from the Parallax ledger."""
        async with websockets.connect(f"{self.ws_url}/api/stream/events") as ws:
            while True:
                msg = await ws.recv()
                yield json.loads(msg)

    def verified_task(self, schema: Type[BaseModel], buyer_id: str = "agent_alpha", 
                      seller_id: str = "agent_beta", payment_amount: float = 100.0, 
                      task_description: Optional[str] = None):
        """
        Decorator that wraps a seller's function.
        Auto-registers with the clearinghouse, auto-escrows, and auto-validates.
        """
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Execute the agent logic to get the raw output
                result = func(*args, **kwargs)
                
                if isinstance(result, BaseModel):
                    simulated_output = result.model_dump_json()
                elif isinstance(result, dict):
                    simulated_output = json.dumps(result)
                else:
                    simulated_output = str(result)
                
                desc = task_description or f"Verified execution of {func.__name__}"
                
                # Submit to Parallax
                return self.submit_task(
                    buyer_id=buyer_id,
                    seller_id=seller_id,
                    task_description=desc,
                    expected_schema_name=schema.__name__,
                    payment_amount=payment_amount,
                    simulated_output=simulated_output
                )
            return wrapper
        return decorator
