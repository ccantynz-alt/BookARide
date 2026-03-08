"""
Unified email sender for BookARide backend.
Supports Mailgun, SendGrid, and SMTP (Gmail) in that priority order.
"""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def get_noreply_email() -> str:
    return (
        os.environ.get("NOREPLY_EMAIL")
        or os.environ.get("SENDER_EMAIL")
        or "noreply@bookaride.co.nz"
    )


def is_email_configured() -> bool:
    """Return True if any email provider is properly configured."""
    if os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"):
        return True
    if os.environ.get("SENDGRID_API_KEY"):
        return True
    if os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        return True
    return False


def _send_via_mailgun(to: str, subject: str, html: str, from_email: str, from_name: str, reply_to: str = None) -> bool:
    import requests as req
    api_key = os.environ.get("MAILGUN_API_KEY")
    domain = os.environ.get("MAILGUN_DOMAIN")
    if not api_key or not domain:
        return False
    from_addr = f"{from_name} <{from_email}>" if from_name else from_email
    try:
        data = {"from": from_addr, "to": [to], "subject": subject, "html": html}
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


def _send_via_sendgrid(to: str, subject: str, html: str, from_email: str, from_name: str, reply_to: str = None) -> bool:
    import requests as req
    api_key = os.environ.get("SENDGRID_API_KEY")
    if not api_key:
        return False
    payload = {
        "personalizations": [{"to": [{"email": to}]}],
        "from": {"email": from_email, "name": from_name or "BookARide"},
        "subject": subject,
        "content": [{"type": "text/html", "value": html}],
    }
    if reply_to:
        payload["reply_to"] = {"email": reply_to}
    try:
        resp = req.post(
            "https://api.sendgrid.com/v3/mail/send",
            json=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            timeout=10,
        )
        if resp.status_code in (200, 202):
            logger.info(f"Email sent via SendGrid to {to}")
            return True
        logger.warning(f"SendGrid error {resp.status_code}: {resp.text[:300]}")
        return False
    except Exception as e:
        logger.error(f"SendGrid exception: {e}")
        return False


def _send_via_smtp(to: str, subject: str, html: str, from_email: str, from_name: str, reply_to: str = None) -> bool:
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    if not smtp_user or not smtp_pass:
        return False
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{from_name} <{from_email}>" if from_name else from_email
    msg["To"] = to
    if reply_to:
        msg["Reply-To"] = reply_to
    msg.attach(MIMEText(html, "html", "utf-8"))
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, [to], msg.as_string())
        logger.info(f"Email sent via SMTP to {to}")
        return True
    except Exception as e:
        logger.error(f"SMTP exception: {e}")
        return False


def send_email(
    to: str,
    subject: str,
    html: str,
    from_email: str = None,
    from_name: str = "BookARide NZ",
    reply_to: str = None,
) -> bool:
    """
    Send an email using the first available provider:
    Mailgun → SendGrid → SMTP
    Returns True if sent successfully, False otherwise.
    """
    if not to or not subject or not html:
        logger.warning("send_email called with missing required args")
        return False

    if from_email is None:
        from_email = get_noreply_email()

    provider = os.environ.get("EMAIL_PROVIDER", "").lower()

    # Respect explicit provider preference
    if provider == "mailgun":
        return _send_via_mailgun(to, subject, html, from_email, from_name, reply_to)
    if provider == "sendgrid":
        return _send_via_sendgrid(to, subject, html, from_email, from_name, reply_to)
    if provider == "smtp":
        return _send_via_smtp(to, subject, html, from_email, from_name, reply_to)

    # Auto-detect: try in priority order
    if os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"):
        if _send_via_mailgun(to, subject, html, from_email, from_name, reply_to):
            return True

    if os.environ.get("SENDGRID_API_KEY"):
        if _send_via_sendgrid(to, subject, html, from_email, from_name, reply_to):
            return True

    if os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        if _send_via_smtp(to, subject, html, from_email, from_name, reply_to):
            return True

    logger.error(
        "Email NOT sent — no provider configured. "
        "Set MAILGUN_API_KEY+MAILGUN_DOMAIN, SENDGRID_API_KEY, or SMTP_USER+SMTP_PASS in Render env vars."
    )
    return False
