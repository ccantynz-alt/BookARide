import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.core.auth import get_current_admin
from app.models.booking import Booking, BookingCreate
from app.services.email import send_customer_confirmation, send_admin_notification

router = APIRouter(tags=["Bookings"])
logger = logging.getLogger(__name__)


async def get_next_reference_number():
    from app.main import db

    counter = await db.counters.find_one_and_update(
        {"id": "booking_reference"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True,
    )
    if counter is None or counter.get("seq", 0) < 10:
        await db.counters.update_one(
            {"id": "booking_reference"},
            {"$set": {"seq": 10}},
            upsert=True,
        )
        return 10
    return counter.get("seq", 10)


async def _send_booking_notifications(booking_dict: dict):
    """Send confirmation + admin notification after booking creation."""
    try:
        await send_customer_confirmation(booking_dict)
    except Exception as e:
        logger.error(f"CRITICAL: Customer confirmation email failed: {e}")
    try:
        await send_admin_notification(booking_dict)
    except Exception as e:
        logger.error(f"CRITICAL: Admin notification failed: {e}")


async def _check_booking_conflicts(booking_dict: dict):
    """Check for driver double-bookings (overlapping pickup times)."""
    from app.main import db
    from app.services.email import send_email, ADMIN_EMAIL

    date = booking_dict.get("date", "")
    time = booking_dict.get("time", "")
    if not date or not time:
        return

    existing = await db.bookings.find(
        {"date": date, "status": {"$in": ["confirmed", "pending"]}},
        {"_id": 0},
    ).to_list(10000)

    conflicts = []
    for b in existing:
        d = b.get("data", b) if isinstance(b.get("data"), dict) else b
        if d.get("id") == booking_dict.get("id"):
            continue
        if d.get("time") == time and d.get("assignedDriver") and d.get("assignedDriver") == booking_dict.get("assignedDriver"):
            conflicts.append(d)

    if conflicts:
        ref = booking_dict.get("referenceNumber", "?")
        conflict_refs = ", ".join(f"#{c.get('referenceNumber', '?')}" for c in conflicts)
        logger.warning(f"CONFLICT: Booking #{ref} conflicts with {conflict_refs}")
        await send_email(
            to=ADMIN_EMAIL,
            subject=f"Driver Conflict Alert - Booking #{ref}",
            html=f"<p>Booking <strong>#{ref}</strong> at {time} on {date} conflicts with: {conflict_refs}. Same driver assigned at the same time.</p>",
        )


@router.post("/bookings")
async def create_booking(booking: BookingCreate, background_tasks: BackgroundTasks):
    from app.main import db

    booking_obj = Booking(**booking.dict())
    booking_dict = booking_obj.dict()

    if booking.returnDepartureFlightNumber:
        booking_dict["returnDepartureFlightNumber"] = booking.returnDepartureFlightNumber
        booking_dict["returnFlightNumber"] = booking.returnDepartureFlightNumber

    ref_number = await get_next_reference_number()
    booking_dict["referenceNumber"] = str(ref_number)

    booking_dict["totalPrice"] = booking.pricing.get("totalPrice", 0)
    booking_dict["payment_status"] = "unpaid"

    result = await db.bookings.insert_one(booking_dict)
    if not result.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to save booking")

    # Verify booking was saved
    saved = await db.bookings.find_one({"id": booking_dict["id"]})
    if not saved:
        logger.error(f"CRITICAL: Booking {booking_dict['id']} insert acknowledged but not found")

    logger.info(f"Booking created: {booking_obj.id} ref #{ref_number}")

    # Only send confirmation emails for non-card payments (card payments
    # get emails from the Stripe webhook to avoid duplicates)
    payment_method = booking_dict.get("paymentMethod", "card")
    if payment_method in ("cash", "bank-transfer", "pay-on-pickup"):
        background_tasks.add_task(_send_booking_notifications, booking_dict)

    # Always check for driver conflicts
    background_tasks.add_task(_check_booking_conflicts, booking_dict)

    return booking_dict


@router.get("/bookings")
async def list_bookings(
    status: str = None,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    query = {}
    if status:
        query["status"] = status

    bookings = await db.bookings.find(query, {"_id": 0}).to_list(10000)
    total = await db.bookings.count_documents(query)
    return {"bookings": bookings, "total": total}


@router.get("/bookings/count")
async def booking_counts(current_admin: dict = Depends(get_current_admin)):
    from app.main import db

    total = await db.bookings.count_documents({})
    pending = await db.bookings.count_documents({"status": "pending"})
    confirmed = await db.bookings.count_documents({"status": "confirmed"})
    completed = await db.bookings.count_documents({"status": "completed"})
    cancelled = await db.bookings.count_documents({"status": "cancelled"})
    return {
        "total": total,
        "pending": pending,
        "confirmed": confirmed,
        "completed": completed,
        "cancelled": cancelled,
    }


@router.patch("/bookings/{booking_id}")
async def update_booking(
    booking_id: str,
    updates: dict,
    current_admin: dict = Depends(get_current_admin),
):
    from app.main import db

    result = await db.bookings.update_one({"id": booking_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"message": "Booking updated", "modified_count": result.modified_count}


@router.delete("/bookings/{booking_id}")
async def delete_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Soft-delete: move to deleted_bookings with verified backup."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking["deletedAt"] = datetime.now(timezone.utc).isoformat()

    # Step 1: Insert into deleted_bookings
    result = await db.deleted_bookings.insert_one(booking)
    if not result.acknowledged:
        logger.error(f"CRITICAL: Failed to backup booking {booking_id} before delete")
        raise HTTPException(status_code=500, detail="Could not back up booking before deleting")

    # Step 2: Verify the backup exists
    backup = await db.deleted_bookings.find_one({"id": booking_id})
    if not backup:
        logger.error(f"CRITICAL: Backup insert acknowledged but not found for {booking_id}")
        raise HTTPException(status_code=500, detail="Backup verification failed")

    # Step 3: Only now delete from active bookings
    await db.bookings.delete_one({"id": booking_id})
    logger.info(f"Booking {booking_id} soft-deleted (verified backup)")
    return {"message": "Booking deleted"}


@router.post("/bookings/{booking_id}/restore")
async def restore_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Restore a soft-deleted booking with verified backup."""
    from app.main import db

    booking = await db.deleted_bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Deleted booking not found")

    booking.pop("deletedAt", None)

    result = await db.bookings.insert_one(booking)
    if not result.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to restore booking")

    restored = await db.bookings.find_one({"id": booking_id})
    if not restored:
        raise HTTPException(status_code=500, detail="Restore verification failed")

    await db.deleted_bookings.delete_one({"id": booking_id})
    logger.info(f"Booking {booking_id} restored from deleted")
    return {"message": "Booking restored"}


@router.post("/bookings/{booking_id}/archive")
async def archive_booking(
    booking_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    """Archive a completed booking with verified backup."""
    from app.main import db

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking["archivedAt"] = datetime.now(timezone.utc).isoformat()

    result = await db.bookings_archive.insert_one(booking)
    if not result.acknowledged:
        raise HTTPException(status_code=500, detail="Failed to archive booking")

    archived = await db.bookings_archive.find_one({"id": booking_id})
    if not archived:
        raise HTTPException(status_code=500, detail="Archive verification failed")

    await db.bookings.delete_one({"id": booking_id})
    logger.info(f"Booking {booking_id} archived (verified)")
    return {"message": "Booking archived"}
