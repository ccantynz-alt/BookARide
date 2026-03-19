"""
AI Ledger — Authentication routes.

Handles user registration, login, token management, and password reset.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from auth import create_access_token, get_current_user, hash_password, verify_password
from database import execute, fetchrow, fetchval

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Request / Response models ──────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)
    org_name: str = Field(..., min_length=1)
    country: str = Field(..., pattern="^(US|NZ|AU|UK)$")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    org_id: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    mfa_enabled: bool
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


# ── Routes ─────────────────────────────────────────────────────────


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest):
    """Register a new user and create their organization."""
    existing = await fetchval(
        "SELECT id FROM acct_users WHERE email = $1", req.email
    )
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user_id = str(uuid.uuid4())
    org_id = str(uuid.uuid4())
    pw_hash = hash_password(req.password)

    currency_map = {"NZ": "NZD", "AU": "AUD", "US": "USD", "UK": "GBP"}
    fiscal_map = {"NZ": "03-31", "AU": "06-30", "US": "12-31", "UK": "04-05"}

    # Create org
    await execute(
        """INSERT INTO acct_organizations (id, name, country, base_currency, fiscal_year_end)
           VALUES ($1, $2, $3, $4, $5)""",
        org_id, req.org_name, req.country,
        currency_map.get(req.country, "USD"),
        fiscal_map.get(req.country, "12-31"),
    )

    # Create user
    await execute(
        """INSERT INTO acct_users (id, email, password_hash, name, role)
           VALUES ($1, $2, $3, $4, 'owner')""",
        user_id, req.email, pw_hash, req.name,
    )

    # Link user to org
    await execute(
        """INSERT INTO acct_user_org_access (id, user_id, org_id, role, permissions)
           VALUES ($1, $2, $3, 'admin', '["*"]')""",
        str(uuid.uuid4()), user_id, org_id,
    )

    token = create_access_token(user_id=user_id, org_id=org_id, role="owner")

    logger.info("User registered: %s (org=%s)", req.email, org_id)
    return TokenResponse(access_token=token, user_id=user_id, org_id=org_id)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """Authenticate user and return JWT."""
    row = await fetchrow(
        "SELECT id, password_hash, role FROM acct_users WHERE email = $1",
        req.email,
    )
    if not row or not verify_password(req.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")

    user_id = str(row["id"])

    # Get first org
    org_row = await fetchrow(
        "SELECT org_id FROM acct_user_org_access WHERE user_id = $1 LIMIT 1",
        user_id,
    )
    org_id = str(org_row["org_id"]) if org_row else ""

    token = create_access_token(user_id=user_id, org_id=org_id, role=row["role"])

    logger.info("User logged in: %s", req.email)
    return TokenResponse(access_token=token, user_id=user_id, org_id=org_id)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile."""
    row = await fetchrow(
        "SELECT id, email, name, role, mfa_enabled, created_at FROM acct_users WHERE id = $1",
        current_user["user_id"],
    )
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return UserResponse(**dict(row))


@router.put("/me", response_model=UserResponse)
async def update_me(
    req: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update current user profile."""
    updates = []
    params = []
    idx = 1

    if req.name is not None:
        updates.append(f"name = ${idx}")
        params.append(req.name)
        idx += 1
    if req.email is not None:
        updates.append(f"email = ${idx}")
        params.append(req.email)
        idx += 1

    if not updates:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No fields to update")

    params.append(current_user["user_id"])
    sql = f"UPDATE acct_users SET {', '.join(updates)}, updated_at = NOW() WHERE id = ${idx} RETURNING id, email, name, role, mfa_enabled, created_at"

    row = await fetchrow(sql, *params)
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return UserResponse(**dict(row))


@router.post("/forgot-password", status_code=status.HTTP_202_ACCEPTED)
async def forgot_password(req: ForgotPasswordRequest):
    """Send password reset email. Always returns 202 to prevent email enumeration."""
    row = await fetchrow("SELECT id FROM acct_users WHERE email = $1", req.email)
    if row:
        token = str(uuid.uuid4())
        expires = datetime.now(timezone.utc) + timedelta(hours=1)
        await execute(
            """INSERT INTO acct_password_reset_tokens (id, user_id, token, expires_at)
               VALUES ($1, $2, $3, $4)""",
            str(uuid.uuid4()), str(row["id"]), token, expires,
        )
        # TODO: Send email via Mailgun with reset link
        logger.info("Password reset requested for %s", req.email)

    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    """Reset password using token."""
    row = await fetchrow(
        """SELECT user_id FROM acct_password_reset_tokens
           WHERE token = $1 AND expires_at > NOW() AND used_at IS NULL""",
        req.token,
    )
    if not row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired token")

    pw_hash = hash_password(req.new_password)
    await execute(
        "UPDATE acct_users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        pw_hash, str(row["user_id"]),
    )
    await execute(
        "UPDATE acct_password_reset_tokens SET used_at = NOW() WHERE token = $1",
        req.token,
    )

    return {"message": "Password has been reset successfully"}
