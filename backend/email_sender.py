"""
Google Workspace SMTP email sender.
Sends all transactional emails through your Google Workspace account.
"""
import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)


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
    cc_emails: str = None,
) -> bool:
    """
    Send email via Google Workspace SMTP.
    Returns True if sent successfully, False otherwise.
    
    Args:
        to_email: Recipient email address
        subject: Email subject line
        html_content: HTML body of the email
        from_email: Sender email (defaults to NOREPLY_EMAIL)
        from_name: Display name for sender
        reply_to: Optional Reply-To address
        cc_emails: Optional comma-separated CC email addresses
    """
    from_email = from_email or get_noreply_email()
    
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASS")
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))

    if not user or not password:
        logger.error("SMTP not configured - missing SMTP_USER or SMTP_PASS")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        
        if reply_to:
            msg["Reply-To"] = reply_to
            
        if cc_emails:
            msg["Cc"] = cc_emails
        
        # Add plain text version
        text_content = html_content.replace('<br>', '\n').replace('</p>', '\n\n')
        # Simple HTML tag removal for plain text
        import re
        text_content = re.sub('<[^<]+?>', '', text_content)
        msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        # Build recipient list
        recipients = [to_email]
        if cc_emails:
            recipients.extend([email.strip() for email in cc_emails.split(',') if email.strip()])

        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.sendmail(from_email, recipients, msg.as_string())

        cc_info = f" (CC: {cc_emails})" if cc_emails else ""
        logger.info(f"Email sent to {to_email}{cc_info} via Google Workspace SMTP")
        return True
    except Exception as e:
        logger.error(f"SMTP send error: {e}")
        return False


def is_email_configured() -> bool:
    """Check if Google Workspace SMTP is configured."""
    return bool(os.environ.get("SMTP_USER") and os.environ.get("SMTP_PASS"))
