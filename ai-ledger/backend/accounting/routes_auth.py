"""Authentication routes: register, login, profile, password reset."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from ..auth import (
    create_access_token,
    get_current_user,
    hash_password,
    rate_limit,
    verify_password,
)
from ..database import get_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)
    org_name: Optional[str] = Field(
        None, max_length=200,
        description="Organization name. If omitted, a personal org is created.",
    )
    country: str = Field(default="NZ", max_length=2)
    currency: str = Field(default="NZD", max_length=3)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    mfa_code: Optional[str] = Field(None, max_length=6)


class AuthResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: dict


class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    org_id: str
    org_name: Optional[str] = None
    country: Optional[str] = None
    currency: Optional[str] = None
    mfa_enabled: bool = False
    created_at: Optional[datetime] = None


class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=200)
    country: Optional[str] = Field(None, max_length=2)
    currency: Optional[str] = Field(None, max_length=3)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user and organization",
    dependencies=[Depends(rate_limit(10, 3600))],
)
async def register(body: RegisterRequest):
    """Create a new user account and optionally a new organization.

    If ``org_name`` is provided, an organization is created and the user
    is assigned the ``owner`` role.  Otherwise a personal workspace is
    created.
    """
    db = await get_db()

    # Check for existing user
    existing = await db.fetchrow(
        "SELECT id FROM users WHERE email = $1", body.email
    )
    if existing:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "An account with this email already exists.",
        )

    # Create organization
    org_id = uuid4()
    org_name = body.org_name or f"{body.full_name}'s Workspace"
    now = datetime.now(timezone.utc)

    await db.execute(
        """
        INSERT INTO organizations (id, name, country, base_currency, created_at)
        VALUES ($1, $2, $3, $4, $5)
        """,
        str(org_id), org_name, body.country, body.currency, now,
    )

    # Create user
    user_id = uuid4()
    password_hash = hash_password(body.password)

    await db.execute(
        """
        INSERT INTO users (id, email, password_hash, full_name, org_id, role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """,
        str(user_id), body.email, password_hash, body.full_name,
        str(org_id), "owner", now,
    )

    # Issue JWT
    token = create_access_token(user_id, org_id, "owner")

    return AuthResponse(
        token=token,
        user={
            "id": str(user_id),
            "email": body.email,
            "full_name": body.full_name,
            "role": "owner",
            "org_id": str(org_id),
            "org_name": org_name,
        },
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate and receive a JWT",
    dependencies=[Depends(rate_limit(5, 60))],
)
async def login(body: LoginRequest):
    """Authenticate with email and password.

    Returns a JWT that should be included in the ``Authorization: Bearer``
    header for subsequent requests.
    """
    db = await get_db()

    row = await db.fetchrow(
        """
        SELECT u.id, u.email, u.password_hash, u.full_name, u.role,
               u.org_id, u.mfa_secret, o.name AS org_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.org_id
        WHERE u.email = $1
        """,
        body.email,
    )

    if not row or not verify_password(body.password, row["password_hash"]):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password.",
        )

    # MFA check
    if row.get("mfa_secret"):
        if not body.mfa_code:
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "MFA code required.",
            )
        from ..auth import verify_totp
        if not verify_totp(row["mfa_secret"], body.mfa_code):
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "Invalid MFA code.",
            )

    user_id = UUID(row["id"]) if isinstance(row["id"], str) else row["id"]
    org_id = UUID(row["org_id"]) if isinstance(row["org_id"], str) else row["org_id"]

    token = create_access_token(user_id, org_id, row["role"])

    return AuthResponse(
        token=token,
        user={
            "id": str(user_id),
            "email": row["email"],
            "full_name": row["full_name"],
            "role": row["role"],
            "org_id": str(org_id),
            "org_name": row.get("org_name"),
        },
    )


@router.get(
    "/me",
    response_model=ProfileResponse,
    summary="Get current user profile",
)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile information."""
    db = await get_db()

    row = await db.fetchrow(
        """
        SELECT u.id, u.email, u.full_name, u.role, u.org_id,
               u.country, u.currency, u.mfa_secret, u.created_at,
               o.name AS org_name
        FROM users u
        LEFT JOIN organizations o ON o.id = u.org_id
        WHERE u.id = $1
        """,
        str(current_user["user_id"]),
    )

    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    return ProfileResponse(
        id=str(row["id"]),
        email=row["email"],
        full_name=row["full_name"],
        role=row["role"],
        org_id=str(row["org_id"]),
        org_name=row.get("org_name"),
        country=row.get("country"),
        currency=row.get("currency"),
        mfa_enabled=bool(row.get("mfa_secret")),
        created_at=row.get("created_at"),
    )


@router.put(
    "/me",
    response_model=ProfileResponse,
    summary="Update current user profile",
)
async def update_me(
    body: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update the authenticated user's profile fields."""
    db = await get_db()

    updates = {}
    if body.full_name is not None:
        updates["full_name"] = body.full_name
    if body.country is not None:
        updates["country"] = body.country
    if body.currency is not None:
        updates["currency"] = body.currency

    if not updates:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "No fields to update.",
        )

    set_clause = ", ".join(f"{k} = ${i+2}" for i, k in enumerate(updates))
    values = [str(current_user["user_id"])] + list(updates.values())

    await db.execute(
        f"UPDATE users SET {set_clause}, updated_at = NOW() WHERE id = $1",
        *values,
    )

    # Return updated profile
    return await get_me(current_user)


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request a password reset email",
    dependencies=[Depends(rate_limit(3, 300))],
)
async def forgot_password(body: ForgotPasswordRequest):
    """Send a password reset link to the user's email.

    Always returns success to prevent email enumeration.
    """
    db = await get_db()

    row = await db.fetchrow(
        "SELECT id, email FROM users WHERE email = $1", body.email
    )

    if row:
        reset_token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)

        await db.execute(
            """
            INSERT INTO password_resets (user_id, token, created_at, expires_at)
            VALUES ($1, $2, $3, $3 + INTERVAL '1 hour')
            ON CONFLICT (user_id)
            DO UPDATE SET token = $2, created_at = $3, expires_at = $3 + INTERVAL '1 hour'
            """,
            str(row["id"]), reset_token, now,
        )

        logger.info("Password reset token generated for user %s", row["id"])
        # In production: send email via Mailgun with the reset link

    return MessageResponse(
        message="If an account exists with that email, a reset link has been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password using a token",
    dependencies=[Depends(rate_limit(5, 300))],
)
async def reset_password(body: ResetPasswordRequest):
    """Reset the user's password using a valid reset token."""
    db = await get_db()

    row = await db.fetchrow(
        """
        SELECT user_id FROM password_resets
        WHERE token = $1 AND expires_at > NOW()
        """,
        body.token,
    )

    if not row:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Invalid or expired reset token.",
        )

    new_hash = hash_password(body.new_password)

    await db.execute(
        "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
        new_hash, str(row["user_id"]),
    )

    # Invalidate the reset token
    await db.execute(
        "DELETE FROM password_resets WHERE user_id = $1",
        str(row["user_id"]),
    )

    logger.info("Password reset completed for user %s", row["user_id"])

    return MessageResponse(message="Password has been reset successfully.")
