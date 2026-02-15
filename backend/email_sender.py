"""
Unified email sender: Google Gmail API (primary) → SMTP → Mailgun (last resort).

Priority order:
  1. Gmail API via Service Account + Domain-Wide Delegation  (no extra cost if you already have Google Workspace)
  2. Google Workspace / Gmail SMTP with App Password
  3. Mailgun HTTP API (kept as final fallback)

Environment variables
---------------------
Gmail API (recommended):
    GOOGLE_SERVICE_ACCOUNT_FILE   – path to service-account JSON  (or use the existing one at backend/service_account.json)
    GOOGLE_SERVICE_ACCOUNT_JSON   – alternative: the raw JSON string (useful for Render / Docker secrets)
    GMAIL_DELEGATED_USER          – the Google Workspace user to send as, e.g. noreply@bookaride.co.nz
                                    Falls back to NOREPLY_EMAIL → SENDER_EMAIL

SMTP:
    SMTP_USER / SMTP_PASS / SMTP_HOST (default smtp.gmail.com) / SMTP_PORT (default 587)

Mailgun:
    MAILGUN_API_KEY / MAILGUN_DOMAIN
"""
import os
import json
import base64
import logging
import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Cached Gmail API service (built lazily on first send)
# ---------------------------------------------------------------------------
_gmail_service = None
_gmail_delegated_user = None


def _get_gmail_service(delegated_user: str):
    """Build (or reuse) a Gmail API service object for *delegated_user*."""
    global _gmail_service, _gmail_delegated_user

    if _gmail_service and _gmail_delegated_user == delegated_user:
        return _gmail_service

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        scopes = ["https://www.googleapis.com/auth/gmail.send"]

        # Load credentials from file or env-var JSON string
        sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
        sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")

        if sa_file and os.path.isfile(sa_file):
            creds = service_account.Credentials.from_service_account_file(sa_file, scopes=scopes)
            logger.info(f"Gmail API: loaded service-account from file {sa_file}")
        elif sa_json:
            info = json.loads(sa_json)
            creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
            logger.info("Gmail API: loaded service-account from GOOGLE_SERVICE_ACCOUNT_JSON env var")
        else:
            # Try the default service_account.json that already exists for Calendar
            default_path = os.path.join(os.path.dirname(__file__), "service_account.json")
            if os.path.isfile(default_path):
                creds = service_account.Credentials.from_service_account_file(default_path, scopes=scopes)
                logger.info(f"Gmail API: loaded service-account from default path {default_path}")
            else:
                return None

        # Impersonate the workspace user (domain-wide delegation)
        delegated_creds = creds.with_subject(delegated_user)

        service = build("gmail", "v1", credentials=delegated_creds, cache_discovery=False)
        _gmail_service = service
        _gmail_delegated_user = delegated_user
        return service

    except Exception as e:
        logger.warning(f"Gmail API: could not build service – {e}")
        return None


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

def get_noreply_email() -> str:
    """Address used for customer-facing transactional emails."""
    return (
        os.environ.get("GMAIL_DELEGATED_USER")
        or os.environ.get("NOREPLY_EMAIL")
        or os.environ.get("SENDER_EMAIL", "noreply@bookaride.co.nz")
    )


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str | None = None,
    from_name: str = "Book A Ride NZ",
    reply_to: str | None = None,
    cc: str | None = None,
    text_content: str | None = None,
) -> bool:
    """
    Send an email using the best available provider.

    Returns True on success, False on failure.
    """
    from_email = from_email or get_noreply_email()

    # 1. Gmail API (primary – no extra cost on Google Workspace)
    if _send_via_gmail_api(to_email, subject, html_content, from_email, from_name, reply_to, cc, text_content):
        return True

    # 2. SMTP (Google Workspace / Gmail with App Password)
    if _send_via_smtp(to_email, subject, html_content, from_email, from_name, reply_to, cc, text_content):
        return True

    # 3. Mailgun HTTP API (last resort)
    if _send_via_mailgun(to_email, subject, html_content, from_email, from_name, reply_to, cc, text_content):
        return True

    logger.error("All email providers failed or are unconfigured (Gmail API / SMTP / Mailgun)")
    return False


def is_email_configured() -> bool:
    """Check if at least one email provider is configured."""
    # Gmail API
    if _gmail_api_available():
        return True
    # SMTP
    if os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        return True
    # Mailgun
    if os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"):
        return True
    return False


def get_configured_provider() -> str:
    """Return the name of the provider that will be tried first."""
    if _gmail_api_available():
        return "Gmail API"
    if os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"):
        return "SMTP"
    if os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"):
        return "Mailgun"
    return "None"


# ---------------------------------------------------------------------------
# Provider: Gmail API
# ---------------------------------------------------------------------------

def _gmail_api_available() -> bool:
    """Quick check whether Gmail API credentials are plausibly present."""
    if os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE") or os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON"):
        return True
    default_path = os.path.join(os.path.dirname(__file__), "service_account.json")
    return os.path.isfile(default_path)


def _send_via_gmail_api(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    reply_to: str | None = None,
    cc: str | None = None,
    text_content: str | None = None,
) -> bool:
    """Send via Gmail API using service-account domain-wide delegation."""
    delegated_user = os.environ.get("GMAIL_DELEGATED_USER") or from_email
    service = _get_gmail_service(delegated_user)
    if not service:
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        if cc:
            msg["Cc"] = cc
        if reply_to:
            msg["Reply-To"] = reply_to
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()

        service.users().messages().send(
            userId="me",
            body={"raw": raw},
        ).execute()

        logger.info(f"Email sent to {to_email} via Gmail API (as {delegated_user})")
        return True

    except Exception as e:
        logger.warning(f"Gmail API send failed: {e}")
        # Reset cached service so next call rebuilds (in case of expired token etc.)
        global _gmail_service, _gmail_delegated_user
        _gmail_service = None
        _gmail_delegated_user = None
        return False


# ---------------------------------------------------------------------------
# Provider: SMTP (Google Workspace / Gmail)
# ---------------------------------------------------------------------------

def _send_via_smtp(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    reply_to: str | None = None,
    cc: str | None = None,
    text_content: str | None = None,
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
        if cc:
            msg["Cc"] = cc
        if reply_to:
            msg["Reply-To"] = reply_to
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        recipients = [to_email]
        if cc:
            recipients.extend([addr.strip() for addr in cc.split(",") if addr.strip()])

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, recipients, msg.as_string())

        logger.info(f"Email sent to {to_email} via SMTP ({host})")
        return True
    except Exception as e:
        logger.error(f"SMTP send error: {e}")
        return False


# ---------------------------------------------------------------------------
# Provider: Mailgun (last resort)
# ---------------------------------------------------------------------------

def _send_via_mailgun(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    reply_to: str | None = None,
    cc: str | None = None,
    text_content: str | None = None,
) -> bool:
    """Send via Mailgun API (kept as last-resort fallback)."""
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
        if cc:
            data["cc"] = cc
        if text_content:
            data["text"] = text_content

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
