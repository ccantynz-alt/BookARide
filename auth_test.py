#!/usr/bin/env python3
"""
Test authentication requirements for admin endpoints
"""

import requests
import json

BACKEND_URL = "https://bookride-manager.preview.emergentagent.com/api"
TEST_BOOKING_ID = "e28adbfd-07a0-4348-94d1-2d18a7a51c46"

def test_endpoint_without_auth(endpoint, method="POST", data=None):
    """Test an endpoint without authentication"""
    session = requests.Session()
    
    try:
        if method == "POST":
            response = session.post(f"{BACKEND_URL}{endpoint}", json=data, timeout=10)
        elif method == "PATCH":
            response = session.patch(f"{BACKEND_URL}{endpoint}", json=data, timeout=10)
        else:
            response = session.get(f"{BACKEND_URL}{endpoint}", timeout=10)
        
        print(f"{method} {endpoint}")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:200]}...")
        print("-" * 50)
        
        return response.status_code
        
    except Exception as e:
        print(f"Error testing {endpoint}: {str(e)}")
        return None

def main():
    print("Testing admin endpoints without authentication...")
    print("=" * 60)
    
    # Test calendar sync
    status1 = test_endpoint_without_auth(f"/bookings/{TEST_BOOKING_ID}/sync-calendar")
    
    # Test resend confirmation
    status2 = test_endpoint_without_auth(f"/bookings/{TEST_BOOKING_ID}/resend-confirmation")
    
    # Test update booking
    status3 = test_endpoint_without_auth(f"/bookings/{TEST_BOOKING_ID}", method="PATCH", data={"name": "test"})
    
    print(f"\nSummary:")
    print(f"Calendar sync: {status1}")
    print(f"Resend confirmation: {status2}")
    print(f"Update booking: {status3}")

if __name__ == "__main__":
    main()