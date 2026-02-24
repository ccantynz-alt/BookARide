#!/usr/bin/env python3
"""
Verify booking flow: emails (admin + customer) and calendar sync.
Run against a running backend (local or Render).

Usage:
  # Use default backend (localhost:8000)
  python scripts/verify_booking_flow.py

  # Use specific backend
  set BACKEND_URL=https://bookaride-backend.onrender.com
  python scripts/verify_booking_flow.py

  # Create a real test booking (then check inbox + calendar)
  python scripts/verify_booking_flow.py --create-booking
"""
import os
import sys
import argparse
from datetime import datetime, timedelta

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

BACKEND = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
API = f"{BACKEND}/api"


def log(ok, msg):
    prefix = "[OK] " if ok else "[--] "
    print(f"{prefix} {msg}")


def check_health():
    """Verify backend is reachable."""
    try:
        r = requests.get(f"{BACKEND}/healthz", timeout=10)
        if r.status_code == 200:
            log(True, "Backend health check passed")
            return True
        r2 = requests.get(f"{BACKEND}/", timeout=10)
        log(r2.status_code < 500, f"Backend reachable (status {r2.status_code})")
        return r2.status_code < 500
    except Exception as e:
        log(False, f"Backend unreachable: {e}")
        return False


def create_test_booking():
    """Create one test booking so you can verify email + calendar."""
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    payload = {
        "name": "Flow Test Customer",
        "email": os.environ.get("TEST_BOOKING_EMAIL", "test@example.com"),
        "phone": "+64210000000",
        "serviceType": "airport-shuttle",
        "pickupAddress": "Auckland Airport, New Zealand",
        "dropoffAddress": "Queen Street, Auckland CBD",
        "date": tomorrow,
        "time": "10:00",
        "passengers": "1",
        "paymentMethod": "pay-on-pickup",
        "notificationPreference": "email",
    }
    try:
        r = requests.post(f"{API}/bookings", json=payload, timeout=15)
        if r.status_code not in (200, 201):
            log(False, f"Create booking failed: {r.status_code} - {r.text[:300]}")
            return None
        data = r.json()
        ref = data.get("referenceNumber") or data.get("reference_number") or "?"
        bid = data.get("id", "")
        log(True, f"Test booking created: Ref #{ref} (id={bid})")
        return {"id": bid, "referenceNumber": ref}
    except Exception as e:
        log(False, f"Create booking error: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Verify booking flow (emails + calendar)")
    parser.add_argument("--create-booking", action="store_true", help="Create a test booking")
    parser.add_argument("--backend", default=None, help="Backend URL (overrides BACKEND_URL)")
    args = parser.parse_args()
    global BACKEND, API
    if args.backend:
        BACKEND = args.backend.rstrip("/")
        API = f"{BACKEND}/api"

    print("Booking flow verification")
    print("Backend:", BACKEND)
    print()

    ok = check_health()
    if not ok:
        print("\nFix backend connectivity first, then re-run.")
        sys.exit(1)

    booking = None
    if args.create_booking:
        print("\nCreating test booking...")
        booking = create_test_booking()
        if booking:
            print("\nNext steps (manual):")
            print("  1. Customer email: check inbox for", os.environ.get("TEST_BOOKING_EMAIL", "test@example.com"))
            print("  2. Admin email: check inbox for BOOKINGS_NOTIFICATION_EMAIL (e.g. bookings@bookaride.co.nz)")
            print("  3. Calendar: open Google Calendar and confirm event(s) for the test booking")
            print("  4. Edit the booking (change time or address), save, then confirm calendar event updated")
    else:
        print("\nChecks completed (backend is up).")
        print("For full flow: run with --create-booking, then verify emails + calendar (see BOOKING-FLOW-CHECKS.md)")

    print()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
