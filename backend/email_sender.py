"""
Unified email sender: Mailgun or Google Workspace SMTP.
Use either by setting the appropriate env vars. SMTP works as fallback when Mailgun is not configured.
"""
import os
import logging
import smtplib
import requests
from typing import Iterable, List, Optional, Tuple, Union
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

EmailList = Union[str, Iterable[str], None]


def _split_emails(value: EmailList) -> List[str]:
    """
    Normalize comma-separated emails or iterable of emails into a list.
    Filters out empty entries.
    """
    if not value:
        return []
    if isinstance(value, str):
        raw = value
        return [e.strip() for e in raw.split(",") if e.strip()]
    emails: List[str] = []
    for item in value:
        if not item:
            continue
        s = str(item).strip()
        if s:
            emails.append(s)
    return emails


def get_email_provider() -> str:
    """
    Determine which email provider to use.

    Env var:
      - EMAIL_PROVIDER: "auto" (default), "mailgun", "smtp" (aka "google")
    """
    provider = (os.environ.get("EMAIL_PROVIDER") or "auto").strip().lower()
    aliases = {
        "google": "smtp",
        "gmail": "smtp",
        "workspace": "smtp",
        "gsuite": "smtp",
        "mail_gun": "mailgun",
        "mg": "mailgun",
        "": "auto",
    }
    provider = aliases.get(provider, provider)
    if provider not in ("auto", "mailgun", "smtp"):
        logger.warning("Unknown EMAIL_PROVIDER=%r, falling back to auto", provider)
        return "auto"
    return provider


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
    cc: EmailList = None,
    bcc: EmailList = None,
    text_content: str = None,
) -> bool:
    """
    Send email via configured provider (Mailgun or Google Workspace/Gmail SMTP).
    Returns True if sent successfully, False otherwise.
    """
    from_email = from_email or get_noreply_email()

    provider = get_email_provider()

    # Provider routing
    if provider == "mailgun":
        return _send_via_mailgun(
            to_email,
            subject,
            html_content,
            from_email,
            from_name,
            reply_to=reply_to,
            cc=cc,
            bcc=bcc,
            text_content=text_content,
        )
    if provider == "smtp":
        return _send_via_smtp(
            to_email,
            subject,
            html_content,
            from_email,
            from_name,
            reply_to=reply_to,
            cc=cc,
            bcc=bcc,
            text_content=text_content,
        )

    # auto: try Mailgun first, fallback to SMTP
    if _send_via_mailgun(
        to_email,
        subject,
        html_content,
        from_email,
        from_name,
        reply_to=reply_to,
        cc=cc,
        bcc=bcc,
        text_content=text_content,
    ):
        return True
    if _send_via_smtp(
        to_email,
        subject,
        html_content,
        from_email,
        from_name,
        reply_to=reply_to,
        cc=cc,
        bcc=bcc,
        text_content=text_content,
    ):
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
    cc: EmailList = None,
    bcc: EmailList = None,
    text_content: str = None,
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
        cc_list = _split_emails(cc)
        bcc_list = _split_emails(bcc)
        if cc_list:
            data["cc"] = ",".join(cc_list)
        if bcc_list:
            data["bcc"] = ",".join(bcc_list)
        if text_content:
            data["text"] = text_content
        if reply_to:
            data["h:Reply-To"] = reply_to

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
    reply_to: str = None,
    cc: EmailList = None,
    bcc: EmailList = None,
    text_content: str = None,
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
        cc_list = _split_emails(cc)
        bcc_list = _split_emails(bcc)
        if cc_list:
            msg["Cc"] = ", ".join(cc_list)
        if reply_to:
            msg["Reply-To"] = reply_to

        # Attach plain text first (preferred by many clients), then HTML
        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        recipients: List[str] = [to_email] + cc_list + bcc_list

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, recipients, msg.as_string())

        logger.info(f"Email sent to {to_email} via SMTP")
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
