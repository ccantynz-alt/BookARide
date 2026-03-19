"""
AI Ledger — Async database layer built on asyncpg.

This module provides a thin, typed wrapper around an asyncpg connection
pool.  Unlike the BookARide JSONB compatibility layer, this uses proper
relational queries — accounting data demands referential integrity and
performant aggregation that JSONB can't deliver.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncIterator, List, Optional

import asyncpg

logger = logging.getLogger(__name__)

# Module-level pool reference, set during application startup.
_pool: Optional[asyncpg.Pool] = None

SCHEMA_PATH = Path(__file__).parent / "schema.sql"


async def init_pool(dsn: str, *, min_size: int = 2, max_size: int = 10) -> asyncpg.Pool:
    """Create the asyncpg connection pool and store it globally.

    Args:
        dsn: Neon PostgreSQL connection string.
        min_size: Minimum idle connections to keep in the pool.
        max_size: Maximum connections allowed.

    Returns:
        The newly created ``asyncpg.Pool``.
    """
    global _pool
    if _pool is not None:
        logger.warning("Connection pool already initialised — skipping.")
        return _pool

    _pool = await asyncpg.create_pool(
        dsn,
        min_size=min_size,
        max_size=max_size,
        command_timeout=30,
    )
    logger.info("Database connection pool created (min=%d, max=%d).", min_size, max_size)
    return _pool


def get_pool() -> asyncpg.Pool:
    """Return the active connection pool.

    Raises:
        RuntimeError: If the pool has not been initialised yet.
    """
    if _pool is None:
        raise RuntimeError(
            "Database pool is not initialised.  "
            "Call `await init_pool(dsn)` during application startup."
        )
    return _pool


async def close_pool() -> None:
    """Gracefully close the connection pool."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
        logger.info("Database connection pool closed.")


# ── Query helpers ───────────────────────────────────────────────────


async def execute(query: str, *args: Any) -> str:
    """Execute a statement and return its status string (e.g. ``'INSERT 0 1'``).

    Args:
        query: SQL statement with ``$1, $2, ...`` placeholders.
        *args: Positional bind parameters.
    """
    pool = get_pool()
    return await pool.execute(query, *args)


async def fetch(query: str, *args: Any) -> List[asyncpg.Record]:
    """Execute a query and return all resulting rows.

    Args:
        query: SQL query with ``$1, $2, ...`` placeholders.
        *args: Positional bind parameters.

    Returns:
        A list of ``asyncpg.Record`` objects (can be used like dicts).
    """
    pool = get_pool()
    return await pool.fetch(query, *args)


async def fetchrow(query: str, *args: Any) -> Optional[asyncpg.Record]:
    """Execute a query and return the first row, or ``None``.

    Args:
        query: SQL query with ``$1, $2, ...`` placeholders.
        *args: Positional bind parameters.
    """
    pool = get_pool()
    return await pool.fetchrow(query, *args)


async def fetchval(query: str, *args: Any, column: int = 0) -> Any:
    """Execute a query and return a single value from the first row.

    Args:
        query: SQL query with ``$1, $2, ...`` placeholders.
        *args: Positional bind parameters.
        column: Zero-based column index to return (default ``0``).
    """
    pool = get_pool()
    return await pool.fetchval(query, *args, column=column)


# ── Transaction support ────────────────────────────────────────────


@asynccontextmanager
async def transaction() -> AsyncIterator[asyncpg.Connection]:
    """Provide a transactional connection as an async context manager.

    Usage::

        async with transaction() as conn:
            await conn.execute("INSERT INTO ...")
            await conn.execute("UPDATE ...")
            # Automatically committed on clean exit; rolled back on exception.
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            yield conn


# ── Health check ────────────────────────────────────────────────────


async def health_check() -> dict[str, Any]:
    """Run a lightweight connectivity check.

    Returns:
        A dict with ``status`` (``"ok"`` or ``"error"``), the current
        server timestamp, and pool statistics.
    """
    try:
        pool = get_pool()
        now = await pool.fetchval("SELECT NOW()")
        return {
            "status": "ok",
            "server_time": str(now),
            "pool_size": pool.get_size(),
            "pool_free": pool.get_idle_size(),
            "pool_min": pool.get_min_size(),
            "pool_max": pool.get_max_size(),
        }
    except Exception as exc:
        logger.error("Database health check failed: %s", exc)
        return {"status": "error", "detail": str(exc)}


# ── Schema bootstrapping ───────────────────────────────────────────


async def run_schema(schema_path: Optional[Path] = None) -> None:
    """Execute the SQL schema file to create/update tables.

    This is safe to call on every startup — ``CREATE TABLE IF NOT EXISTS``
    and ``CREATE INDEX IF NOT EXISTS`` are idempotent.

    Args:
        schema_path: Path to the ``.sql`` file.  Defaults to
            ``schema.sql`` in the same directory as this module.
    """
    path = schema_path or SCHEMA_PATH
    if not path.exists():
        logger.warning("Schema file not found at %s — skipping table creation.", path)
        return

    sql = path.read_text(encoding="utf-8")
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(sql)
    logger.info("Schema applied from %s.", path)
