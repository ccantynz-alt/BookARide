"""
AI Ledger — Application configuration via pydantic-settings.

All secrets are loaded from environment variables (set in the hosting
platform's dashboard, e.g. Render).  The `.env.example` file in this
directory documents every variable; no real secrets live in the repo.
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration object.

    Values are read from environment variables.  Defaults are provided
    only for non-secret, non-environment-specific settings.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── Database (Neon PostgreSQL) ──────────────────────────────────
    DATABASE_URL: str  # e.g. postgresql://user:pass@ep-xyz.neon.tech/dbname

    # ── Authentication / JWT ────────────────────────────────────────
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

    # ── AI (Anthropic Claude) ───────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""

    # ── Email (Mailgun ONLY — no SMTP, no SendGrid) ────────────────
    MAILGUN_API_KEY: str = ""
    MAILGUN_DOMAIN: str = ""

    # ── Payments (Stripe) ───────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""

    # ── Maps (Google Maps — address validation) ─────────────────────
    GOOGLE_MAPS_API_KEY: str = ""

    # ── Bank feeds — US (Plaid) ─────────────────────────────────────
    PLAID_CLIENT_ID: str = ""
    PLAID_SECRET: str = ""

    # ── Bank feeds — AU / NZ (Basiq) ────────────────────────────────
    BASIQ_API_KEY: str = ""

    # ── Bank feeds — UK (TrueLayer) ─────────────────────────────────
    TRUELAYER_CLIENT_ID: str = ""
    TRUELAYER_SECRET: str = ""

    # ── Application ─────────────────────────────────────────────────
    APP_NAME: str = "AI Ledger"
    APP_URL: str = "http://localhost:3000"

    # ── Multi-jurisdiction support ──────────────────────────────────
    SUPPORTED_JURISDICTIONS: List[str] = ["US", "NZ", "AU", "UK"]
    SUPPORTED_CURRENCIES: List[str] = ["USD", "NZD", "AUD", "GBP"]


@lru_cache
def get_settings() -> Settings:
    """Return a cached :class:`Settings` singleton.

    The ``@lru_cache`` decorator ensures the environment is parsed only
    once per process lifetime, which is appropriate for immutable config.
    """
    return Settings()  # type: ignore[call-arg]
