"""
BookARide V2 — Email Service (Mailgun only).

All emails go through Mailgun HTTP API. No SMTP, no SendGrid, no fallbacks.
"""
import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

NOREPLY = "noreply@bookaride.co.nz"
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "info@bookaride.co.nz")


def _sender() -> str:
    return os.environ.get("NOREPLY_EMAIL") or NOREPLY


def _api_key() -> str:
    return os.environ.get("MAILGUN_API_KEY", "")


def _domain() -> str:
    return os.environ.get("MAILGUN_DOMAIN", "bookaride.co.nz")


def is_configured() -> bool:
    return bool(_api_key() and _domain())


async def send_email(
    to: str,
    subject: str,
    html: str,
    from_name: str = "BookARide NZ",
    reply_to: Optional[str] = None,
    cc: Optional[str] = None,
) -> bool:
    """Send an email via Mailgun. Returns True on success."""
    if not to or not subject or not html:
        logger.warning("send_email: missing required args")
        return False

    api_key = _api_key()
    domain = _domain()
    if not api_key or not domain:
        logger.error("CRITICAL: Mailgun not configured (MAILGUN_API_KEY / MAILGUN_DOMAIN)")
        return False

    from_addr = f"{from_name} <{_sender()}>"
    data = {"from": from_addr, "to": [to], "subject": subject, "html": html}
    if cc:
        data["cc"] = [cc] if isinstance(cc, str) else cc
    if reply_to:
        data["h:Reply-To"] = reply_to

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"https://api.mailgun.net/v3/{domain}/messages",
                auth=("api", api_key),
                data=data,
                timeout=15.0,
            )
        if resp.status_code in (200, 202):
            logger.info(f"Email sent to {to}: {subject}")
            return True
        logger.warning(f"Mailgun {resp.status_code}: {resp.text[:300]}")
        return False
    except Exception as e:
        logger.error(f"CRITICAL: Mailgun exception: {e}")
        return False


# ── HTML Templates ──────────────────────────────────────────────


def _base_html(title: str, body: str) -> str:
    """Wrap body content in the BookARide email template."""
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>{title}</title></head>
<body style="margin:0;padding:0;background:#f7f5f0;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:#D4AF37;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
    <h1 style="margin:0;font-size:24px;">BookARide NZ</h1>
  </div>
  <div style="background:white;padding:28px;border:1px solid #e8e4d9;border-top:none;border-radius:0 0 12px 12px;">
    {body}
  </div>
  <p style="text-align:center;color:#999;font-size:12px;margin-top:16px;">
    BookARide NZ &mdash; Premium Airport Transfers<br>
    <a href="https://bookaride.co.nz" style="color:#D4AF37;">bookaride.co.nz</a>
  </p>
</div>
</body>
</html>"""


def _booking_details_html(b: dict) -> str:
    """Generate the booking details section for emails."""
    data = b.get("data", b) if isinstance(b.get("data"), dict) else b
    name = data.get("name") or "Customer"
    ref = data.get("referenceNumber") or data.get("id", "N/A")
    pickup = data.get("pickupAddress", "")
    dropoff = data.get("dropoffAddress", "")
    date = data.get("date", "")
    time = data.get("time", "")
    passengers = data.get("passengers", 1)
    total = data.get("totalPrice") or data.get("pricing", {}).get("totalPrice", "")
    flight = data.get("flightNumber") or data.get("departureFlightNumber") or data.get("arrivalFlightNumber") or ""

    rows = f"""
    <tr><td style="padding:8px 12px;color:#666;width:130px;">Reference</td>
        <td style="padding:8px 12px;font-weight:bold;">#{ref}</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Pickup</td>
        <td style="padding:8px 12px;">{pickup}</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Drop-off</td>
        <td style="padding:8px 12px;">{dropoff}</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Date</td>
        <td style="padding:8px 12px;">{date}</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Time</td>
        <td style="padding:8px 12px;">{time}</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Passengers</td>
        <td style="padding:8px 12px;">{passengers}</td></tr>"""

    if flight:
        rows += f"""
    <tr><td style="padding:8px 12px;color:#666;">Flight</td>
        <td style="padding:8px 12px;">{flight}</td></tr>"""

    if total:
        rows += f"""
    <tr><td style="padding:8px 12px;color:#666;">Total</td>
        <td style="padding:8px 12px;font-weight:bold;color:#D4AF37;">${float(total):.2f} NZD</td></tr>"""

    return_info = ""
    if data.get("bookReturn"):
        rd = data.get("returnDate", "")
        rt = data.get("returnTime", "")
        return_info = f"""
    <tr><td colspan="2" style="padding:12px 12px 4px;font-weight:bold;color:#333;">Return Trip</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Return Date</td>
        <td style="padding:8px 12px;">{rd}</td></tr>
    <tr><td style="padding:8px 12px;color:#666;">Return Time</td>
        <td style="padding:8px 12px;">{rt}</td></tr>"""

    return f"""<table style="width:100%;border-collapse:collapse;font-size:14px;">
    {rows}{return_info}
    </table>"""


# ── Specific Email Functions ────────────────────────────────────


async def send_customer_confirmation(booking: dict) -> bool:
    """Send booking confirmation email to the customer."""
    data = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking
    email = data.get("email")
    if not email:
        logger.warning("No email for customer confirmation")
        return False

    name = data.get("name") or "Customer"
    ref = data.get("referenceNumber") or data.get("id", "N/A")
    payment_status = data.get("payment_status", "unpaid")

    paid_badge = ""
    if payment_status == "paid":
        paid_badge = '<span style="display:inline-block;background:#22c55e;color:white;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold;margin-left:8px;">PAID</span>'

    payment_section = ""
    if payment_status != "paid":
        public_domain = os.environ.get("PUBLIC_DOMAIN", "https://bookaride.co.nz")
        booking_id = data.get("id", "")
        payment_section = f"""
        <div style="margin-top:20px;padding:16px;background:#fef9ee;border:1px solid #f0e4c3;border-radius:8px;">
          <p style="margin:0 0 8px;font-weight:bold;color:#92690e;">Payment Required</p>
          <p style="margin:0 0 12px;font-size:14px;color:#666;">Complete your payment to confirm the booking.</p>
          <a href="{public_domain}/pay/{booking_id}"
             style="display:inline-block;background:#D4AF37;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Pay Now
          </a>
        </div>"""

    body = f"""
    <h2 style="margin:0 0 4px;color:#333;">Booking Confirmed! {paid_badge}</h2>
    <p style="color:#666;margin:0 0 20px;">Hi {name}, thank you for choosing BookARide.</p>
    {_booking_details_html(booking)}
    {payment_section}
    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
      <p style="margin:0;font-size:14px;color:#166534;">
        Your driver will contact you before the pickup. If you have any questions,
        reply to this email or contact us at info@bookaride.co.nz
      </p>
    </div>"""

    html = _base_html(f"Booking #{ref} Confirmed", body)
    return await send_email(email, f"Booking Confirmed - #{ref}", html)


async def send_admin_notification(booking: dict) -> bool:
    """Notify admin of a new booking."""
    data = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking
    name = data.get("name") or "Customer"
    ref = data.get("referenceNumber") or data.get("id", "N/A")
    payment_status = data.get("payment_status", "unpaid")
    email = data.get("email", "")
    phone = data.get("phone", "")

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">New Booking Received</h2>
    <p><strong>Customer:</strong> {name} ({email}, {phone})</p>
    <p><strong>Payment:</strong> {payment_status}</p>
    {_booking_details_html(booking)}
    <div style="margin-top:20px;">
      <a href="{os.environ.get('PUBLIC_DOMAIN', 'https://bookaride.co.nz')}/admin"
         style="display:inline-block;background:#D4AF37;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
        View in Dashboard
      </a>
    </div>"""

    html = _base_html(f"New Booking #{ref}", body)
    return await send_email(ADMIN_EMAIL, f"New Booking #{ref} - {name}", html)


async def send_post_trip_email(booking: dict) -> bool:
    """Send thank-you email with Google Review link after trip completion."""
    data = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking

    # Safety: never email cancelled or cancellation-requested bookings
    if data.get("status") == "cancelled" or data.get("cancellation_requested"):
        return False

    email = data.get("email")
    if not email:
        return False

    name = data.get("name") or "Customer"

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">Thank You for Riding with Us!</h2>
    <p>Hi {name},</p>
    <p>We hope you had a great trip! Your comfort and satisfaction are our top priorities.</p>
    <p>We'd love to hear about your experience. A quick review helps other travelers
       find reliable airport transfers in New Zealand.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="https://g.page/r/bookaride/review"
         style="display:inline-block;background:#D4AF37;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
        Leave a Review
      </a>
    </div>
    <p style="color:#666;font-size:14px;">Thank you for choosing BookARide NZ. We look forward to your next trip!</p>"""

    html = _base_html("Thank You - BookARide", body)
    return await send_email(email, "Thank you for riding with BookARide!", html)


async def send_payment_reminder(booking: dict) -> bool:
    """Send payment reminder for unpaid bookings."""
    data = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking

    if data.get("status") == "cancelled" or data.get("cancellation_requested"):
        return False

    email = data.get("email")
    if not email:
        return False

    name = data.get("name") or "Customer"
    ref = data.get("referenceNumber") or data.get("id", "N/A")
    booking_id = data.get("id", "")
    public_domain = os.environ.get("PUBLIC_DOMAIN", "https://bookaride.co.nz")

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">Payment Reminder</h2>
    <p>Hi {name},</p>
    <p>We noticed your booking <strong>#{ref}</strong> hasn't been paid yet.
       Please complete your payment to confirm your transfer.</p>
    {_booking_details_html(booking)}
    <div style="text-align:center;margin:24px 0;">
      <a href="{public_domain}/pay/{booking_id}"
         style="display:inline-block;background:#D4AF37;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
        Complete Payment
      </a>
    </div>
    <p style="color:#666;font-size:14px;">If you've already paid, please disregard this email.
       Questions? Reply to this email or contact info@bookaride.co.nz</p>"""

    html = _base_html(f"Payment Reminder - Booking #{ref}", body)
    return await send_email(email, f"Payment Reminder - Booking #{ref}", html)


async def send_day_before_reminder(booking: dict) -> bool:
    """Send day-before trip reminder to customer."""
    data = booking.get("data", booking) if isinstance(booking.get("data"), dict) else booking

    if data.get("status") == "cancelled" or data.get("cancellation_requested"):
        return False

    email = data.get("email")
    if not email:
        return False

    name = data.get("name") or "Customer"
    ref = data.get("referenceNumber") or data.get("id", "N/A")
    pickup = data.get("pickupAddress", "")
    time = data.get("time", "")

    is_airport = "airport" in (data.get("dropoffAddress", "") + data.get("pickupAddress", "")).lower()
    meeting_point = ""
    if is_airport and "airport" in data.get("pickupAddress", "").lower():
        meeting_point = """
        <div style="margin:16px 0;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
          <p style="margin:0 0 8px;font-weight:bold;color:#1e40af;">Airport Pickup Information</p>
          <p style="margin:0;font-size:14px;color:#333;">
            Your driver will meet you at the <strong>Arrivals Hall</strong> holding a sign with your name.
            Look for them after you collect your luggage and clear customs.
          </p>
        </div>"""
    else:
        meeting_point = """
        <div style="margin:16px 0;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
          <p style="margin:0;font-size:14px;color:#333;">
            Please be ready at the pickup address <strong>5 minutes before</strong> your scheduled time.
            Your driver will contact you when they're on their way.
          </p>
        </div>"""

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">Your Trip is Tomorrow!</h2>
    <p>Hi {name}, just a friendly reminder that your transfer is tomorrow.</p>
    {_booking_details_html(booking)}
    {meeting_point}
    <p style="color:#666;font-size:14px;">
      Need to make changes? Contact us at info@bookaride.co.nz or reply to this email.
    </p>"""

    html = _base_html(f"Trip Reminder - #{ref}", body)
    return await send_email(email, f"Reminder: Your trip is tomorrow at {time}", html)


async def send_daily_summary(stats: dict, upcoming: list) -> bool:
    """Send daily business summary to admin."""
    today_count = stats.get("today_count", 0)
    today_revenue = stats.get("today_revenue", 0)
    pending = stats.get("pending", 0)
    confirmed = stats.get("confirmed", 0)

    upcoming_html = ""
    if upcoming:
        rows = ""
        for b in upcoming[:20]:
            d = b.get("data", b) if isinstance(b.get("data"), dict) else b
            name = d.get("name") or "Customer"
            time = d.get("time", "")
            pickup = d.get("pickupAddress", "")[:40]
            dropoff = d.get("dropoffAddress", "")[:40]
            rows += f"<tr><td style='padding:6px 8px;'>{time}</td><td style='padding:6px 8px;'>{name}</td><td style='padding:6px 8px;'>{pickup} &rarr; {dropoff}</td></tr>"
        upcoming_html = f"""
        <h3 style="margin:24px 0 8px;">Tomorrow's Bookings</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Time</th><th style="padding:8px;text-align:left;">Customer</th><th style="padding:8px;text-align:left;">Route</th></tr>
          {rows}
        </table>"""
    else:
        upcoming_html = "<p style='color:#666;'>No bookings for tomorrow.</p>"

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">Daily Business Summary</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
      <div style="flex:1;min-width:120px;background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#16a34a;">{today_count}</div>
        <div style="font-size:12px;color:#666;">Today's Bookings</div>
      </div>
      <div style="flex:1;min-width:120px;background:#fef9ee;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#D4AF37;">${today_revenue:.2f}</div>
        <div style="font-size:12px;color:#666;">Revenue</div>
      </div>
      <div style="flex:1;min-width:120px;background:#eff6ff;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#2563eb;">{pending}</div>
        <div style="font-size:12px;color:#666;">Pending</div>
      </div>
      <div style="flex:1;min-width:120px;background:#f5f3ff;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#7c3aed;">{confirmed}</div>
        <div style="font-size:12px;color:#666;">Confirmed</div>
      </div>
    </div>
    {upcoming_html}"""

    html = _base_html("Daily Summary", body)
    return await send_email(ADMIN_EMAIL, f"BookARide Daily Summary - {today_count} bookings today", html)


async def send_weekly_report(stats: dict) -> bool:
    """Send weekly performance report to admin."""
    total = stats.get("total_bookings", 0)
    revenue = stats.get("total_revenue", 0)
    completion_rate = stats.get("completion_rate", 0)
    top_routes = stats.get("top_routes", [])

    routes_html = ""
    if top_routes:
        rows = ""
        for r in top_routes[:10]:
            rows += f"<tr><td style='padding:6px 8px;'>{r.get('route', '')}</td><td style='padding:6px 8px;'>{r.get('count', 0)}</td></tr>"
        routes_html = f"""
        <h3 style="margin:24px 0 8px;">Popular Routes</h3>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Route</th><th style="padding:8px;text-align:left;">Bookings</th></tr>
          {rows}
        </table>"""

    body = f"""
    <h2 style="margin:0 0 16px;color:#333;">Weekly Performance Report</h2>
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:20px;">
      <div style="flex:1;min-width:140px;background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#16a34a;">{total}</div>
        <div style="font-size:12px;color:#666;">Total Bookings</div>
      </div>
      <div style="flex:1;min-width:140px;background:#fef9ee;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#D4AF37;">${revenue:.2f}</div>
        <div style="font-size:12px;color:#666;">Revenue</div>
      </div>
      <div style="flex:1;min-width:140px;background:#eff6ff;padding:16px;border-radius:8px;text-align:center;">
        <div style="font-size:28px;font-weight:bold;color:#2563eb;">{completion_rate:.0f}%</div>
        <div style="font-size:12px;color:#666;">Completion Rate</div>
      </div>
    </div>
    {routes_html}"""

    html = _base_html("Weekly Report", body)
    return await send_email(ADMIN_EMAIL, f"BookARide Weekly Report - {total} bookings, ${revenue:.2f} revenue", html)
