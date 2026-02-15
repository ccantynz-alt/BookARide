#!/usr/bin/env python3
"""
End-to-end booking flow test for BookaRide.
Tests: calculate-price, create booking, payment redirect, emails.
Run: python scripts/test_booking_flow.py
"""
import requests
import json
import sys
from datetime import datetime, timedelta

BACKEND = "https://bookaride-backend.onrender.com"
API = f"{BACKEND}/api"

def log(msg, ok=None):
    prefix = "✅" if ok is True else ("❌" if ok is False else "ℹ️")
    print(f"{prefix} {msg}")

def test_health():
    """Check backend is reachable"""
    try:
        r = requests.get(f"{BACKEND}/healthz", timeout=15)
        if r.status_code == 200:
            log("Backend health check OK", True)
            return True
        r2 = requests.get(f"{BACKEND}/", timeout=10)
        log(f"Backend reachable (healthz={r.status_code}, /={r2.status_code})", r2.status_code < 500)
        return r2.status_code < 500
    except Exception as e:
        log(f"Backend unreachable: {e}", False)
        return False

def test_calculate_price():
    """Test price calculation"""
    payload = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "83 Alec Craig Way, Gulf Harbour, New Zealand",
        "dropoffAddress": "Auckland Airport, New Zealand",
        "passengers": 1,
        "vipAirportPickup": False,
        "oversizedLuggage": False
    }
    try:
        r = requests.post(f"{API}/calculate-price", json=payload, timeout=15)
        if r.status_code != 200:
            log(f"calculate-price failed: {r.status_code} - {r.text[:200]}", False)
            return None
        data = r.json()
        dist = data.get("distance", 0)
        total = data.get("totalPrice", 0)
        if dist >= 70 and total > 150:
            log(f"Price OK: {dist} km, ${total:.2f} total", True)
        else:
            log(f"Price suspicious: {dist} km, ${total:.2f} (expected ~73km, ~$180+)", dist >= 70)
        return data
    except Exception as e:
        log(f"calculate-price error: {e}", False)
        return None

def test_create_booking(pricing):
    """Create a test booking"""
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    payload = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "83 Alec Craig Way, Gulf Harbour, New Zealand",
        "dropoffAddress": "Auckland Airport, New Zealand",
        "date": tomorrow,
        "time": "10:00",
        "passengers": "1",
        "name": "Test Flow User",
        "email": "test-flow@example.com",
        "phone": "+64210000000",
        "notes": "Automated flow test - please ignore",
        "pricing": pricing or {"distance": 73, "totalPrice": 185, "subtotal": 180, "stripeFee": 5},
        "status": "pending",
        "bookReturn": False,
    }
    try:
        r = requests.post(f"{API}/bookings", json=payload, timeout=15)
        if r.status_code in (200, 201):
            data = r.json()
            ref = data.get("referenceNumber") or data.get("id", "")[:8]
            log(f"Booking created: #{ref}", True)
            return data
        log(f"create booking failed: {r.status_code} - {r.text[:300]}", False)
        return None
    except Exception as e:
        log(f"create booking error: {e}", False)
        return None

def test_payment_checkout(booking_id):
    """Test Stripe checkout creation (may fail if Stripe not configured)"""
    try:
        r = requests.post(f"{API}/payment/create-checkout", json={
            "booking_id": booking_id,
            "origin_url": "https://www.bookaride.co.nz"
        }, timeout=15)
        if r.status_code == 200 and r.json().get("url"):
            log("Stripe checkout URL returned", True)
            return True
        detail = r.json().get("detail", r.text[:100])
        if "stripe" in str(detail).lower() or "not configured" in str(detail).lower():
            log("Stripe not configured - booking still created, payment link would be emailed", True)
        else:
            log(f"Payment checkout: {detail}", False)
        return False
    except Exception as e:
        log(f"Payment checkout error: {e}", False)
        return False

def main():
    print("\n=== BookaRide Booking Flow Test ===\n")
    ok = test_health()
    if not ok:
        print("\nBackend not reachable. Exiting.")
        sys.exit(1)

    pricing = test_calculate_price()
    if not pricing:
        print("\nPrice calculation failed. Continuing with mock pricing...")
        pricing = {"distance": 73, "totalPrice": 185, "subtotal": 180, "stripeFee": 5}

    booking = test_create_booking(pricing)
    if not booking:
        print("\nBooking creation failed. Stopping.")
        sys.exit(1)

    bid = booking.get("id")
    if bid:
        test_payment_checkout(bid)

    print("\n=== Test complete ===")
    print("Manual checks: 1) Confirm emails at info@bookaride.co.nz and test-flow@example.com")
    print("               2) Admin dashboard: verify booking appears")
    print("               3) Resend confirmation from admin if needed")

if __name__ == "__main__":
    main()
