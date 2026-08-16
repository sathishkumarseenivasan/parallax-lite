"""
FastAPI application entry point for Parallax Lite.
Configures CORS, exception handlers, and includes all routers.
"""
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.database import init_db
from app.models import Agent
from app.routers import agents, metrics, transactions, stream, analytics, search, ledger, trust
from app.schemas import HealthResponse

from app.errors import PLXError

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Initialize database and seed default agents on startup."""
    logger.info("Starting Parallax Lite backend…")
    init_db()
    _seed_default_agents()
    logger.info("Database ready.")
    yield
    logger.info("Shutting down Parallax Lite backend.")


def _seed_default_agents() -> None:
    """Ensure the two canonical demo agents exist in the database."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        if db.get(Agent, "agent_alpha") is None:
            db.add(
                Agent(
                    id="agent_alpha",
                    name="Agent Alpha",
                    role="buyer",
                    balance=1000.0,
                )
            )
        if db.get(Agent, "agent_beta") is None:
            db.add(
                Agent(
                    id="agent_beta",
                    name="Agent Beta",
                    role="seller",
                    balance=0.0,
                )
            )
        db.commit()
    finally:
        db.close()


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Parallax Lite — Open-source escrow referee for agent-to-agent transactions. "
        "Intercepts payments, validates outputs, and only releases funds when work is correct."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.exception_handler(PLXError)
async def plx_error_handler(request: Request, exc: PLXError):
    return JSONResponse(
        status_code=400,
        content=exc.to_dict()
    )

# ---------------------------------------------------------------------------
# CORS & Security Gating
# ---------------------------------------------------------------------------

if settings.parallax_mode == "network":
    allow_origins = [settings.frontend_origin]
elif settings.parallax_mode == "private":
    allow_origins = [settings.frontend_origin, "http://localhost:3000", "http://127.0.0.1:3000"]
else:
    allow_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=(settings.parallax_mode != "local"),
    allow_methods=["*"],
    allow_headers=["*"],
)

import time
import asyncio
from collections import defaultdict
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class SecurityGatingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        
        # 1. Gate public routes (Trust Badges, etc.)
        if path.startswith("/api/public") or path.startswith("/badges"):
            if not settings.public_endpoints_enabled:
                return JSONResponse(status_code=404, content={"code": "PLX-404", "message": "Public endpoints disabled in this mode."})
                
        # 2. Gate seed endpoint
        if path == "/api/agents/seed":
            if not settings.seed_enabled:
                return JSONResponse(status_code=404, content={"code": "PLX-404", "message": "Demo seeding disabled in this mode."})
                
        # 3. Gate system doctor (only accessible locally)
        if path.startswith("/api/system/doctor"):
            client_ip = request.client.host if request.client else "127.0.0.1"
            if client_ip not in ["127.0.0.1", "::1", "localhost"]:
                return JSONResponse(status_code=403, content={"code": "PLX-403", "message": "Forbidden from public internet."})
                
        return await call_next(request)

app.add_middleware(SecurityGatingMiddleware)

class TokenBucketRateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, rate=5, capacity=20):
        super().__init__(app)
        self.rate = rate
        self.capacity = capacity
        self.tokens = defaultdict(lambda: capacity)
        self.last_update = defaultdict(time.time)
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        if not settings.rate_limits_enabled:
            return await call_next(request)
            
        if not (request.url.path.startswith("/api/public") or request.url.path.startswith("/badges") or request.url.path.startswith("/api/transactions/submit")):
            return await call_next(request)
            
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        async with self.lock:
            elapsed = now - self.last_update[client_ip]
            self.tokens[client_ip] = min(self.capacity, self.tokens[client_ip] + elapsed * self.rate)
            self.last_update[client_ip] = now
            
            if self.tokens[client_ip] >= 1:
                self.tokens[client_ip] -= 1
            else:
                return JSONResponse(
                    status_code=429,
                    content={
                        "code": "PLX-429",
                        "message": "Too Many Requests. Rate limit exceeded.",
                        "docs": "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-429"
                    }
                )
                
        return await call_next(request)

app.add_middleware(TokenBucketRateLimiter)


# ---------------------------------------------------------------------------
# Exception handlers
# ---------------------------------------------------------------------------

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=400, content={
        "code": "PLX-100",
        "message": str(exc),
        "docs": "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-100"
    })


@app.exception_handler(LookupError)
async def lookup_error_handler(request: Request, exc: LookupError) -> JSONResponse:
    return JSONResponse(status_code=404, content={
        "code": "PLX-101",
        "message": str(exc),
        "docs": "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-101"
    })

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={
        "code": f"PLX-{exc.status_code}",
        "message": str(exc.detail),
        "docs": f"https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-{exc.status_code}"
    })

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={
        "code": "PLX-422",
        "message": str(exc),
        "docs": "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-422"
    })

@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content={
        "code": "PLX-500",
        "message": "Internal Server Error",
        "docs": "https://github.com/parallax-protocol/parallax-lite/tree/main/docs/errors.md#plx-500"
    })


# ---------------------------------------------------------------------------
# Core routes
# ---------------------------------------------------------------------------

@app.get("/api/health", response_model=HealthResponse, tags=["system"])
async def health_check() -> HealthResponse:
    """Liveness probe — confirms the API and database are reachable."""
    from app.schemas import FeaturesResponse
    return HealthResponse(
        status="ok",
        version=settings.app_version,
        database="sqlite",
        mode=settings.parallax_mode,
        features=FeaturesResponse(
            public_endpoints=settings.public_endpoints_enabled,
            rate_limits=settings.rate_limits_enabled,
            machine_onboarding=settings.machine_onboarding_enabled,
            seed=settings.seed_enabled,
            simulate=settings.simulate_enabled
        )
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

app.include_router(agents.router)
app.include_router(transactions.router)
app.include_router(metrics.router)
app.include_router(stream.router)
app.include_router(analytics.router)
app.include_router(search.router)
app.include_router(ledger.router)
app.include_router(trust.router)

from app.routers import verdict, playground, disputes, receipts
app.include_router(verdict.router)
app.include_router(playground.router)
app.include_router(disputes.router)
app.include_router(receipts.router)
from app.routers import public, onboarding, schemas, machine, doctor
app.include_router(public.router)
app.include_router(onboarding.router)
app.include_router(schemas.router)
app.include_router(machine.router)
app.include_router(doctor.router)
