import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.bus import bus

router = APIRouter()

@router.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "hello"})
    
    queue = bus.subscribe()
    
    async def send_ping():
        while True:
            await asyncio.sleep(15)
            try:
                await websocket.send_json({"type": "ping"})
            except BaseException:
                break

    ping_task = asyncio.create_task(send_ping())
    
    try:
        while True:
            client_task = asyncio.create_task(websocket.receive_json())
            bus_task = asyncio.create_task(queue.get())
            
            done, pending = await asyncio.wait(
                [client_task, bus_task], 
                return_when=asyncio.FIRST_COMPLETED
            )
            
            if bus_task in done:
                try:
                    event = bus_task.result()
                    await websocket.send_json(event)
                except asyncio.CancelledError:
                    # Evicted by EventBus for being a slow consumer
                    await websocket.close(code=4001, reason="slow consumer")
                    return
                finally:
                    client_task.cancel()
            else:
                bus_task.cancel()
                data = client_task.result()
                if isinstance(data, dict) and data.get("type") == "pong":
                    pass # Keep alive
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        ping_task.cancel()
        bus.unsubscribe(queue)
