"""
Unified email sender: Mailgun or Google Workspace SMTP.
Use either by setting the appropriate env vars.

For Google Workspace:
  - Set EMAIL_PROVIDER=google_workspace to use SMTP as primary
  - Set SMTP_USER, SMTP_PASS (App Password), and optionally SMTP_HOST, SMTP_PORT
  - SENDER_EMAIL should be your workspace address (e.g. noreply@bookaride.co.nz)

For Mailgun:
  - Set MAILGUN_API_KEY and MAILGUN_DOMAIN
"""
import os
import logging
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# When "google_workspace" or "smtp", try SMTP first. Otherwise try Mailgun first.
EMAIL_PROVIDER = os.environ.get("EMAIL_PROVIDER", "").lower().strip()
PREFER_GOOGLE_WORKSPACE = EMAIL_PROVIDER in ("google_workspace", "smtp", "gmail")


def get_noreply_email() -> str:
    """Address for customer-facing transactional emails (confirmations, payment links, etc.)."""
    return os.environ.get("NOREPLY_EMAIL") or os.environ.get("SENDER_EMAIL", "noreply@bookaride.co.nz")


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
    Send email via Mailgun or Google Workspace SMTP.
    Provider order depends on EMAIL_PROVIDER env var.
    Returns True if sent successfully, False otherwise.
    """
    from_email = from_email or get_noreply_email()

    if PREFER_GOOGLE_WORKSPACE:
        # Try Google Workspace SMTP first
        if _send_via_smtp(to_email, subject, html_content, from_email, from_name, cc=cc):
            return True
        if _send_via_mailgun(to_email, subject, html_content, from_email, from_name, reply_to, cc=cc):
            return True
    else:
        # Try Mailgun first, then SMTP fallback
        if _send_via_mailgun(to_email, subject, html_content, from_email, from_name, reply_to, cc=cc):
            return True
        if _send_via_smtp(to_email, subject, html_content, from_email, from_name, cc=cc):
            return True

    logger.warning("No email provider configured (Mailgun or SMTP)")
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
        msg.attach(MIMEText(html_content, "html"))

        recipients = [r.strip() for r in to_email.split(",")]
        if cc and cc.strip():
            recipients.extend([r.strip() for r in cc.strip().split(",")])

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, recipients, msg.as_string())

        logger.info(f"Email sent to {to_email} via SMTP (Google Workspace)")
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
