"""
Email sender: SendGrid only by default. One API key, no Mailgun/Google conflicts.
Set EMAIL_PROVIDER=sendgrid (or leave unset) and SENDGRID_API_KEY + NOREPLY_EMAIL.
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


def _get_email_provider() -> str:
    """sendgrid (default), or mailgun/smtp only if EMAIL_PROVIDER is set. SendGrid-only avoids conflicts."""
    return (os.environ.get("EMAIL_PROVIDER") or "sendgrid").strip().lower()


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
    Send email. If EMAIL_PROVIDER is set (mailgun | sendgrid | smtp), use ONLY that – no fallbacks.
    Otherwise try SendGrid, then Mailgun, then SMTP. One provider avoids conflicts.
    """
    from_email = from_email or get_noreply_email()
    provider = _get_email_provider()

    if provider == "mailgun":
        return _send_via_mailgun(to_email, subject, html_content, from_email, from_name, reply_to)
    if provider == "smtp":
        return _send_via_smtp(to_email, subject, html_content, from_email, from_name)
    # sendgrid or default: SendGrid only (no Mailgun/Google)
    if _send_via_sendgrid(to_email, subject, html_content, from_email, from_name, reply_to):
        return True
    logger.warning("SendGrid not configured or failed. Set SENDGRID_API_KEY and NOREPLY_EMAIL (verified sender in SendGrid).")
    return False


def _send_via_sendgrid(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    reply_to: str = None,
) -> bool:
    """Send via SendGrid v3 API. One API key – no App Passwords."""
    api_key = os.environ.get("SENDGRID_API_KEY")
    if not api_key:
        return False

    try:
        payload = {
            "personalizations": [{"to": [{"email": to_email}], "subject": subject}],
            "from": {"email": from_email, "name": from_name},
            "content": [{"type": "text/html", "value": html_content}],
        }
        if reply_to:
            payload["reply_to"] = {"email": reply_to, "name": from_name}

        resp = requests.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15,
        )
        if resp.status_code in (200, 202):
            logger.info(f"Email sent to {to_email} via SendGrid")
            return True
        logger.error(f"SendGrid error: {resp.status_code} - {resp.text}")
        return False
    except Exception as e:
        logger.error(f"SendGrid send error: {e}")
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
        if cc:
            data["cc"] = cc

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


def _send_via_gmail_api(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: str,
    from_name: str,
    reply_to: str = None,
) -> bool:
    """Send via Gmail API using service account with domain-wide delegation."""
    import json
    import base64

    service_account_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    service_account_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE")
    if not service_account_json and not service_account_file:
        return False

    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        logger.warning("Google API client library not installed")
        return False

    try:
        scopes = ["https://www.googleapis.com/auth/gmail.send"]
        if service_account_json:
            try:
                info = json.loads(service_account_json)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON: {e}")
                return False
            # Render sometimes stores \n as literal \\n — fix the private key
            if "private_key" in info:
                info["private_key"] = info["private_key"].replace("\\n", "\n")
            creds = service_account.Credentials.from_service_account_info(info, scopes=scopes)
        else:
            if not os.path.exists(service_account_file):
                logger.error(f"Service account file not found: {service_account_file}")
                return False
            creds = service_account.Credentials.from_service_account_file(service_account_file, scopes=scopes)

        # Delegate to send as the noreply address
        delegated_creds = creds.with_subject(from_email)
        service = build("gmail", "v1", credentials=delegated_creds)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        if reply_to:
            msg["Reply-To"] = reply_to
        msg.attach(MIMEText(html_content, "html"))

        raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
        result = service.users().messages().send(userId="me", body={"raw": raw}).execute()
        logger.info(f"Email sent to {to_email} via Gmail API (id: {result.get('id')})")
        return True
    except Exception as e:
        try:
            from googleapiclient.errors import HttpError
            if isinstance(e, HttpError):
                logger.error(
                    f"Gmail API HttpError {e.status_code}: {e.error_details} — "
                    f"Check service account domain-wide delegation and that "
                    f"{from_email!r} is a real Google Workspace user with Gmail enabled."
                )
                return False
        except Exception:
            pass
        logger.error(f"Gmail API send error ({type(e).__name__}): {e}")
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
        # Must send from the authenticated SMTP account — Google rejects mismatches
        # between the login user and the From address.
        effective_from = user
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{effective_from}>"
        msg["To"] = to_email
        if cc:
            msg["Cc"] = cc
        msg.attach(MIMEText(html_content, "html"))

        all_recipients = [to_email] + [a.strip() for a in cc.split(",")] if cc else [to_email]
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(effective_from, all_recipients, msg.as_string())

        logger.info(f"Email sent to {to_email} via SMTP" + (f" (CC: {cc})" if cc else ""))
        return True
    except Exception as e:
        logger.error(f"SMTP send error: {e}")
        return False


def is_email_configured() -> bool:
    """SendGrid-only: configured if SENDGRID_API_KEY (and NOREPLY_EMAIL) is set."""
    p = _get_email_provider()
    if p == "mailgun":
        return bool(os.environ.get("MAILGUN_API_KEY") and os.environ.get("MAILGUN_DOMAIN"))
    if p == "smtp":
        return bool(os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"))
    # sendgrid or default
    return bool(os.environ.get("SENDGRID_API_KEY"))


def send_test_email(to_email: str):
    """
    Send one test email. Returns (success, error_message).
    Use for diagnostics so the API can return the exact error. SendGrid-only: returns SendGrid error if it fails.
    """
    subject = "Book a Ride – test email"
    html = "<p>If you received this, the booking system email is working.</p>"
    from_email = get_noreply_email()
    from_name = "Book A Ride NZ"

    provider = _get_email_provider()
    if provider == "sendgrid":
        # SendGrid: get the actual API error for diagnostics
        api_key = os.environ.get("SENDGRID_API_KEY")
        if not api_key:
            return False, "SENDGRID_API_KEY not set. Add it in Render Environment (and NOREPLY_EMAIL = verified sender)."
        try:
            payload = {
                "personalizations": [{"to": [{"email": to_email}], "subject": subject}],
                "from": {"email": from_email, "name": from_name},
                "content": [{"type": "text/html", "value": html}],
            }
            resp = requests.post(
                "https://api.sendgrid.com/v3/mail/send",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json=payload,
                timeout=15,
            )
            if resp.status_code in (200, 202):
                return True, ""
            return False, f"SendGrid {resp.status_code}: {resp.text or resp.reason}"
        except Exception as e:
            return False, f"SendGrid request error: {e}"

    if send_email(to_email, subject, html, from_email=from_email, from_name=from_name):
        return True, ""

    if provider == "smtp":
        user, password = os.environ.get("SMTP_USER"), os.environ.get("SMTP_PASS")
        if not user or not password:
            return False, "SMTP_USER or SMTP_PASS not set."
        host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
        port = int(os.environ.get("SMTP_PORT", "587"))
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"], msg["From"], msg["To"] = subject, f"{from_name} <{from_email}>", to_email
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP(host, port) as server:
                server.starttls()
                server.login(user, password)
                server.sendmail(from_email, to_email, msg.as_string())
            return True, ""
        except Exception as e:
            return False, str(e)

    return False, "SendGrid only: set SENDGRID_API_KEY and NOREPLY_EMAIL (verified sender in SendGrid)."
