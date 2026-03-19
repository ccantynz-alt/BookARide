"""
AI Ledger — FastAPI application entry point.

Initialises the database pool, registers middleware, mounts routers,
and exposes the health-check endpoint.
"""

from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import get_settings
from database import close_pool, health_check, init_pool, run_schema

logger = logging.getLogger(__name__)

# ── Logging configuration ──────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)


# ── Lifespan (startup / shutdown) ──────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan handler — replaces deprecated on_event."""
    settings = get_settings()

    # Startup
    logger.info("Starting %s …", settings.APP_NAME)
    await init_pool(settings.DATABASE_URL)
    await run_schema()
    logger.info("Database pool ready; schema applied.")

    yield  # Application is running

    # Shutdown
    logger.info("Shutting down %s …", settings.APP_NAME)
    await close_pool()
    logger.info("Shutdown complete.")


# ── Application factory ────────────────────────────────────────────

app = FastAPI(
    title="AI Ledger API",
    version="1.0.0",
    description="Multi-jurisdiction accounting platform with AI-powered categorisation.",
    lifespan=lifespan,
)


# ── CORS middleware ─────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production via env var if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request-ID middleware (audit trail) ────────────────────────────


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Attach a unique request ID to every inbound request.

    The ID is returned in the ``X-Request-ID`` response header and is
    available on ``request.state.request_id`` for downstream logging
    and audit-log entries.
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id

    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000

    response.headers["X-Request-ID"] = request_id
    logger.info(
        "%s %s -> %d (%.1fms) [%s]",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
        request_id,
    )
    return response


# ── Exception handlers ─────────────────────────────────────────────


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Return a consistent JSON envelope for HTTP errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "detail": exc.detail,
            "request_id": getattr(request.state, "request_id", None),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — log the traceback and
    return a generic 500 to the client (never leak internals)."""
    request_id = getattr(request.state, "request_id", None)
    logger.exception("Unhandled exception [request_id=%s]", request_id)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": True,
            "detail": "An unexpected error occurred.",
            "request_id": request_id,
        },
    )


# ── Routers ─────────────────────────────────────────────────────────

from accounting.routes_auth import router as auth_router
from accounting.routes_core import router as core_router
from accounting.routes_invoices import router as invoices_router
from accounting.routes_bank import router as bank_router
from accounting.routes_tax import router as tax_router
from accounting.routes_reports import router as reports_router
from accounting.routes_ai import router as ai_router

app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(core_router, prefix="/api/accounting", tags=["Accounting"])
app.include_router(invoices_router, prefix="/api/accounting", tags=["Invoices"])
app.include_router(bank_router, prefix="/api/accounting", tags=["Bank Feeds"])
app.include_router(tax_router, prefix="/api/accounting", tags=["Tax"])
app.include_router(reports_router, prefix="/api/accounting", tags=["Reports"])
app.include_router(ai_router, prefix="/api/accounting", tags=["AI"])


# ── Health check ────────────────────────────────────────────────────


@app.get("/healthz", tags=["System"])
async def healthz():
    """Liveness / readiness probe.

    Returns database connectivity status, pool stats, and the app
    version.
    """
    db_health = await health_check()
    overall = "ok" if db_health.get("status") == "ok" else "degraded"
    return {
        "status": overall,
        "version": app.version,
        "database": db_health,
    }
