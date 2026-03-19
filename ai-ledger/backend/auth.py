"""
AI Ledger — JWT authentication, authorization, and security utilities.

Provides:
- JWT token creation and verification.
- FastAPI dependencies for route-level auth (``get_current_user``,
  ``require_role``).
- Password hashing via passlib/bcrypt.
- MFA TOTP verification via pyotp.
- Simple in-memory rate limiting decorator.
"""

from __future__ import annotations

import functools
import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
import pyotp

from config import Settings, get_settings

logger = logging.getLogger(__name__)

# ── Security schemes ───────────────────────────────────────────────

_bearer_scheme = HTTPBearer(auto_error=True)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ════════════════════════════════════════════════════════════════════
#  Password hashing
# ════════════════════════════════════════════════════════════════════


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of *plain*."""
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Check *plain* against *hashed*.  Returns ``True`` on match."""
    return _pwd_context.verify(plain, hashed)


# ════════════════════════════════════════════════════════════════════
#  JWT helpers
# ════════════════════════════════════════════════════════════════════


def create_access_token(
    user_id: UUID,
    org_id: UUID,
    role: str,
    settings: Optional[Settings] = None,
) -> str:
    """Create a signed JWT containing the user's identity claims.

    Args:
        user_id: Primary key of the authenticated user.
        org_id: The organization the user belongs to.
        role: Role string (``owner``, ``admin``, ``member``, ``viewer``).
        settings: Optional override; defaults to ``get_settings()``.

    Returns:
        An encoded JWT string.
    """
    cfg = settings or get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "org_id": str(org_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(hours=cfg.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, cfg.JWT_SECRET_KEY, algorithm=cfg.JWT_ALGORITHM)


def _decode_token(token: str, settings: Optional[Settings] = None) -> dict:
    """Decode and validate a JWT, returning its payload dict.

    Raises ``HTTPException(401)`` on any failure.
    """
    cfg = settings or get_settings()
    try:
        payload = jwt.decode(
            token,
            cfg.JWT_SECRET_KEY,
            algorithms=[cfg.JWT_ALGORITHM],
        )
        if payload.get("sub") is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject claim.",
            )
        return payload
    except JWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        ) from exc


# ════════════════════════════════════════════════════════════════════
#  FastAPI dependencies
# ════════════════════════════════════════════════════════════════════


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    """Dependency that extracts and validates the JWT from the
    ``Authorization: Bearer <token>`` header.

    Returns:
        The decoded JWT payload as a dict.
    """
    return _decode_token(credentials.credentials)


async def get_current_user(
    payload: dict = Depends(verify_token),
) -> dict:
    """Dependency that returns the current user's identity claims.

    The returned dict contains ``user_id``, ``org_id``, and ``role``.
    """
    return {
        "user_id": UUID(payload["sub"]),
        "org_id": UUID(payload["org_id"]),
        "role": payload["role"],
    }


def require_role(allowed_roles: List[str]) -> Callable:
    """Factory that returns a FastAPI dependency restricting access to
    users whose JWT ``role`` claim is in *allowed_roles*.

    Usage::

        @router.delete("/dangerous", dependencies=[Depends(require_role(["owner", "admin"]))])
        async def dangerous_endpoint(): ...
    """

    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user['role']}' is not permitted. "
                       f"Required: {', '.join(allowed_roles)}.",
            )
        return current_user

    return _check


# ════════════════════════════════════════════════════════════════════
#  MFA / TOTP
# ════════════════════════════════════════════════════════════════════


def generate_totp_secret() -> str:
    """Generate a new TOTP secret suitable for provisioning."""
    return pyotp.random_base32()


def get_totp_provisioning_uri(
    secret: str,
    email: str,
    issuer: str = "AI Ledger",
) -> str:
    """Return an ``otpauth://`` URI for QR-code based MFA enrolment."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name=issuer)


def verify_totp(secret: str, code: str) -> bool:
    """Validate a 6-digit TOTP code against *secret*.

    Allows a 30-second window of tolerance (``valid_window=1``).
    """
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


# ════════════════════════════════════════════════════════════════════
#  Rate limiting (in-memory, per-process)
# ════════════════════════════════════════════════════════════════════

_rate_store: dict[str, list[float]] = defaultdict(list)


def rate_limit(
    max_requests: int = 60,
    window_seconds: int = 60,
    key_func: Optional[Callable[[Request], str]] = None,
) -> Callable:
    """Decorator / dependency factory for simple in-memory rate limiting.

    Args:
        max_requests: Maximum allowed requests within the window.
        window_seconds: Sliding window duration in seconds.
        key_func: Callable that extracts a rate-limit key from the
            ``Request`` object.  Defaults to client IP.

    Returns:
        A FastAPI dependency that raises ``HTTPException(429)`` when
        the rate limit is exceeded.

    Usage::

        @router.post("/login", dependencies=[Depends(rate_limit(5, 60))])
        async def login(): ...
    """

    def _default_key(request: Request) -> str:
        return request.client.host if request.client else "unknown"

    resolve_key = key_func or _default_key

    async def _dependency(request: Request) -> None:
        key = resolve_key(request)
        now = time.monotonic()
        cutoff = now - window_seconds

        # Prune expired entries
        timestamps = _rate_store[key]
        _rate_store[key] = [t for t in timestamps if t > cutoff]

        if len(_rate_store[key]) >= max_requests:
            logger.warning("Rate limit exceeded for key=%s", key)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
            )
        _rate_store[key].append(now)

    return _dependency
