#!/usr/bin/env python3
"""
Simple test script to verify Google Workspace Gmail API is configured correctly.
Run this after completing the setup steps in GMAIL_API_SETUP_SIMPLE.md

Usage: python test_gmail_setup.py [your-email@example.com]
If no email given, will only check if credentials load (won't send).
"""
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def main():
    test_email = sys.argv[1] if len(sys.argv) > 1 else None

    print("=" * 50)
    print("Google Workspace Gmail API - Setup Test")
    print("=" * 50)

    # Check env vars
    sa_file = os.environ.get("GOOGLE_SERVICE_ACCOUNT_FILE") or os.environ.get("GMAIL_SERVICE_ACCOUNT_FILE")
    sa_json = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON") or os.environ.get("GMAIL_SERVICE_ACCOUNT_JSON")
    sender = os.environ.get("SENDER_EMAIL") or os.environ.get("NOREPLY_EMAIL")

    print("\n1. Checking environment variables...")
    if sa_file and os.path.exists(sa_file):
        print(f"   ✅ GOOGLE_SERVICE_ACCOUNT_FILE found: {sa_file}")
    elif sa_json:
        print("   ✅ GOOGLE_SERVICE_ACCOUNT_JSON is set")
    else:
        print("   ❌ No credentials found! Set GOOGLE_SERVICE_ACCOUNT_FILE or GOOGLE_SERVICE_ACCOUNT_JSON")
        return 1

    if sender:
        print(f"   ✅ SENDER_EMAIL: {sender}")
    else:
        print("   ❌ SENDER_EMAIL or NOREPLY_EMAIL not set")
        return 1

    # Try to load and send
    print("\n2. Testing Gmail API connection...")
    try:
        from server import send_via_gmail_api

        test_booking = {
            "id": "test-setup-123",
            "name": "Setup Test",
            "email": test_email or "test@example.com",
            "phone": "+64211234567",
            "serviceType": "airport-shuttle",
            "pickupAddress": "Auckland Airport",
            "dropoffAddress": "Queen Street, Auckland",
            "date": "2025-12-20",
            "time": "15:30",
            "passengers": "2",
            "language": "en",
            "pricing": {"totalPrice": 99.00},
        }

        if test_email:
            print(f"   Sending test email to {test_email}...")
            success = send_via_gmail_api(test_booking)
            if success:
                print("   ✅ SUCCESS! Check your inbox for the test confirmation email.")
            else:
                print("   ❌ Failed to send. Check logs above for errors.")
                return 1
        else:
            # Just test credential loading
            from server import _get_gmail_api_credentials
            creds = _get_gmail_api_credentials()
            if creds:
                print("   ✅ Credentials loaded successfully!")
                print("   (Run with your email as argument to send a real test: python test_gmail_setup.py you@email.com)")
            else:
                print("   ❌ Could not load credentials")
                return 1

    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

    print("\n" + "=" * 50)
    print("All checks passed! Gmail API is ready.")
    print("=" * 50)
    return 0


if __name__ == "__main__":
    sys.exit(main())
