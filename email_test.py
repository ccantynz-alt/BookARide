#!/usr/bin/env python3
"""
Test email functionality by creating a booking and simulating payment completion
"""

import requests
import json
import time
from datetime import datetime

BACKEND_URL = "https://ride-booking-fix-5.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "BookARide2024!"

def test_email_flow():
    """Test complete email flow"""
    session = requests.Session()
    
    # 1. Login as admin
    print("🔐 Logging in as admin...")
    login_response = session.post(f"{BACKEND_URL}/admin/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Admin login failed: {login_response.status_code}")
        return False
    
    token = login_response.json().get('access_token')
    session.headers.update({'Authorization': f'Bearer {token}'})
    print("✅ Admin login successful")
    
    # 2. Create a test booking
    print("\n📝 Creating test booking...")
    booking_data = {
        "serviceType": "airport-shuttle",
        "pickupAddress": "Auckland Airport, Auckland",
        "dropoffAddress": "Queen Street, Auckland CBD",
        "date": "2025-12-20",
        "time": "15:30",
        "passengers": "2",
        "name": "Email Test User",
        "email": "emailtest@bookaride.co.nz",
        "phone": "+64211234999",
        "language": "en",
        "pricing": {"totalPrice": 105.50}
    }
    
    booking_response = session.post(f"{BACKEND_URL}/bookings", json=booking_data)
    
    if booking_response.status_code != 200:
        print(f"❌ Booking creation failed: {booking_response.status_code}")
        return False
    
    booking = booking_response.json()
    booking_id = booking.get('id')
    print(f"✅ Booking created: {booking_id}")
    
    # 3. Create Stripe checkout session
    print("\n💳 Creating Stripe checkout session...")
    checkout_data = {
        "booking_id": booking_id,
        "origin_url": "https://bookaride.co.nz"
    }
    
    checkout_response = session.post(f"{BACKEND_URL}/payment/create-checkout", json=checkout_data)
    
    if checkout_response.status_code != 200:
        print(f"❌ Checkout creation failed: {checkout_response.status_code}")
        return False
    
    checkout = checkout_response.json()
    session_id = checkout.get('session_id')
    print(f"✅ Checkout session created: {session_id}")
    
    # 4. Simulate payment completion by checking payment status
    print("\n🔍 Checking payment status (simulates webhook)...")
    status_response = session.get(f"{BACKEND_URL}/payment/status/{session_id}")
    
    if status_response.status_code == 200:
        status = status_response.json()
        print(f"✅ Payment status check successful: {status.get('payment_status', 'unknown')}")
    else:
        print(f"⚠️ Payment status check failed: {status_response.status_code}")
    
    # 5. Check if booking was updated
    print("\n📋 Checking updated booking...")
    bookings_response = session.get(f"{BACKEND_URL}/bookings")
    
    if bookings_response.status_code == 200:
        bookings = bookings_response.json()
        test_booking = next((b for b in bookings if b.get('id') == booking_id), None)
        
        if test_booking:
            payment_status = test_booking.get('payment_status', 'unknown')
            booking_status = test_booking.get('status', 'unknown')
            print(f"✅ Booking found - Payment: {payment_status}, Status: {booking_status}")
            
            # Check if email would be triggered
            if payment_status == 'paid':
                print("✅ Email confirmation would be sent (payment marked as paid)")
            else:
                print("ℹ️ Email not triggered yet (payment not marked as paid)")
        else:
            print("❌ Test booking not found")
    else:
        print(f"❌ Failed to retrieve bookings: {bookings_response.status_code}")
    
    return True

def test_multilanguage_bookings():
    """Test bookings in different languages"""
    session = requests.Session()
    
    # Login
    login_response = session.post(f"{BACKEND_URL}/admin/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Admin login failed for multilanguage test")
        return False
    
    token = login_response.json().get('access_token')
    session.headers.update({'Authorization': f'Bearer {token}'})
    
    # Test different languages
    languages = {
        'zh': {
            "name": "测试用户中文",
            "email": "chinese-test@bookaride.co.nz",
            "pickupAddress": "奥克兰机场",
            "dropoffAddress": "奥克兰市中心"
        },
        'ja': {
            "name": "テストユーザー日本語",
            "email": "japanese-test@bookaride.co.nz", 
            "pickupAddress": "オークランド空港",
            "dropoffAddress": "オークランド市内"
        },
        'ko': {
            "name": "테스트 사용자 한국어",
            "email": "korean-test@bookaride.co.nz",
            "pickupAddress": "오클랜드 공항",
            "dropoffAddress": "오클랜드 시내"
        }
    }
    
    print("\n🌍 Testing Multi-Language Bookings...")
    
    for lang, data in languages.items():
        booking_data = {
            "serviceType": "airport-shuttle",
            "pickupAddress": data["pickupAddress"],
            "dropoffAddress": data["dropoffAddress"],
            "date": "2025-12-21",
            "time": "12:00",
            "passengers": "1",
            "name": data["name"],
            "email": data["email"],
            "phone": "+64211234000",
            "language": lang,
            "pricing": {"totalPrice": 95.00}
        }
        
        response = session.post(f"{BACKEND_URL}/bookings", json=booking_data)
        
        if response.status_code == 200:
            booking = response.json()
            print(f"✅ {lang.upper()} booking created: {booking.get('id')} for {data['name']}")
        else:
            print(f"❌ {lang.upper()} booking failed: {response.status_code}")
    
    return True

if __name__ == "__main__":
    print("📧 Testing Email & Multi-Language Functionality")
    print("=" * 50)
    
    # Test email flow
    test_email_flow()
    
    # Test multilanguage
    test_multilanguage_bookings()
    
    print("\n✅ Email and multilanguage tests completed!")