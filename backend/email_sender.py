"""
Unified email sender for BookARide backend.
Uses Mailgun exclusively.
"""
import os
import logging

logger = logging.getLogger(__name__)


def get_noreply_email() -> str:
    return (
        os.environ.get("NOREPLY_EMAIL")
        or os.environ.get("SENDER_EMAIL")
        or "noreply@bookaride.co.nz"
    )


def is_email_configured() -> bool:
    """Return True if Mailgun is properly configured."""
    return bool(os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"))


def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str = None,
    from_name: str = "BookARide NZ",
    reply_to: str = None,
    cc: str = None,
) -> bool:
    """
    Send an email via Mailgun.
    Returns True if sent successfully, False otherwise.
    """
    import requests as req

    if not to or not subject or not html:
        logger.warning("send_email called with missing required args")
        return False

    if from_email is None:
        from_email = get_noreply_email()

    api_key = os.environ.get("MAILGUN_API_KEY")
    domain = os.environ.get("MAILGUN_DOMAIN")
    if not api_key or not domain:
        logger.error(
            "Email NOT sent — Mailgun not configured. "
            "Set MAILGUN_API_KEY and MAILGUN_DOMAIN in Render env vars."
        )
        return False

    from_addr = f"{from_name} <{from_email}>" if from_name else from_email
    try:
        data = {"from": from_addr, "to": [to], "subject": subject, "html": html}
        if cc:
            data["cc"] = [cc] if isinstance(cc, str) else cc
        if reply_to:
            data["h:Reply-To"] = reply_to
        resp = req.post(
            f"https://api.mailgun.net/v3/{domain}/messages",
            auth=("api", api_key),
            data=data,
            timeout=10,
        )
        if resp.status_code in (200, 202):
            logger.info(f"Email sent via Mailgun to {to}")
            return True
        logger.warning(f"Mailgun error {resp.status_code}: {resp.text[:300]}")
        return False
    except Exception as e:
        logger.error(f"Mailgun exception: {e}")
        return False


def send_test_email(to: str):
    """
    Send a simple test email via Mailgun.
    Returns (True, None) on success or (False, error_string) on failure.
    """
    if not is_email_configured():
        return False, "Mailgun not configured. Set MAILGUN_API_KEY and MAILGUN_DOMAIN."

    html = """
    <html><body style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #D4AF37; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h2 style="margin: 0;">BookARide NZ - Test Email</h2>
        </div>
        <div style="padding: 20px; border: 1px solid #e8e4d9; border-top: none; border-radius: 0 0 10px 10px;">
            <p>This is a test email from your BookARide admin dashboard.</p>
            <p>If you received this, your Mailgun email configuration is working correctly.</p>
        </div>
    </body></html>
    """
    ok = send_email(to, "BookARide Test Email", html, from_name="BookARide System")
    if ok:
        return True, None
    return False, "Mailgun API call failed. Check MAILGUN_API_KEY and MAILGUN_DOMAIN."
