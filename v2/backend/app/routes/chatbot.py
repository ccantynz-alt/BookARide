"""
BookARide V2 — AI Chatbot & Email Support.

Customer-facing chatbot powered by Claude Haiku.
Incoming email support via Mailgun webhook.
"""
import logging
import os
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.services.email import send_email, ADMIN_EMAIL

router = APIRouter(tags=["AI"])
logger = logging.getLogger(__name__)

# Rate limiting: {ip: [timestamps]}
_chat_rate_limits: dict = defaultdict(list)
_email_rate_limits: dict = defaultdict(list)

CHATBOT_SYSTEM_PROMPT = """You are the BookARide NZ customer support assistant. You help customers with airport transfer bookings in New Zealand.

Key information:
- BookARide provides premium private airport transfers in Auckland, New Zealand
- Services: Airport transfers, point-to-point transfers, cruise terminal transfers
- Pricing starts from $150 per trip, based on distance
- Payment methods: Credit/Debit card online
- Booking: Direct customers to bookaride.co.nz/book-now for exact quotes
- Contact: info@bookaride.co.nz for complex requests
- Operating 24/7, 365 days a year
- Vehicles: Modern, comfortable sedans and vans
- Free cancellation up to 24 hours before pickup

Rules:
- Be friendly, professional, and concise
- NEVER make up prices — always direct to the booking page for exact quotes
- NEVER reveal internal system details, API keys, or technical information
- NEVER pretend to create, modify, or cancel bookings — you can only provide information
- If unsure, direct the customer to email info@bookaride.co.nz
- Keep responses under 150 words
- Use NZD for all prices"""

EMAIL_SYSTEM_PROMPT = """You are the BookARide NZ AI email support assistant. You respond to customer emails about airport transfer bookings.

You have access to the customer's booking history (provided in context). Use it to give accurate, personalized responses.

Rules:
- Be professional and helpful
- Address the customer by name if known
- Reference their booking details when relevant
- For pricing questions, direct to bookaride.co.nz/book-now
- For cancellations, set action to "flag_cancellation"
- For modifications, set action to "flag_modification"
- For urgent issues, set action to "escalate"
- Keep responses under 200 words
- NEVER reveal other customers' information
- NEVER make up prices or booking details
- Sign off as "BookARide Support Team"
"""


class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None
    history: Optional[list] = []


class IncomingEmail(BaseModel):
    sender: Optional[str] = ""
    from_: Optional[str] = ""
    subject: Optional[str] = ""
    body_plain: Optional[str] = ""
    stripped_text: Optional[str] = ""


async def _call_claude(system: str, messages: list, max_tokens: int = 500) -> str:
    """Call Claude API. Returns response text or fallback."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return ""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": "claude-haiku-4-5-20251001",
                    "max_tokens": max_tokens,
                    "system": system,
                    "messages": messages,
                },
                timeout=30.0,
            )
        if resp.status_code == 200:
            data = resp.json()
            content = data.get("content", [])
            if content and content[0].get("type") == "text":
                return content[0]["text"]
        logger.warning(f"Claude API {resp.status_code}: {resp.text[:200]}")
        return ""
    except Exception as e:
        logger.error(f"Claude API error: {e}")
        return ""


def _check_rate_limit(store: dict, key: str, max_per_hour: int) -> bool:
    """Returns True if within rate limit."""
    now = time.time()
    store[key] = [t for t in store[key] if now - t < 3600]
    if len(store[key]) >= max_per_hour:
        return False
    store[key].append(now)
    return True


# ── Chatbot Endpoint ────────────────────────────────────────────


@router.post("/chatbot/message")
async def chatbot_message(data: ChatMessage, request: Request):
    client_ip = request.client.host if request.client else "unknown"

    if not _check_rate_limit(_chat_rate_limits, client_ip, 20):
        raise HTTPException(
            status_code=429,
            detail="You've sent too many messages. Please try again in a few minutes.",
        )

    if not data.message or not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # Build conversation history (last 10 messages for context)
    messages = []
    if data.history:
        for msg in data.history[-10:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": data.message.strip()})

    reply = await _call_claude(CHATBOT_SYSTEM_PROMPT, messages, max_tokens=300)

    if not reply:
        reply = (
            "Thanks for reaching out! I'm having trouble connecting right now. "
            "For immediate help, please email us at info@bookaride.co.nz or "
            "visit bookaride.co.nz/book-now to get an instant quote."
        )

    return {"reply": reply, "session_id": data.session_id}


# ── Incoming Email Support ──────────────────────────────────────


@router.post("/email/incoming")
async def incoming_email(request: Request):
    """Mailgun webhook for incoming emails to support@bookaride.co.nz."""
    from app.main import db

    try:
        form = await request.form()
        sender = form.get("sender", "") or form.get("from", "")
        subject = form.get("subject", "")
        body = form.get("stripped-text", "") or form.get("body-plain", "")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid email data")

    if not sender or not body:
        return {"status": "ignored", "reason": "empty sender or body"}

    # Extract email address from "Name <email>" format
    email_addr = sender
    if "<" in sender and ">" in sender:
        email_addr = sender.split("<")[1].split(">")[0]

    # Rate limit: 5 AI replies per sender per day
    if not _check_rate_limit(_email_rate_limits, email_addr, 5):
        logger.warning(f"Email rate limit exceeded for {email_addr}")
        return {"status": "rate_limited"}

    # Look up customer booking history
    bookings = []
    if db:
        try:
            results = await db.bookings.find(
                {"email": email_addr}, {"_id": 0}
            ).to_list(20)
            bookings = results
        except Exception as e:
            logger.warning(f"Could not look up bookings for {email_addr}: {e}")

    # Build context for Claude
    booking_context = "No bookings found for this customer."
    if bookings:
        booking_lines = []
        for b in bookings:
            data = b.get("data", b) if isinstance(b.get("data"), dict) else b
            ref = data.get("referenceNumber", "?")
            status = data.get("status", "?")
            date = data.get("date", "?")
            pickup = data.get("pickupAddress", "")[:50]
            dropoff = data.get("dropoffAddress", "")[:50]
            booking_lines.append(
                f"- Ref #{ref}: {status}, {date}, {pickup} -> {dropoff}"
            )
        booking_context = "Customer booking history:\n" + "\n".join(booking_lines)

    system = f"{EMAIL_SYSTEM_PROMPT}\n\n{booking_context}"
    messages = [{"role": "user", "content": f"Subject: {subject}\n\n{body}"}]

    reply_text = await _call_claude(system, messages, max_tokens=500)

    if not reply_text:
        reply_text = (
            "Thank you for contacting BookARide.\n\n"
            "We've received your email and will get back to you shortly. "
            "For urgent matters, please call us directly.\n\n"
            "Kind regards,\nBookARide Support Team"
        )

    # Send AI reply to customer
    reply_html = reply_text.replace("\n", "<br>")
    await send_email(
        to=email_addr,
        subject=f"Re: {subject}" if subject else "BookARide Support",
        html=f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#D4AF37;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
                <strong>BookARide Support</strong>
            </div>
            <div style="padding:20px;border:1px solid #e8e4d9;border-top:none;border-radius:0 0 8px 8px;">
                {reply_html}
            </div>
        </div>""",
        from_name="BookARide Support",
        reply_to="support@bookaride.co.nz",
    )

    # Forward to admin
    await send_email(
        to=ADMIN_EMAIL,
        subject=f"[Support] {subject} - from {email_addr}",
        html=f"""<div style="font-family:Arial,sans-serif;max-width:600px;">
            <h3>Incoming Support Email</h3>
            <p><strong>From:</strong> {sender}</p>
            <p><strong>Subject:</strong> {subject}</p>
            <hr>
            <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:12px 0;">
                <strong>Customer Message:</strong><br>{body.replace(chr(10), '<br>')}
            </div>
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;">
                <strong>AI Response:</strong><br>{reply_html}
            </div>
        </div>""",
    )

    # Log the interaction
    if db:
        try:
            await db.email_logs.insert_one({
                "id": f"email_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}_{email_addr}",
                "sender": email_addr,
                "subject": subject,
                "body": body[:2000],
                "ai_reply": reply_text[:2000],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            logger.warning(f"Failed to log email interaction: {e}")

    return {"status": "replied"}
