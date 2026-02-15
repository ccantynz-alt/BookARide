"""
Unified email sender: Google Workspace SMTP or Mailgun.
Prefer Google SMTP when configured (set SMTP_USER, SMTP_PASS) to avoid Mailgun costs.
Use EMAIL_PROVIDER=google to use only Google; use mailgun or leave unset for Mailgun-first.
"""
import os
import logging
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


def get_noreply_email() -> str:
    """Address for customer-facing transactional emails (confirmations, payment links, etc.)."""
    return os.environ.get("NOREPLY_EMAIL") or os.environ.get("SENDER_EMAIL", "noreply@bookaride.co.nz")


def _use_google_first() -> bool:
    """True when Google SMTP should be tried first (saves cost vs Mailgun)."""
    provider = (os.environ.get("EMAIL_PROVIDER") or "").lower()
    if provider in ("google", "smtp", "gmail"):
        return True
    # If SMTP is configured and Mailgun is not, use Google
    smtp_configured = bool(os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"))
    mailgun_configured = bool(os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"))
    if smtp_configured and not mailgun_configured:
        return True
    return False


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str = None,
    from_name: str = "Book A Ride NZ",
    reply_to: str = None,
    cc: str = None,
) -> bool:
    """
    Send email via Google Workspace SMTP (when configured) or Mailgun.
    When EMAIL_PROVIDER=google or SMTP is configured, uses Google. Otherwise Mailgun.
    Returns True if sent successfully, False otherwise.
    """
    from_email = from_email or get_noreply_email()

    if _use_google_first():
        if _send_via_smtp(to_email, subject, html_content, from_email, from_name, cc=cc, reply_to=reply_to):
            return True
        if _send_via_mailgun(to_email, subject, html_content, from_email, from_name, reply_to, cc=cc):
            return True
    else:
        if _send_via_mailgun(to_email, subject, html_content, from_email, from_name, reply_to, cc=cc):
            return True
        if _send_via_smtp(to_email, subject, html_content, from_email, from_name, cc=cc, reply_to=reply_to):
            return True

    logger.warning("No email provider configured (Google SMTP or Mailgun)")
    return False


def _send_via_mailgun(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    reply_to: str = None,
    cc: str = None,
) -> bool:
    """Send via Mailgun API."""
    api_key = os.environ.get("MAILGUN_API_KEY")
    domain = os.environ.get("MAILGUN_DOMAIN")
    if not api_key or not domain:
        return False

    try:
        data = {
            "from": f"{from_name} <{from_email}>",
            "to": to_email,
            "subject": subject,
            "html": html_content,
        }
        if reply_to:
            data["h:Reply-To"] = reply_to
        if cc and cc.strip():
            data["cc"] = cc.strip()

        resp = requests.post(
            f"https://api.mailgun.net/v3/{domain}/messages",
            auth=("api", api_key),
            data=data,
            timeout=15,
        )
        if resp.status_code == 200:
            logger.info(f"Email sent to {to_email} via Mailgun")
            return True
        logger.error(f"Mailgun error: {resp.status_code} - {resp.text}")
        return False
    except Exception as e:
        logger.error(f"Mailgun send error: {e}")
        return False


def _send_via_smtp(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    cc: str = None,
    reply_to: str = None,
) -> bool:
    """Send via SMTP (Google Workspace / Gmail)."""
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASS")
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))

    if not user or not password:
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        if cc and cc.strip():
            msg["Cc"] = cc.strip()
        if reply_to and reply_to.strip():
            msg["Reply-To"] = reply_to.strip()
        msg.attach(MIMEText(html_content, "html"))

        recipients = [r.strip() for r in to_email.split(",")]
        if cc and cc.strip():
            recipients.extend([r.strip() for r in cc.strip().split(",")])

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, recipients, msg.as_string())

        logger.info(f"Email sent to {to_email} via Google SMTP")
        return True
    except Exception as e:
        logger.error(f"SMTP send error: {e}")
        return False


def is_email_configured() -> bool:
    """Check if any email provider is configured."""
    if os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"):
        return True
    if os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        return True
    return False
