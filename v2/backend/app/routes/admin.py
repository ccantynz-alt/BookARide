import asyncio
import logging
from datetime import datetime, timezone

import pytz
from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import get_current_admin
from app.services.email import send_customer_confirmation, send_admin_notification, send_post_trip_email, is_configured

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
    completed = await db.bookings.count_documents({"status": "completed"})
    cancelled = await db.bookings.count_documents({"status": "cancelled"})

    # Revenue: sum of paid bookings
    paid_bookings = await db.bookings.find(
        {"payment_status": "paid"}, {"_id": 0}
    ).to_list(10000)
    total_revenue = sum(float(b.get("totalPrice", 0) or 0) for b in paid_bookings)

    return {
        "total_bookings": total,
        "todays_bookings": todays,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled,
        "total_revenue": round(total_revenue, 2),
        "date": today,
        "email_configured": is_configured(),
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
        "email": "configured" if is_configured() else "not configured",
    }


@router.get("/customers")
async def list_customers(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)

    customers = {}
    for b in bookings:
        data = b.get("data", b) if isinstance(b.get("data"), dict) else b
        email = data.get("email", "")
        if not email:
            continue
        if email not in customers:
            customers[email] = {
                "email": email,
                "name": data.get("name", ""),
                "phone": data.get("phone", ""),
                "total_bookings": 0,
                "total_spent": 0,
                "last_booking": "",
            }
        customers[email]["total_bookings"] += 1
        customers[email]["total_spent"] += float(data.get("totalPrice", 0) or 0)
        bdate = data.get("date", "")
        if bdate > customers[email]["last_booking"]:
            customers[email]["last_booking"] = bdate

    result = sorted(customers.values(), key=lambda c: c["total_bookings"], reverse=True)
    return {"customers": result}


# ── Deleted Bookings ────────────────────────────────────────────


@router.get("/deleted-bookings")
async def list_deleted_bookings(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    bookings = await db.deleted_bookings.find({}, {"_id": 0}).to_list(10000)
    return {"bookings": bookings, "total": len(bookings)}


# ── Archived Bookings ───────────────────────────────────────────


@router.get("/archived-bookings")
async def list_archived_bookings(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    bookings = await db.bookings_archive.find({}, {"_id": 0}).to_list(10000)
    return {"bookings": bookings, "total": len(bookings)}


# ── Manual Status Update ────────────────────────────────────────


@router.post("/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    data: dict,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    new_status = data.get("status")
    if new_status not in ("pending", "confirmed", "completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    old_status = booking.get("status", "")
    updates = {"status": new_status}

    # If marking as completed, trigger post-trip email
    if new_status == "completed" and old_status != "completed":
        bdata = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking
        if not bdata.get("postTripEmailSent"):
            try:
                await send_post_trip_email(booking)
                updates["postTripEmailSent"] = True
                updates["postTripEmailSentAt"] = datetime.now(timezone.utc).isoformat()
            except Exception as e:
                logger.error(f"Post-trip email failed for {booking_id}: {e}")

    await db.bookings.update_one({"id": booking_id}, {"$set": updates})
    logger.info(f"Booking {booking_id} status: {old_status} -> {new_status}")
    return {"message": f"Status updated to {new_status}"}


# ── Resend Confirmation Email ───────────────────────────────────


@router.post("/bookings/{booking_id}/resend-confirmation")
async def resend_confirmation(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    sent = await send_customer_confirmation(booking)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email")
    return {"message": "Confirmation email resent"}


# ── Resend Payment Link ────────────────────────────────────────


@router.post("/bookings/{booking_id}/resend-payment-link")
async def resend_payment_link(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    bdata = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking
    if bdata.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="Booking already paid")

    import os
    from app.services.email import send_email, _base_html

    public_domain = os.environ.get("PUBLIC_DOMAIN", "https://bookaride.co.nz")
    name = bdata.get("name") or "Customer"
    ref = bdata.get("referenceNumber") or bdata.get("id", "N/A")
    email = bdata.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No customer email")

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">Complete Your Booking Payment</h2>
    <p>Hi {name},</p>
    <p>Please complete your payment for booking <strong>#{ref}</strong>.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="{public_domain}/pay/{booking_id}"
         style="display:inline-block;background:#D4AF37;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Pay Now
      </a>
    </div>"""

    html = _base_html(f"Payment Link - #{ref}", body)
    sent = await send_email(email, f"Payment Link - Booking #{ref}", html)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send payment link")
    return {"message": "Payment link sent"}


# ── Drivers List ────────────────────────────────────────────────


@router.get("/drivers")
async def list_drivers(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    drivers = await db.drivers.find({}, {"_id": 0}).to_list(1000)
    return {"drivers": drivers}


# ── Email Logs ──────────────────────────────────────────────────


@router.get("/email-logs")
async def list_email_logs(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    logs = await db.email_logs.find({}, {"_id": 0}).to_list(100)
    return {"logs": logs}
