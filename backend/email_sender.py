"""
Unified email sender: Google Workspace Gmail API only.
Uses service account with domain-wide delegation - no Mailgun, no SMTP.
"""
import os
import logging
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.send"


def get_noreply_email() -> str:
    """Address for customer-facing transactional emails (confirmations, payment links, etc.)."""
    return os.environ.get("NOREPLY_EMAIL") or os.environ.get("SENDER_EMAIL", "noreply@bookaride.co.nz")


def _get_gmail_credentials():
    """Get Gmail API credentials using service account with domain-wide delegation."""
    try:
        from google.oauth2 import service_account

        sender_email = get_noreply_email()

        # Try JSON from environment first (production)
        sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON") or os.environ.get("GMAIL_SERVICE_ACCOUNT_JSON")
        if sa_json:
            try:
                info = json.loads(sa_json)
                return service_account.Credentials.from_service_account_info(
                    info, scopes=[GMAIL_SCOPE], subject=sender_email
                )
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
                return None

        # Fallback to file
        sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE") or os.environ.get("GMAIL_SERVICE_ACCOUNT_FILE")
        if sa_file and os.path.exists(sa_file):
            return service_account.Credentials.from_service_account_file(
                sa_file, scopes=[GMAIL_SCOPE], subject=sender_email
            )

        return None
    except Exception as e:
        logger.error(f"Gmail credentials error: {e}")
        return None


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
    Send email via Google Workspace Gmail API only.
    Returns True if sent successfully, False otherwise.
    """
    from_email = from_email or get_noreply_email()

    creds = _get_gmail_credentials()
    if not creds:
        logger.warning("Gmail API not configured (set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_FILE)")
        return False

    try:
        from googleapiclient.discovery import build

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        if reply_to:
            msg["Reply-To"] = reply_to
        if cc:
            msg["Cc"] = cc
        msg.attach(MIMEText(html_content, "html"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        service = build("gmail", "v1", credentials=creds)
        service.users().messages().send(userId="me", body={"raw": raw}).execute()

        logger.info(f"Email sent to {to_email} via Google Workspace Gmail API")
        return True
    except Exception as e:
        logger.error(f"Gmail API send error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def is_email_configured() -> bool:
    """Check if Gmail API is configured."""
    if os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON") or os.environ.get("GMAIL_SERVICE_ACCOUNT_JSON"):
        return True
    sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE") or os.environ.get("GMAIL_SERVICE_ACCOUNT_FILE")
    return bool(sa_file and os.path.exists(sa_file))
