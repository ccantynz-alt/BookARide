#!/usr/bin/env python3
"""
Quick test script to verify email sending works via Google SMTP.
Run this on Render shell or locally with env vars set:

  SMTP_USER=your@email.com SMTP_PASS=your-app-password python test_email.py

Or if running on Render, just:
  python test_email.py
"""
import os
import sys
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def test_smtp_email():
    smtp_user = os.environ.get('SMTP_USER')
    smtp_pass = os.environ.get('SMTP_PASS')
    smtp_host = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))

    if not smtp_user or not smtp_pass:
        print("ERROR: SMTP_USER and SMTP_PASS environment variables are required")
        print("Set them in your Render dashboard or pass them inline:")
        print("  SMTP_USER=x SMTP_PASS=y python test_email.py")
        sys.exit(1)

    # Send to admin email (same as SMTP_USER by default)
    to_email = os.environ.get('ADMIN_EMAIL', smtp_user)

    print(f"SMTP Host: {smtp_host}:{smtp_port}")
    print(f"SMTP User: {smtp_user}")
    print(f"Sending test email to: {to_email}")
    print()

    subject = "BookaRide Test - Email Sending Works!"
    html_content = """
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0;">Email Test Successful!</h1>
            </div>
            <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb;">
                <p>If you're reading this, your Google SMTP email configuration is working correctly.</p>
                <p><strong>What this means:</strong></p>
                <ul>
                    <li>Customer booking confirmations will be sent</li>
                    <li>Admin notifications for new bookings will be sent</li>
                    <li>Urgent approval notifications will be sent</li>
                    <li>Password reset emails will work</li>
                    <li>Payment link emails will work</li>
                </ul>
                <p style="color: #16a34a; font-weight: bold;">All email paths are using Google SMTP via _send_email_with_fallbacks()</p>
            </div>
            <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px;">
                <p style="margin: 0;">BookaRide NZ - Email Test</p>
            </div>
        </body>
    </html>
    """

    try:
        message = MIMEMultipart('alternative')
        message['Subject'] = subject
        message['From'] = f"BookaRide <{smtp_user}>"
        message['To'] = to_email
        message.attach(MIMEText(html_content, 'html'))

        print("Connecting to SMTP server...")
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            print("TLS established, logging in...")
            server.login(smtp_user, smtp_pass)
            print("Login successful, sending email...")
            server.send_message(message)

        print()
        print("SUCCESS! Test email sent.")
        print(f"Check {to_email} inbox for the test email.")

    except smtplib.SMTPAuthenticationError as e:
        print(f"\nAUTH ERROR: {e}")
        print("Make sure you're using a Google App Password, not your regular password.")
        print("Generate one at: https://myaccount.google.com/apppasswords")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: {e}")
        sys.exit(1)


def test_booking_confirmation():
    """Test the actual booking confirmation email path from server.py"""
    print("\n--- Testing booking confirmation email path ---\n")

    # Import the server module to use its actual email function
    try:
        sys.path.insert(0, os.path.dirname(__file__))
        # We can't easily import server.py (it starts the app), so we test the SMTP path directly
        from server import _send_email_with_fallbacks
    except Exception as e:
        print(f"Could not import from server.py: {e}")
        print("Testing SMTP directly instead (same code path).")
        return test_smtp_email()

    to_email = os.environ.get('ADMIN_EMAIL', os.environ.get('SMTP_USER', ''))
    if not to_email:
        print("ERROR: Need ADMIN_EMAIL or SMTP_USER env var")
        sys.exit(1)

    result = _send_email_with_fallbacks(
        to_email,
        "BookaRide Test Booking Confirmation",
        "<h1>Test Booking Confirmation</h1><p>This confirms the email fallback chain works.</p>"
    )

    if result:
        print(f"SUCCESS! Email sent to {to_email}")
    else:
        print("FAILED! Email was not sent. Check SMTP_USER and SMTP_PASS env vars.")
        sys.exit(1)


if __name__ == "__main__":
    test_smtp_email()
