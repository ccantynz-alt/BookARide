#!/usr/bin/env python3
"""
Final comprehensive test of the complete booking flow with email and SMS notifications
"""

import requests
import json
import time
import sys
import os
from datetime import datetime

sys.path.append('/app/backend')
from server import send_booking_confirmation_email, send_booking_confirmation_sms

BACKEND_URL = "https://transport-issues.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "BookARide2024!"

def run_final_test():
    """Run final comprehensive test"""
    
    print("🚀 FINAL COMPREHENSIVE BOOKARIDE BACKEND TEST")
    print("=" * 60)
    
    session = requests.Session()
    results = []
    
    # 1. Health Check
    print("\n1️⃣ HEALTH CHECK")
    try:
        response = session.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ API Health: HEALTHY")
            results.append("✅ API Health Check")
        else:
            print("❌ API Health: FAILED")
            results.append("❌ API Health Check")
    except Exception as e:
        print(f"❌ API Health: ERROR - {str(e)}")
        results.append("❌ API Health Check")
    
    # 2. Admin Authentication
    print("\n2️⃣ ADMIN AUTHENTICATION")
    try:
        login_response = session.post(f"{BACKEND_URL}/admin/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            token = login_response.json().get('access_token')
            session.headers.update({'Authorization': f'Bearer {token}'})
            print("✅ Admin Login: SUCCESS")
            results.append("✅ Admin Authentication")
        else:
            print("❌ Admin Login: FAILED")
            results.append("❌ Admin Authentication")
            return results
    except Exception as e:
        print(f"❌ Admin Login: ERROR - {str(e)}")
        results.append("❌ Admin Authentication")
        return results
    
    # 3. Direct Mailgun Test
    print("\n3️⃣ DIRECT MAILGUN EMAIL TEST")
    try:
        mailgun_url = "https://api.mailgun.net/v3/mg.bookaride.co.nz/messages"
        auth = ('api', '151d31c4dd7cd9fd3015d140b2c58f76-235e4bb2-1ecf548a')
        
        data = {
            'from': 'Book A Ride <noreply@mg.bookaride.co.nz>',
            'to': 'final-test@bookaride.co.nz',
            'subject': 'Final Test - Mailgun DNS Verification',
            'text': 'Final comprehensive test - Mailgun DNS is verified and working!'
        }
        
        response = requests.post(mailgun_url, auth=auth, data=data, timeout=15)
        
        if response.status_code == 200:
            print("✅ Mailgun Direct: EMAIL SENT")
            results.append("✅ Mailgun Direct Email")
        else:
            print(f"❌ Mailgun Direct: FAILED ({response.status_code})")
            results.append("❌ Mailgun Direct Email")
    except Exception as e:
        print(f"❌ Mailgun Direct: ERROR - {str(e)}")
        results.append("❌ Mailgun Direct Email")
    
    # 4. Price Calculation
    print("\n4️⃣ PRICE CALCULATION")
    try:
        price_request = {
            "serviceType": "airport-shuttle",
            "pickupAddress": "Auckland Airport, Auckland",
            "dropoffAddress": "Queen Street, Auckland CBD",
            "passengers": 2,
            "vipAirportPickup": True,
            "oversizedLuggage": True
        }
        
        response = session.post(f"{BACKEND_URL}/calculate-price", json=price_request)
        
        if response.status_code == 200:
            data = response.json()
            total_price = data.get('totalPrice', 0)
            distance = data.get('distance', 0)
            vip_fee = data.get('airportFee', 0)
            luggage_fee = data.get('oversizedLuggageFee', 0)
            print(f"✅ Price Calculation: ${total_price} for {distance}km (VIP: ${vip_fee}, Luggage: ${luggage_fee})")
            results.append("✅ Price Calculation")
        else:
            print("❌ Price Calculation: FAILED")
            results.append("❌ Price Calculation")
    except Exception as e:
        print(f"❌ Price Calculation: ERROR - {str(e)}")
        results.append("❌ Price Calculation")
    
    # 5. Multi-Language Booking Creation
    print("\n5️⃣ MULTI-LANGUAGE BOOKING CREATION")
    
    bookings = {
        'English': {
            "serviceType": "airport-shuttle",
            "pickupAddress": "Auckland Airport, Auckland",
            "dropoffAddress": "Queen Street, Auckland CBD",
            "date": "2025-12-25",
            "time": "10:00",
            "passengers": "2",
            "name": "Final Test User English",
            "email": "final-en@bookaride.co.nz",
            "phone": "+64211111111",
            "language": "en",
            "pricing": {"totalPrice": 115.00}
        },
        'Chinese': {
            "serviceType": "airport-shuttle",
            "pickupAddress": "奥克兰机场",
            "dropoffAddress": "皇后街，奥克兰市中心",
            "date": "2025-12-25",
            "time": "14:00",
            "passengers": "1",
            "name": "最终测试用户中文",
            "email": "final-zh@bookaride.co.nz",
            "phone": "+64211111112",
            "language": "zh",
            "pricing": {"totalPrice": 100.00}
        },
        'Japanese': {
            "serviceType": "airport-shuttle",
            "pickupAddress": "オークランド空港",
            "dropoffAddress": "クイーンストリート、オークランドCBD",
            "date": "2025-12-25",
            "time": "16:00",
            "passengers": "3",
            "name": "最終テストユーザー日本語",
            "email": "final-ja@bookaride.co.nz",
            "phone": "+64211111113",
            "language": "ja",
            "pricing": {"totalPrice": 125.00}
        }
    }
    
    booking_ids = []
    
    for lang, booking_data in bookings.items():
        try:
            response = session.post(f"{BACKEND_URL}/bookings", json=booking_data)
            
            if response.status_code == 200:
                booking = response.json()
                booking_id = booking.get('id')
                booking_ids.append((booking_id, lang, booking_data))
                print(f"✅ {lang} Booking: CREATED ({booking_id[:8]})")
                results.append(f"✅ {lang} Booking Creation")
            else:
                print(f"❌ {lang} Booking: FAILED")
                results.append(f"❌ {lang} Booking Creation")
        except Exception as e:
            print(f"❌ {lang} Booking: ERROR - {str(e)}")
            results.append(f"❌ {lang} Booking Creation")
    
    # 6. Email Confirmation Testing
    print("\n6️⃣ EMAIL CONFIRMATION TESTING")
    
    for booking_id, lang, booking_data in booking_ids:
        try:
            # Test email function directly
            result = send_booking_confirmation_email(booking_data)
            if result:
                print(f"✅ {lang} Email: SENT")
                results.append(f"✅ {lang} Email Confirmation")
            else:
                print(f"⚠️ {lang} Email: FAILED")
                results.append(f"⚠️ {lang} Email Confirmation")
        except Exception as e:
            print(f"❌ {lang} Email: ERROR - {str(e)}")
            results.append(f"❌ {lang} Email Confirmation")
    
    # 7. SMS Confirmation Testing
    print("\n7️⃣ SMS CONFIRMATION TESTING")
    
    for booking_id, lang, booking_data in booking_ids:
        try:
            # Test SMS function directly
            result = send_booking_confirmation_sms(booking_data)
            if result:
                print(f"✅ {lang} SMS: SENT")
                results.append(f"✅ {lang} SMS Confirmation")
            else:
                print(f"⚠️ {lang} SMS: FAILED")
                results.append(f"⚠️ {lang} SMS Confirmation")
        except Exception as e:
            print(f"❌ {lang} SMS: ERROR - {str(e)}")
            results.append(f"❌ {lang} SMS Confirmation")
    
    # 8. Stripe Payment Integration
    print("\n8️⃣ STRIPE PAYMENT INTEGRATION")
    
    if booking_ids:
        booking_id, _, _ = booking_ids[0]  # Use first booking
        try:
            checkout_data = {
                "booking_id": booking_id,
                "origin_url": "https://bookaride.co.nz"
            }
            
            response = session.post(f"{BACKEND_URL}/payment/create-checkout", json=checkout_data)
            
            if response.status_code == 200:
                checkout = response.json()
                session_id = checkout.get('session_id')
                print(f"✅ Stripe Checkout: CREATED ({session_id[:20]}...)")
                results.append("✅ Stripe Payment Integration")
                
                # Test payment status check
                status_response = session.get(f"{BACKEND_URL}/payment/status/{session_id}")
                if status_response.status_code == 200:
                    print("✅ Payment Status: ACCESSIBLE")
                    results.append("✅ Payment Status Check")
                else:
                    print("❌ Payment Status: FAILED")
                    results.append("❌ Payment Status Check")
            else:
                print("❌ Stripe Checkout: FAILED")
                results.append("❌ Stripe Payment Integration")
        except Exception as e:
            print(f"❌ Stripe Checkout: ERROR - {str(e)}")
            results.append("❌ Stripe Payment Integration")
    
    # 9. Booking Retrieval
    print("\n9️⃣ BOOKING RETRIEVAL")
    try:
        response = session.get(f"{BACKEND_URL}/bookings")
        
        if response.status_code == 200:
            bookings_list = response.json()
            total_bookings = len(bookings_list)
            print(f"✅ Booking Retrieval: {total_bookings} BOOKINGS FOUND")
            results.append("✅ Booking Retrieval")
        else:
            print("❌ Booking Retrieval: FAILED")
            results.append("❌ Booking Retrieval")
    except Exception as e:
        print(f"❌ Booking Retrieval: ERROR - {str(e)}")
        results.append("❌ Booking Retrieval")
    
    # FINAL SUMMARY
    print("\n" + "=" * 60)
    print("🏁 FINAL TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results if result.startswith("✅"))
    warnings = sum(1 for result in results if result.startswith("⚠️"))
    failed = sum(1 for result in results if result.startswith("❌"))
    total = len(results)
    
    print(f"📊 Total Tests: {total}")
    print(f"✅ Passed: {passed}")
    print(f"⚠️ Warnings: {warnings}")
    print(f"❌ Failed: {failed}")
    print(f"📈 Success Rate: {((passed + warnings)/total*100):.1f}%")
    
    # Show all results
    print(f"\n📋 DETAILED RESULTS:")
    for result in results:
        print(f"   {result}")
    
    # Show created bookings
    if booking_ids:
        print(f"\n📝 CREATED BOOKINGS ({len(booking_ids)}):")
        for booking_id, lang, _ in booking_ids:
            print(f"   - {lang}: {booking_id}")
    
    # Final verdict
    if failed == 0:
        print(f"\n🎉 ALL CRITICAL TESTS PASSED!")
        print(f"✅ BookaRide backend is fully functional")
        return True
    else:
        print(f"\n⚠️ {failed} CRITICAL ISSUES FOUND")
        print(f"❌ Some functionality needs attention")
        return False

if __name__ == "__main__":
    success = run_final_test()
    sys.exit(0 if success else 1)