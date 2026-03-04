import asyncio
import logging
from datetime import datetime, timezone

import pytz
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = logging.getLogger(__name__)


@router.get("/me")
async def get_me(current_admin: dict = Depends(get_current_admin)):
    admin = dict(current_admin)
    admin.pop("hashed_password", None)
    return admin


@router.get("/dashboard")
async def dashboard(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    nz_tz = pytz.timezone("Pacific/Auckland")
    today = datetime.now(nz_tz).strftime("%Y-%m-%d")

    total = await db.bookings.count_documents({})
    todays = await db.bookings.count_documents({"date": today})
    pending = await db.bookings.count_documents({"status": "pending"})
    confirmed = await db.bookings.count_documents({"status": "confirmed"})

    return {
        "total_bookings": total,
        "todays_bookings": todays,
        "pending": pending,
        "confirmed": confirmed,
        "date": today,
    }


@router.get("/system-health")
async def system_health(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    try:
        await asyncio.wait_for(db.command("ping"), timeout=3.0)
        db_ok = True
    except Exception:
        db_ok = False

    return {
        "database": "healthy" if db_ok else "unhealthy",
        "api": "healthy",
    }


@router.get("/customers")
async def list_customers(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)

    customers = {}
    for b in bookings:
        email = b.get("email", "")
        if not email:
            continue
        if email not in customers:
            customers[email] = {
                "email": email,
                "name": b.get("name", ""),
                "phone": b.get("phone", ""),
                "total_bookings": 0,
                "total_spent": 0,
            }
        customers[email]["total_bookings"] += 1
        customers[email]["total_spent"] += b.get("pricing", {}).get("totalPrice", 0)

    return {"customers": list(customers.values())}
