import hashlib
import json
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace
from opentelemetry.trace.status import Status, StatusCode

from app.database import SessionLocal
from app.enterprise_models import Audit_Logs

# Initialize tracer for the enterprise module
tracer = trace.get_tracer("parallax.enterprise.audit")

class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI Middleware to intercept Parallax validation events and record them
    in an immutable audit log using OpenTelemetry and PostgreSQL.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Determine if this route is an auditable event
        path = request.url.path
        
        # We only want to audit specific validation and escrow events
        # e.g., /api/v1/verdict, /api/v1/escrow
        is_auditable = any(
            keyword in path for keyword in ["/verdict", "/escrow"]
        )

        if not is_auditable:
            return await call_next(request)

        # Read the request body (needed for payload hashing)
        # Note: reading body in middleware requires careful handling in FastAPI
        # as it consumes the stream.
        body_bytes = await request.body()
        
        # Restore the stream for the downstream handlers
        async def receive():
            return {"type": "http.request", "body": body_bytes}
        request._receive = receive

        response = await call_next(request)
        
        # We start an OpenTelemetry span to track this SOC2 audit event
        with tracer.start_as_current_span("audit_log_event") as span:
            span.set_attribute("http.method", request.method)
            span.set_attribute("http.url", str(request.url))
            span.set_attribute("http.status_code", response.status_code)

            event_type = self._determine_event_type(path, request.method, response.status_code)
            
            # Generate SHA-256 hash of the request payload
            payload_hash = self._generate_hash(body_bytes)
            span.set_attribute("audit.payload_hash", payload_hash)
            span.set_attribute("audit.event_type", event_type)
            
            if response.status_code >= 400:
                span.set_status(Status(StatusCode.ERROR))
            
            # Persist to database for long-term immutable storage
            self._persist_audit_log(
                event_type=event_type,
                payload_hash=payload_hash,
                # In a real app, actor_id and tx_id would be extracted from the token/request
                actor_id=request.headers.get("X-User-Id", "system"),
                tx_id=None 
            )

        return response

    def _determine_event_type(self, path: str, method: str, status_code: int) -> str:
        """Heuristically determine the event type based on the endpoint."""
        if "/verdict" in path:
            return "Schema Pass" if status_code == 200 else "Schema Fail"
        if "/escrow" in path:
            if method == "POST":
                return "Escrow Lock"
            elif method == "PUT" or method == "PATCH":
                return "Escrow Release"
        return "Unknown Validation Event"

    def _generate_hash(self, payload: bytes) -> str:
        """Generate a SHA-256 hash of the event payload to ensure immutability."""
        return hashlib.sha256(payload).hexdigest()

    def _persist_audit_log(self, event_type: str, payload_hash: str, actor_id: str, tx_id: str | None = None) -> None:
        """Save the audit event to Postgres synchronously (or via background task)."""
        db = SessionLocal()
        try:
            log_entry = Audit_Logs(
                event_type=event_type,
                payload_hash=payload_hash,
                actor_id=actor_id,
                tx_id=tx_id
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            db.rollback()
            # In a production SOC2 system, failing to audit log should ideally halt the transaction
            # or alert paging systems immediately.
            raise e
        finally:
            db.close()
