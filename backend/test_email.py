#!/usr/bin/env python3
"""
Quick test script to verify email sending works via Mailgun.
Run this on Render shell or locally with env vars set:

  MAILGUN_API_KEY=xxx MAILGUN_DOMAIN=mg.bookaride.co.nz python test_email.py

Or if running on Render, just:
  python test_email.py
"""
import os
import sys


def test_mailgun_email():
    api_key = os.environ.get('MAILGUN_API_KEY')
    domain = os.environ.get('MAILGUN_DOMAIN')

    if not api_key or not domain:
        print("ERROR: MAILGUN_API_KEY and MAILGUN_DOMAIN environment variables are required")
        print("Set them in your Render dashboard or pass them inline:")
        print("  MAILGUN_API_KEY=xxx MAILGUN_DOMAIN=mg.bookaride.co.nz python test_email.py")
        sys.exit(1)

    to_email = os.environ.get('ADMIN_EMAIL') or os.environ.get('BOOKINGS_NOTIFICATION_EMAIL') or 'bookings@bookaride.co.nz'
    from_email = os.environ.get('NOREPLY_EMAIL') or f"noreply@{domain}"

    print(f"Mailgun Domain: {domain}")
    print(f"From: {from_email}")
    print(f"Sending test email to: {to_email}")
    print()

    try:
        from email_sender import send_email
        print("Using email_sender module...")
        ok = send_email(
            to=to_email,
            subject="BookaRide Test - Email Sending Works!",
            html="""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">Email Test Successful!</h1>
                    </div>
                    <div style="padding: 20px; background-color: #ffffff; border: 1px solid #e5e7eb;">
                        <p>If you're reading this, your Mailgun email configuration is working correctly.</p>
                        <p><strong>What this means:</strong></p>
                        <ul>
                            <li>Customer booking confirmations will be sent</li>
                            <li>Admin notifications for new bookings will be sent</li>
                            <li>Urgent approval notifications will be sent</li>
                            <li>Password reset emails will work</li>
                            <li>Payment link emails will work</li>
                        </ul>
                    </div>
                    <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px;">
                        <p style="margin: 0;">BookaRide NZ - Email Test</p>
                    </div>
                </body>
            </html>
            """,
            from_email=from_email,
        )
        if ok:
            print(f"\nSUCCESS! Test email sent to {to_email}.")
        else:
            print("\nFAILED! Check MAILGUN_API_KEY and MAILGUN_DOMAIN.")
            sys.exit(1)
    except ImportError:
        print("ERROR: Could not import email_sender module.")
        sys.exit(1)


if __name__ == "__main__":
    test_mailgun_email()
