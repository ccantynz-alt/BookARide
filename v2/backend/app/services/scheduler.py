"""
BookARide V2 — Scheduled Tasks Service.

All scheduled jobs using APScheduler with NZ timezone awareness.
Every job has duplicate-prevention and cancellation-awareness.

CRITICAL RULE: No scheduled task may EVER delete or move bookings out of
the active bookings table. Only the admin (via explicit manual action) can
delete or archive a booking. The auto_complete job changes STATUS ONLY —
the booking stays in db.bookings forever until an admin manually archives
or deletes it. This prevents the V1 bug where bookings silently vanished
the day after completion.
"""
import logging
from datetime import datetime, timedelta, timezone

import pytz
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.services.email import (
    send_admin_notification,
    send_daily_summary,
    send_day_before_reminder,
    send_payment_reminder,
    send_post_trip_email,
    send_weekly_report,
)

logger = logging.getLogger(__name__)
NZ_TZ = pytz.timezone("Pacific/Auckland")

scheduler = AsyncIOScheduler(timezone=NZ_TZ)

# Global lock flags to prevent duplicate runs
_reminder_lock = False


def get_db():
    """Lazy import to avoid circular dependency."""
    from app.main import db
    return db


# ── Auto-Complete Past Bookings ─────────────────────────────────
# Daily at 10 PM NZ — marks past confirmed+paid bookings as completed


async def auto_complete_past_bookings():
    """Mark past confirmed bookings as completed, trigger post-trip email.

    CRITICAL: This function ONLY changes the status field. It NEVER deletes,
    moves, or archives bookings. Bookings stay in the active table forever
    until an admin explicitly archives or deletes them. This prevents the V1
    bug where completed bookings vanished from the admin panel overnight.
    """
    db = get_db()
    if not db:
        return

    nz_now = datetime.now(NZ_TZ)
    today = nz_now.strftime("%Y-%m-%d")

    try:
        bookings = await db.bookings.find(
            {
                "status": "confirmed",
                "payment_status": {"$in": ["paid", "pay-on-pickup", "cash", "bank-transfer"]},
            },
            {"_id": 0},
        ).to_list(10000)

        completed_count = 0
        for b in bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b

            # Skip cancelled or cancellation-requested
            if data.get("cancellation_requested"):
                continue

            booking_date = data.get("date", "")
            if not booking_date or booking_date >= today:
                continue

            booking_id = data.get("id")
            if not booking_id:
                continue

            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {"status": "completed"}},
            )
            completed_count += 1

            # Send post-trip thank-you if not already sent
            if not data.get("postTripEmailSent"):
                try:
                    sent = await send_post_trip_email(b)
                    if sent:
                        await db.bookings.update_one(
                            {"id": booking_id},
                            {"$set": {
                                "postTripEmailSent": True,
                                "postTripEmailSentAt": datetime.now(timezone.utc).isoformat(),
                            }},
                        )
                except Exception as e:
                    logger.error(f"CRITICAL: Post-trip email failed for {booking_id}: {e}")

        if completed_count > 0:
            logger.info(f"Auto-completed {completed_count} past bookings")
    except Exception as e:
        logger.error(f"CRITICAL: auto_complete_past_bookings failed: {e}")


# ── Day-Before Reminders ────────────────────────────────────────
# Daily at 8 AM NZ — reminds customers about tomorrow's trip


async def send_reminders():
    """Send day-before reminders for tomorrow's bookings."""
    global _reminder_lock
    if _reminder_lock:
        return
    _reminder_lock = True

    db = get_db()
    if not db:
        _reminder_lock = False
        return

    try:
        nz_now = datetime.now(NZ_TZ)
        tomorrow = (nz_now + timedelta(days=1)).strftime("%Y-%m-%d")

        bookings = await db.bookings.find(
            {"status": {"$in": ["confirmed", "pending"]}},
            {"_id": 0},
        ).to_list(10000)

        sent_count = 0
        for b in bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b

            if data.get("status") == "cancelled" or data.get("cancellation_requested"):
                continue

            if data.get("date") != tomorrow:
                continue

            if data.get("reminderEmailSent"):
                continue

            booking_id = data.get("id")
            if not booking_id:
                continue

            try:
                sent = await send_day_before_reminder(b)
                if sent:
                    await db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": {
                            "reminderEmailSent": True,
                            "reminderEmailSentAt": datetime.now(timezone.utc).isoformat(),
                        }},
                    )
                    sent_count += 1
            except Exception as e:
                logger.error(f"CRITICAL: Reminder failed for {booking_id}: {e}")

        if sent_count > 0:
            logger.info(f"Sent {sent_count} day-before reminders")
    except Exception as e:
        logger.error(f"CRITICAL: send_reminders failed: {e}")
    finally:
        _reminder_lock = False


# ── Payment Follow-Up ───────────────────────────────────────────
# Every 2 hours — reminds unpaid bookings between 4-48 hours old


async def payment_follow_up():
    """Send payment reminders for unpaid bookings."""
    db = get_db()
    if not db:
        return

    try:
        now = datetime.now(timezone.utc)
        cutoff_recent = (now - timedelta(hours=4)).isoformat()
        cutoff_old = (now - timedelta(hours=48)).isoformat()

        bookings = await db.bookings.find(
            {
                "payment_status": "unpaid",
                "status": {"$nin": ["cancelled"]},
            },
            {"_id": 0},
        ).to_list(10000)

        sent_count = 0
        for b in bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b

            if data.get("cancellation_requested"):
                continue

            if data.get("paymentReminderSent"):
                continue

            created = data.get("createdAt", "")
            if not created or created > cutoff_recent or created < cutoff_old:
                continue

            payment_method = data.get("paymentMethod", "card")
            if payment_method in ("cash", "bank-transfer", "pay-on-pickup"):
                continue

            booking_id = data.get("id")
            if not booking_id:
                continue

            try:
                sent = await send_payment_reminder(b)
                if sent:
                    await db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": {
                            "paymentReminderSent": True,
                            "paymentReminderSentAt": datetime.now(timezone.utc).isoformat(),
                        }},
                    )
                    sent_count += 1
            except Exception as e:
                logger.error(f"CRITICAL: Payment reminder failed for {booking_id}: {e}")

        if sent_count > 0:
            logger.info(f"Sent {sent_count} payment reminders")
    except Exception as e:
        logger.error(f"CRITICAL: payment_follow_up failed: {e}")


# ── Daily Business Summary ──────────────────────────────────────
# Daily at 6 PM NZ


async def daily_business_summary():
    """Send daily summary email to admin."""
    db = get_db()
    if not db:
        return

    try:
        nz_now = datetime.now(NZ_TZ)
        today = nz_now.strftime("%Y-%m-%d")
        tomorrow = (nz_now + timedelta(days=1)).strftime("%Y-%m-%d")

        all_bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)

        today_bookings = []
        tomorrow_bookings = []
        today_revenue = 0
        pending = 0
        confirmed = 0

        for b in all_bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b
            bdate = data.get("date", "")
            status = data.get("status", "")

            if bdate == today:
                today_bookings.append(b)
                price = float(data.get("totalPrice", 0) or 0)
                if data.get("payment_status") == "paid":
                    today_revenue += price

            if bdate == tomorrow:
                tomorrow_bookings.append(b)

            if status == "pending":
                pending += 1
            elif status == "confirmed":
                confirmed += 1

        stats = {
            "today_count": len(today_bookings),
            "today_revenue": today_revenue,
            "pending": pending,
            "confirmed": confirmed,
        }

        await send_daily_summary(stats, tomorrow_bookings)
    except Exception as e:
        logger.error(f"CRITICAL: daily_business_summary failed: {e}")


# ── Weekly Performance Report ───────────────────────────────────
# Sunday 8 AM NZ


async def weekly_performance_report():
    """Send weekly performance report to admin."""
    db = get_db()
    if not db:
        return

    try:
        nz_now = datetime.now(NZ_TZ)
        week_ago = (nz_now - timedelta(days=7)).strftime("%Y-%m-%d")

        all_bookings = await db.bookings.find({}, {"_id": 0}).to_list(10000)

        total = 0
        revenue = 0
        completed = 0
        route_counts = {}

        for b in all_bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b
            bdate = data.get("date", "")
            if not bdate or bdate < week_ago:
                continue

            total += 1
            if data.get("status") == "completed":
                completed += 1
            if data.get("payment_status") == "paid":
                revenue += float(data.get("totalPrice", 0) or 0)

            pickup = (data.get("pickupAddress") or "")[:30]
            dropoff = (data.get("dropoffAddress") or "")[:30]
            if pickup and dropoff:
                route = f"{pickup} -> {dropoff}"
                route_counts[route] = route_counts.get(route, 0) + 1

        top_routes = sorted(route_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        top_routes = [{"route": r, "count": c} for r, c in top_routes]

        completion_rate = (completed / total * 100) if total > 0 else 0

        stats = {
            "total_bookings": total,
            "total_revenue": revenue,
            "completion_rate": completion_rate,
            "top_routes": top_routes,
        }

        await send_weekly_report(stats)
    except Exception as e:
        logger.error(f"CRITICAL: weekly_performance_report failed: {e}")


# ── Post-Trip Email Catch-Up ────────────────────────────────────
# Daily at 10:30 PM NZ — catches completed bookings that missed post-trip email


async def post_trip_email_catchup():
    """Send post-trip emails for completed bookings that were missed."""
    db = get_db()
    if not db:
        return

    try:
        bookings = await db.bookings.find(
            {"status": "completed"},
            {"_id": 0},
        ).to_list(10000)

        sent_count = 0
        for b in bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b

            if data.get("postTripEmailSent"):
                continue
            if data.get("cancellation_requested"):
                continue

            booking_id = data.get("id")
            if not booking_id:
                continue

            try:
                sent = await send_post_trip_email(b)
                if sent:
                    await db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": {
                            "postTripEmailSent": True,
                            "postTripEmailSentAt": datetime.now(timezone.utc).isoformat(),
                        }},
                    )
                    sent_count += 1
            except Exception as e:
                logger.error(f"Post-trip catchup failed for {booking_id}: {e}")

        if sent_count > 0:
            logger.info(f"Post-trip catchup: sent {sent_count} emails")
    except Exception as e:
        logger.error(f"CRITICAL: post_trip_email_catchup failed: {e}")


# ── Scheduler Setup ─────────────────────────────────────────────


def setup_scheduler():
    """Register all scheduled jobs. Call once on startup."""
    # Daily at 8 AM NZ — day-before reminders
    scheduler.add_job(
        send_reminders,
        "cron",
        hour=8,
        minute=0,
        id="send_reminders",
        misfire_grace_time=14400,
        replace_existing=True,
    )

    # Daily at 10 PM NZ — auto-complete past bookings
    scheduler.add_job(
        auto_complete_past_bookings,
        "cron",
        hour=22,
        minute=0,
        id="auto_complete",
        misfire_grace_time=14400,
        replace_existing=True,
    )

    # Daily at 10:30 PM NZ — post-trip email catch-up
    scheduler.add_job(
        post_trip_email_catchup,
        "cron",
        hour=22,
        minute=30,
        id="post_trip_catchup",
        misfire_grace_time=14400,
        replace_existing=True,
    )

    # Every 2 hours — payment follow-up
    scheduler.add_job(
        payment_follow_up,
        "interval",
        hours=2,
        id="payment_follow_up",
        misfire_grace_time=7200,
        replace_existing=True,
    )

    # Daily at 6 PM NZ — business summary
    scheduler.add_job(
        daily_business_summary,
        "cron",
        hour=18,
        minute=0,
        id="daily_summary",
        misfire_grace_time=14400,
        replace_existing=True,
    )

    # Sunday 8 AM NZ — weekly report
    scheduler.add_job(
        weekly_performance_report,
        "cron",
        day_of_week="sun",
        hour=8,
        minute=0,
        id="weekly_report",
        misfire_grace_time=14400,
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Scheduler started with 6 jobs registered")


async def run_startup_checks():
    """On startup, send any missed reminders if within operating hours."""
    nz_now = datetime.now(NZ_TZ)
    if 8 <= nz_now.hour <= 23:
        logger.info("Startup: checking for missed reminders")
        await send_reminders()
