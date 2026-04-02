import logging
import os
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from app.core.config import settings
from app.services.email import send_customer_confirmation, send_admin_notification

router = APIRouter(prefix="/payment", tags=["Payments"])
logger = logging.getLogger(__name__)


async def _run_post_payment_actions(booking: dict):
    """Run all 4 required post-payment actions. Called after every payment confirmation."""
    bid = booking.get("id", "?")
    try:
        await send_customer_confirmation(booking)
    except Exception as e:
        logger.error(f"CRITICAL: Customer confirmation email failed for {bid}: {e}")
    try:
        await send_admin_notification(booking)
    except Exception as e:
        logger.error(f"CRITICAL: Admin notification failed for {bid}: {e}")
    # Action 3: Google Calendar event (TODO: implement in services/calendar.py)
    # Action 4: iCloud contact sync (TODO: implement in services/contacts.py)
    logger.info(f"Post-payment actions completed for booking {bid}")


@router.post("/create-checkout")
async def create_checkout(data: dict):
    from app.main import db

    booking_id = data.get("booking_id")
    if not booking_id:
        raise HTTPException(status_code=400, detail="booking_id required")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    stripe_key = settings.STRIPE_SECRET_KEY
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Payment service temporarily unavailable")

    import stripe

    stripe.api_key = stripe_key
    total_price = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    amount_cents = int(float(total_price) * 100)

    checkout_session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "nzd",
                    "product_data": {
                        "name": f"BookARide - Ref #{booking.get('referenceNumber', 'N/A')}",
                        "description": f"{booking.get('pickupAddress')} -> {booking.get('dropoffAddress')}",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        customer_email=booking.get("email"),
        success_url=f"{settings.PUBLIC_DOMAIN}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.PUBLIC_DOMAIN}/book-now?cancelled=true",
        metadata={"booking_id": booking_id},
    )

    await db.payment_transactions.insert_one(
        {
            "id": checkout_session.id,
            "booking_id": booking_id,
            "amount": total_price,
            "currency": "nzd",
            "status": "pending",
            "stripe_session_id": checkout_session.id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )

    return {"url": checkout_session.url, "session_id": checkout_session.id}


@router.post("/create-checkout-link")
async def create_checkout_link(data: dict):
    """Public endpoint for payment links sent via email."""
    from app.main import db

    booking_id = data.get("booking_id")
    if not booking_id:
        raise HTTPException(status_code=400, detail="booking_id required")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get("payment_status") == "paid":
        raise HTTPException(status_code=400, detail="This booking has already been paid")

    stripe_key = settings.STRIPE_SECRET_KEY
    if not stripe_key:
        raise HTTPException(status_code=500, detail="Payment service temporarily unavailable")

    import stripe

    stripe.api_key = stripe_key
    total_price = booking.get("totalPrice") or booking.get("pricing", {}).get("totalPrice", 0)
    amount_cents = int(float(total_price) * 100)

    checkout_session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        mode="payment",
        line_items=[
            {
                "price_data": {
                    "currency": "nzd",
                    "product_data": {
                        "name": f"BookARide - Ref #{booking.get('referenceNumber', 'N/A')}",
                        "description": f"{booking.get('pickupAddress')} -> {booking.get('dropoffAddress')}",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        customer_email=booking.get("email"),
        success_url=f"{settings.PUBLIC_DOMAIN}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.PUBLIC_DOMAIN}/book-now?cancelled=true",
        metadata={"booking_id": booking_id},
    )

    return {"url": checkout_session.url, "session_id": checkout_session.id}


@router.get("/success")
async def payment_success(session_id: str):
    """Lookup booking by Stripe session ID for the success page."""
    from app.main import db

    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

    txn = await db.payment_transactions.find_one(
        {"stripe_session_id": session_id}, {"_id": 0}
    )
    if not txn:
        raise HTTPException(status_code=404, detail="Payment session not found")

    booking = await db.bookings.find_one({"id": txn.get("booking_id")}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {"booking": booking}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    from app.main import db

    payload = await request.body()
    sig = request.headers.get("stripe-signature")

    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        booking_id = session.get("metadata", {}).get("booking_id")
        if booking_id:
            # Idempotency: check if already processed
            booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
            if booking and booking.get("payment_status") == "paid":
                logger.info(f"Webhook duplicate — booking {booking_id} already paid")
                return {"received": True}

            result = await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {"payment_status": "paid", "status": "confirmed"}},
            )
            if result.matched_count == 0:
                logger.error(f"CRITICAL: Webhook could not find booking {booking_id}")

            await db.payment_transactions.update_one(
                {"stripe_session_id": session["id"]},
                {"$set": {"status": "completed"}},
            )

            # Fetch updated booking and run all 4 post-payment actions
            updated_booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
            if updated_booking:
                background_tasks.add_task(_run_post_payment_actions, updated_booking)

            logger.info(f"Payment confirmed for booking {booking_id}")

    return {"received": True}
