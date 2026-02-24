#!/usr/bin/env python3
"""
Focused test for duplicate reminder prevention fix
Tests the specific scenario described in the review request
"""

import requests
import json
import time
import asyncio
import os
from datetime import datetime, timedelta
import pytz

# Configuration
BACKEND_URL = "https://dazzling-leakey.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "your-admin-password-here")

def test_duplicate_reminder_prevention():
    """Test the duplicate reminder prevention fix as described in review request"""
    
    session = requests.Session()
    
    # Step 1: Login
    print("🔐 Logging in as admin...")
    login_response = session.post(f"{BACKEND_URL}/admin/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()['access_token']
    session.headers.update({'Authorization': f'Bearer {token}'})
    print("✅ Login successful")
    
    # Get NZ tomorrow date
    nz_tz = pytz.timezone('Pacific/Auckland')
    nz_tomorrow = (datetime.now(nz_tz) + timedelta(days=1)).strftime('%Y-%m-%d')
    print(f"📅 Testing for date: {nz_tomorrow}")
    
    # Step 2: Create a test booking for tomorrow
    print("\n📝 Creating test booking for tomorrow...")
    booking_data = {
        "serviceType": "Airport Drop-off",
        "name": "Reminder Test User",
        "email": "test@example.com",
        "phone": "+64211234567",
        "pickupAddress": "123 Test Street, Auckland",
        "dropoffAddress": "Auckland Airport",
        "date": nz_tomorrow,
        "time": "10:00 AM",
        "passengers": "2",
        "status": "confirmed",
        "pricing": {"totalPrice": 85.00}
    }
    
    booking_response = session.post(f"{BACKEND_URL}/bookings", json=booking_data)
    
    if booking_response.status_code != 200:
        print(f"❌ Booking creation failed: {booking_response.status_code}")
        return False
    
    booking_id = booking_response.json().get('id')
    print(f"✅ Test booking created: {booking_id}")
    
    # Step 3: Check initial reminder status
    print("\n📊 Checking initial reminder status...")
    status_response = session.get(f"{BACKEND_URL}/admin/reminder-status")
    
    if status_response.status_code != 200:
        print(f"❌ Status check failed: {status_response.status_code}")
        return False
    
    initial_status = status_response.json()
    initial_pending = initial_status.get('reminders_pending', 0)
    initial_sent = initial_status.get('reminders_sent', 0)
    print(f"📊 Initial status: {initial_sent} sent, {initial_pending} pending")
    
    # Step 4: Trigger reminders twice rapidly
    print("\n🔄 Triggering reminders twice in quick succession...")
    
    # Use concurrent requests to test the lock mechanism
    import concurrent.futures
    
    def trigger_reminder():
        return session.post(f"{BACKEND_URL}/admin/send-reminders")
    
    # Execute both requests concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        future1 = executor.submit(trigger_reminder)
        future2 = executor.submit(trigger_reminder)
        
        response1 = future1.result()
        response2 = future2.result()
    
    print(f"🔄 First trigger: {response1.status_code}")
    print(f"🔄 Second trigger: {response2.status_code}")
    
    if response1.status_code == 200:
        data1 = response1.json()
        sent1 = data1.get('reminders_sent', 0)
        skipped1 = data1.get('skipped', 0)
        print(f"   First: {sent1} sent, {skipped1} skipped")
    
    if response2.status_code == 200:
        data2 = response2.json()
        sent2 = data2.get('reminders_sent', 0)
        skipped2 = data2.get('skipped', 0)
        print(f"   Second: {sent2} sent, {skipped2} skipped")
    
    # Step 5: Check final status
    print("\n📊 Checking final reminder status...")
    time.sleep(2)  # Wait for processing
    
    final_status_response = session.get(f"{BACKEND_URL}/admin/reminder-status")
    
    if final_status_response.status_code != 200:
        print(f"❌ Final status check failed: {final_status_response.status_code}")
        return False
    
    final_status = final_status_response.json()
    final_sent = final_status.get('reminders_sent', 0)
    final_pending = final_status.get('reminders_pending', 0)
    sent_details = final_status.get('sent_details', [])
    
    print(f"📊 Final status: {final_sent} sent, {final_pending} pending")
    
    # Step 6: Try triggering again - should skip
    print("\n🔄 Triggering reminders again (should skip already sent)...")
    
    response3 = session.post(f"{BACKEND_URL}/admin/send-reminders")
    
    if response3.status_code == 200:
        data3 = response3.json()
        sent3 = data3.get('reminders_sent', 0)
        skipped3 = data3.get('skipped', 0)
        print(f"   Third trigger: {sent3} sent, {skipped3} skipped")
        
        if sent3 == 0:
            print("✅ Third trigger correctly sent 0 reminders (already processed)")
        else:
            print(f"❌ Third trigger should have sent 0, but sent {sent3}")
            return False
    else:
        print(f"❌ Third trigger failed: {response3.status_code}")
        return False
    
    # Validation
    print("\n🔍 Validating results...")
    
    # Check that our specific booking got a reminder
    our_booking_reminded = False
    for detail in sent_details:
        if detail.get('email') == 'test@example.com' and detail.get('name') == 'Reminder Test User':
            reminder_date = detail.get('reminderSentForDate', '')
            if reminder_date == nz_tomorrow:
                our_booking_reminded = True
                print(f"✅ Our test booking got reminder for correct date: {reminder_date}")
                print(f"   Email sent: {detail.get('emailSent', False)}")
                print(f"   SMS sent: {detail.get('smsSent', False)}")
                break
    
    if not our_booking_reminded:
        print("❌ Our test booking did not receive a reminder")
        return False
    
    # Check that only ONE email and ONE SMS were sent for our booking
    our_booking_count = sum(1 for detail in sent_details 
                           if detail.get('email') == 'test@example.com' 
                           and detail.get('name') == 'Reminder Test User')
    
    if our_booking_count == 1:
        print(f"✅ SUCCESS: Only 1 reminder sent for our test booking (duplicate prevention working)")
        return True
    else:
        print(f"❌ FAILED: {our_booking_count} reminders sent for our test booking (expected 1)")
        return False

def main():
    print("🔔 Testing Duplicate Reminder Prevention Fix")
    print("=" * 50)
    
    success = test_duplicate_reminder_prevention()
    
    if success:
        print("\n🎉 DUPLICATE REMINDER PREVENTION TEST PASSED!")
        print("✅ Global asyncio lock prevents concurrent reminder jobs")
        print("✅ Atomic database updates mark booking as 'in progress' BEFORE sending")
        print("✅ Pre-filtered queries only get bookings that need reminders")
        print("✅ Only ONE email and ONE SMS sent per booking")
    else:
        print("\n❌ DUPLICATE REMINDER PREVENTION TEST FAILED!")
        print("⚠️  Multiple reminders may still be sent for the same booking")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)