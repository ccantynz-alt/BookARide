#!/usr/bin/env python3
"""Call the backend restore-all endpoint to reinstate all soft-deleted bookings. Requires admin credentials."""
import os
import sys
import requests

BACKEND_URL = os.environ.get("BACKEND_URL", "https://bookaride-backend.onrender.com")
API = BACKEND_URL if BACKEND_URL.rstrip("/").endswith("/api") else f"{BACKEND_URL.rstrip('/')}/api"
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

def main():
    if not ADMIN_USERNAME or not ADMIN_PASSWORD:
        print("Set ADMIN_USERNAME and ADMIN_PASSWORD in the environment, then run again.")
        print("Example: ADMIN_USERNAME=admin ADMIN_PASSWORD=yourpass python scripts/restore_all_bookings.py")
        sys.exit(1)
    # Login
    r = requests.post(f"{API}/admin/login", json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}, timeout=30)
    if r.status_code != 200:
        print(f"Login failed: {r.status_code} - {r.text[:200]}")
        sys.exit(1)
    token = r.json().get("access_token")
    if not token:
        print("Login response had no access_token")
        sys.exit(1)
    # Restore all
    r2 = requests.post(f"{API}/bookings/restore-all", headers={"Authorization": f"Bearer {token}"}, timeout=60)
    if r2.status_code != 200:
        print(f"restore-all failed: {r2.status_code} - {r2.text[:300]}")
        sys.exit(1)
    data = r2.json()
    n = data.get("restored_count", 0)
    print(data.get("message", f"Restored {n} booking(s)."))
    print("Done.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
