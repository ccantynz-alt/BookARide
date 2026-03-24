import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.core.auth import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.admin import AdminLogin, AdminRegister

router = APIRouter(prefix="/admin", tags=["Auth"])


@router.post("/register")
async def register(data: AdminRegister):
    from app.main import db

    existing = await db.admin_users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    existing_email = await db.admin_users.find_one({"email": data.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    admin_user = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    await db.admin_users.insert_one(admin_user)

    token = create_access_token({"sub": data.username})
    return {"access_token": token, "token_type": "bearer", "username": data.username}


@router.post("/login")
async def login(data: AdminLogin):
    from app.main import db

    admin = await db.admin_users.find_one({"username": data.username}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(data.password, admin.get("hashed_password", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": admin["username"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": admin["username"],
        "email": admin.get("email"),
    }
