#!/usr/bin/env python3
"""
Test email delivery from the booking system (Google Workspace SMTP or Mailgun).
Run from repo root or backend folder. Loads backend/.env and sends one test email.

Usage:
  cd C:\\Users\\ccant\\BookARide\\backend
  python scripts/test_email_send.py your@email.com

  # Or from repo root:
  python backend/scripts/test_email_send.py your@email.com
"""
import os
import sys
from pathlib import Path

# Load .env from backend folder
backend_dir = Path(__file__).resolve().parent.parent
env_file = backend_dir / ".env"
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(env_file)
    print(f"Loaded env from {env_file}")
else:
    print(f"No .env at {env_file} - using system env only")

def main():
    to_email = (sys.argv[1:] or [None])[0]
    if not to_email or "@" not in to_email:
        print("Usage: python scripts/test_email_send.py your@email.com")
        sys.exit(1)

    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    mailgun_key = os.environ.get("MAILGUN_API_KEY")
    mailgun_domain = os.environ.get("MAILGUN_DOMAIN")
    from_email = os.environ.get("NOREPLY_EMAIL") or os.environ.get("SENDER_EMAIL") or smtp_user or "noreply@bookaride.co.nz"

    print()
    print("Email config check:")
    print("  SMTP_USER:", "set" if smtp_user else "NOT SET")
    print("  SMTP_PASS:", "set" if smtp_pass else "NOT SET")
    print("  NOREPLY_EMAIL / SENDER_EMAIL:", from_email)
    print("  MAILGUN_API_KEY:", "set" if mailgun_key else "not set")
    print("  MAILGUN_DOMAIN:", mailgun_domain or "not set")
    print()

    if not smtp_user or not smtp_pass:
        if not mailgun_key or not mailgun_domain:
            print("ERROR: No email configured. Set SMTP_USER and SMTP_PASS (Google Workspace)")
            print("       or MAILGUN_API_KEY and MAILGUN_DOMAIN. See SETUP-GOOGLE-WORKSPACE-EMAIL.md")
            sys.exit(1)

    # Try sending via the same module the app uses
    sys.path.insert(0, str(backend_dir))
    try:
        from email_sender import send_email, get_noreply_email
    except ImportError:
        print("Could not import email_sender; trying raw SMTP...")
        send_email = None

    subject = "Book a Ride – test email"
    html = "<p>If you received this, the booking system email is working.</p>"

    if send_email:
        ok = send_email(to_email, subject, html, from_email=get_noreply_email(), from_name="Book a Ride NZ")
        if ok:
            print("SUCCESS: Test email sent to", to_email)
            print("Check inbox and spam.")
            sys.exit(0)
        else:
            print("FAILED: send_email returned False. Check backend logs for details.")
            print("Common causes: wrong App Password, From address not allowed for SMTP_USER.")
            sys.exit(1)

    # Fallback: raw SMTP so we see the exact error
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    if not smtp_user or not smtp_pass:
        print("SMTP credentials missing. Cannot send.")
        sys.exit(1)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Book a Ride NZ <{from_email}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))
    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(from_email, to_email, msg.as_string())
        print("SUCCESS: Test email sent to", to_email)
        print("Check inbox and spam.")
        sys.exit(0)
    except Exception as e:
        print("SMTP ERROR:", type(e).__name__, str(e))
        if "Username and Password not accepted" in str(e) or "Authentication failed" in str(e):
            print()
            print("-> Use a Google App Password, not your normal password.")
            print("   Create one: https://myaccount.google.com/apppasswords")
            print("   (2-Step Verification must be on.)")
        if from_email and smtp_user and from_email.lower() != smtp_user.lower():
            print()
            print("-> For Gmail/Workspace, From address usually must match SMTP_USER.")
            print("   Set NOREPLY_EMAIL to the same as SMTP_USER:", smtp_user)
        sys.exit(1)

if __name__ == "__main__":
    main()
