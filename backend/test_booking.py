#!/usr/bin/env python3
"""
Create a test booking via the BookaRide API to verify:
1. Booking is created successfully
2. Customer confirmation email is received
3. Admin notification email is received

Usage:
  python test_booking.py [--api-url https://bookaride.co.nz]

The test booking uses a future date so it won't interfere with real operations.
"""
import argparse
import json
import sys
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)


def create_test_booking(api_url: str, admin_email: str):
    """Create a test booking and verify the response."""
    # Use a date 7 days from now so it doesn't interfere with real bookings
    future_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")

    booking_data = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "123 Test Street, Auckland CBD, Auckland 1010",
        "dropoffAddress": "Auckland Airport, Auckland 2022",
        "date": future_date,
        "time": "10:00",
        "passengers": "1",
        "name": "Test Booking (DELETE ME)",
        "email": admin_email,
        "phone": "+64210000000",
        "notes": "TEST BOOKING - Please delete. Verifying email confirmations work.",
        "pricing": {
            "totalPrice": 0,
            "basePrice": 0,
            "currency": "NZD"
        },
        "status": "pending",
        "payment_status": "unpaid",
        "bookReturn": False,
        "notificationPreference": "email",
        "skipNotifications": False,
        "flightNumber": "NZ123"
    }

    url = f"{api_url.rstrip('/')}/api/bookings"
    print(f"Creating test booking...")
    print(f"  API URL: {url}")
    print(f"  Date: {future_date}")
    print(f"  Email: {admin_email}")
    print()

    try:
        response = requests.post(
            url,
            json=booking_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if response.status_code in (200, 201):
            data = response.json()
            booking_id = data.get("id") or data.get("_id") or data.get("bookingId", "unknown")
            ref = data.get("bookingReference") or data.get("reference", "unknown")
            print(f"SUCCESS! Test booking created.")
            print(f"  Booking ID: {booking_id}")
            print(f"  Reference: {ref}")
            print(f"  Status: {data.get('status', 'unknown')}")
            print()
            print("Now check your inbox for:")
            print(f"  1. Customer confirmation email to: {admin_email}")
            print(f"  2. Admin notification email to your admin email")
            print()
            print(f"IMPORTANT: Delete this test booking from the admin dashboard when done.")
            print(f"  Look for: 'Test Booking (DELETE ME)' on {future_date}")
            return True
        else:
            print(f"FAILED! Status {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False

    except requests.exceptions.ConnectionError:
        print(f"ERROR: Could not connect to {url}")
        print("Make sure the backend is running and the URL is correct.")
        return False
    except Exception as e:
        print(f"ERROR: {e}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a test booking to verify email notifications")
    parser.add_argument("--api-url", default="https://bookaride.co.nz",
                        help="Backend API URL (default: https://bookaride.co.nz)")
    parser.add_argument("--email", default="bookings@bookaride.co.nz",
                        help="Email to receive the test confirmation (default: bookings@bookaride.co.nz)")
    args = parser.parse_args()

    print("=== BookaRide Test Booking ===")
    print()
    success = create_test_booking(args.api_url, args.email)
    sys.exit(0 if success else 1)
