import asyncio
import time
from collections import deque
from typing import Set

from app.database import SessionLocal
from app.models import SystemMeta


class Subscriber:
    def __init__(self):
        self.queue = deque()
        self.event = asyncio.Event()
        self.overflows = []
        self.closed = False

    async def get(self):
        while not self.queue:
            if self.closed:
                raise asyncio.CancelledError()
            await self.event.wait()
            self.event.clear()
        return self.queue.popleft()

    def put(self, event_msg: dict) -> bool:
        if self.closed:
            return False

        # Coalesce metrics.tick
        if event_msg["type"] == "metrics.tick":
            new_queue = deque([e for e in self.queue if e["type"] != "metrics.tick"])
            self.queue = new_queue

        if len(self.queue) >= 1000:
            if event_msg["type"] == "metrics.tick":
                return True

            now = time.time()
            self.overflows = [t for t in self.overflows if now - t < 10]
            self.overflows.append(now)
            if len(self.overflows) >= 3:
                self.closed = True
                self.event.set()
                return False

            self.queue.popleft()

        self.queue.append(event_msg)
        self.event.set()
        return True


class EventBus:
    def __init__(self):
        self._subscribers: Set[Subscriber] = set()
        self._loop = None
        self._seq = 0
        self._seq_initialized = False

    def _init_seq(self):
        if self._seq_initialized:
            return
        try:
            with SessionLocal() as db:
                meta = db.get(SystemMeta, "last_seq")
                if meta:
                    self._seq = int(meta.value)
                else:
                    self._seq = 0
            self._seq_initialized = True
        except Exception:
            pass

    def next_seq(self, db_session=None) -> int:
        self._init_seq()
        self._seq += 1
        try:
            if db_session:
                meta = db_session.get(SystemMeta, "last_seq")
                if not meta:
                    meta = SystemMeta(key="last_seq", value=str(self._seq))
                    db_session.add(meta)
                else:
                    meta.value = str(self._seq)
            else:
                with SessionLocal() as db:
                    meta = db.get(SystemMeta, "last_seq")
                    if not meta:
                        meta = SystemMeta(key="last_seq", value=str(self._seq))
                        db.add(meta)
                    else:
                        meta.value = str(self._seq)
                    db.commit()
        except Exception:
            pass
        return self._seq

    def subscribe(self) -> Subscriber:
        sub = Subscriber()
        self._subscribers.add(sub)
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            pass
        return sub

    def unsubscribe(self, sub: Subscriber):
        if sub in self._subscribers:
            sub.closed = True
            sub.event.set()
            self._subscribers.remove(sub)

    def _publish_inner(self, event_type: str, payload: dict, seq: int):
        event = {"type": event_type, "payload": payload, "seq": seq}
        dead_subs = []
        for sub in list(self._subscribers):
            try:
                ok = sub.put(event)
                if not ok:
                    dead_subs.append(sub)
            except Exception:
                dead_subs.append(sub)
        
        for dead in dead_subs:
            self.unsubscribe(dead)

    async def publish(self, event_type: str, payload: dict, seq: int = None):
        if seq is None:
            seq = self.next_seq()
        self._publish_inner(event_type, payload, seq)

    def publish_sync(self, event_type: str, payload: dict, seq: int = None):
        if seq is None:
            seq = self.next_seq()
        if not self._subscribers:
            return
            
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self.publish(event_type, payload, seq))
        except RuntimeError:
            if self._loop and self._loop.is_running():
                asyncio.run_coroutine_threadsafe(self.publish(event_type, payload, seq), self._loop)
            else:
                self._publish_inner(event_type, payload, seq)

bus = EventBus()
