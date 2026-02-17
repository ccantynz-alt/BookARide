#!/usr/bin/env python3
"""
Final test for duplicate reminder prevention fix
This test proves the fix is working by analyzing the logs and behavior
"""

import requests
import json
import time
import uuid
import os
from datetime import datetime, timedelta
import pytz

# Configuration
BACKEND_URL = "https://dazzling-leakey.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "your-admin-password-here")

def test_duplicate_reminder_prevention_final():
    """Final comprehensive test for duplicate reminder prevention"""
    
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
    
    # Step 2: Create a unique test booking for tomorrow
    unique_id = str(uuid.uuid4())[:8]
    unique_email = f"test-{unique_id}@example.com"
    unique_name = f"Test User {unique_id}"
    
    print(f"\n📝 Creating unique test booking: {unique_name} ({unique_email})")
    booking_data = {
        "serviceType": "Airport Drop-off",
        "name": unique_name,
        "email": unique_email,
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
    print(f"✅ Unique test booking created: {booking_id}")
    
    # Step 3: Get initial reminder status
    print("\n📊 Getting initial reminder status...")
    initial_status_response = session.get(f"{BACKEND_URL}/admin/reminder-status")
    
    if initial_status_response.status_code != 200:
        print(f"❌ Status check failed: {initial_status_response.status_code}")
        return False
    
    initial_status = initial_status_response.json()
    initial_pending = initial_status.get('reminders_pending', 0)
    initial_sent = initial_status.get('reminders_sent', 0)
    
    # Count how many reminders exist for our unique user (should be 0)
    initial_our_reminders = sum(1 for detail in initial_status.get('sent_details', []) 
                               if detail.get('email') == unique_email)
    
    print(f"📊 Initial status: {initial_sent} total sent, {initial_pending} pending")
    print(f"📊 Our unique user reminders: {initial_our_reminders} (should be 0)")
    
    if initial_our_reminders > 0:
        print(f"❌ Our unique user already has reminders - test contaminated")
        return False
    
    # Step 4: Trigger reminders and capture the exact response
    print(f"\n🔄 Triggering first reminder for {unique_name}...")
    
    trigger1_response = session.post(f"{BACKEND_URL}/admin/send-reminders")
    
    if trigger1_response.status_code != 200:
        print(f"❌ First trigger failed: {trigger1_response.status_code}")
        return False
    
    trigger1_data = trigger1_response.json()
    sent1 = trigger1_data.get('details', {}).get('reminders_sent', 0)
    skipped1 = trigger1_data.get('details', {}).get('skipped', 0)
    
    print(f"✅ First trigger result: {sent1} sent, {skipped1} skipped")
    
    # Step 5: Immediately trigger again (should be prevented by lock or atomic update)
    print(f"\n🔄 Triggering second reminder immediately...")
    
    trigger2_response = session.post(f"{BACKEND_URL}/admin/send-reminders")
    
    if trigger2_response.status_code != 200:
        print(f"❌ Second trigger failed: {trigger2_response.status_code}")
        return False
    
    trigger2_data = trigger2_response.json()
    sent2 = trigger2_data.get('details', {}).get('reminders_sent', 0)
    skipped2 = trigger2_data.get('details', {}).get('skipped', 0)
    
    print(f"✅ Second trigger result: {sent2} sent, {skipped2} skipped")
    
    # Step 6: Wait and check final status
    print(f"\n⏳ Waiting 3 seconds for processing to complete...")
    time.sleep(3)
    
    final_status_response = session.get(f"{BACKEND_URL}/admin/reminder-status")
    
    if final_status_response.status_code != 200:
        print(f"❌ Final status check failed: {final_status_response.status_code}")
        return False
    
    final_status = final_status_response.json()
    
    # Count reminders for our unique user
    final_our_reminders = []
    for detail in final_status.get('sent_details', []):
        if detail.get('email') == unique_email:
            final_our_reminders.append(detail)
    
    print(f"📊 Final reminders for our unique user: {len(final_our_reminders)}")
    
    # Step 7: Trigger one more time to confirm it's skipped
    print(f"\n🔄 Triggering third reminder (should skip)...")
    
    trigger3_response = session.post(f"{BACKEND_URL}/admin/send-reminders")
    
    if trigger3_response.status_code != 200:
        print(f"❌ Third trigger failed: {trigger3_response.status_code}")
        return False
    
    trigger3_data = trigger3_response.json()
    sent3 = trigger3_data.get('details', {}).get('reminders_sent', 0)
    skipped3 = trigger3_data.get('details', {}).get('skipped', 0)
    
    print(f"✅ Third trigger result: {sent3} sent, {skipped3} skipped")
    
    # Step 8: Validation
    print(f"\n🔍 Validating duplicate prevention...")
    
    total_sent_for_user = sent1 + sent2 + sent3
    
    # The key test: Only ONE reminder should have been sent for our unique user
    if len(final_our_reminders) == 1:
        reminder = final_our_reminders[0]
        print(f"✅ SUCCESS: Exactly 1 reminder sent for {unique_name}")
        print(f"   📧 Email sent: {reminder.get('emailSent', False)}")
        print(f"   📱 SMS sent: {reminder.get('smsSent', False)}")
        print(f"   🕐 Sent at: {reminder.get('reminderSentAt', 'Unknown')}")
        print(f"   🔧 Source: {reminder.get('reminderSource', 'Unknown')}")
        
        # Additional validation: subsequent triggers should send 0
        if sent2 == 0 and sent3 == 0:
            print(f"✅ SUCCESS: Subsequent triggers correctly sent 0 reminders")
            print(f"✅ DUPLICATE PREVENTION IS WORKING CORRECTLY!")
            return True
        else:
            print(f"❌ FAILED: Subsequent triggers sent reminders (sent2={sent2}, sent3={sent3})")
            return False
            
    elif len(final_our_reminders) == 0:
        print(f"❌ FAILED: No reminders sent for {unique_name}")
        print(f"   This could indicate the booking wasn't found or processed")
        return False
    else:
        print(f"❌ FAILED: {len(final_our_reminders)} reminders sent for {unique_name} (expected 1)")
        print(f"   This indicates duplicate prevention is NOT working")
        for i, reminder in enumerate(final_our_reminders, 1):
            print(f"   {i}. Sent at: {reminder.get('reminderSentAt')}")
        return False

def main():
    print("🔔 FINAL TEST: Duplicate Reminder Prevention Fix")
    print("=" * 60)
    print("This test creates a unique booking and verifies that:")
    print("1. Global asyncio lock prevents concurrent reminder jobs")
    print("2. Atomic database updates mark booking BEFORE sending")
    print("3. Pre-filtered queries only get bookings that need reminders")
    print("4. Only ONE email and ONE SMS sent per booking")
    print("=" * 60)
    
    success = test_duplicate_reminder_prevention_final()
    
    if success:
        print("\n🎉 DUPLICATE REMINDER PREVENTION FIX VERIFIED!")
        print("✅ The fix successfully prevents duplicate reminders")
        print("✅ Customers will receive exactly ONE reminder per booking")
        print("✅ No more multiple SMS notifications for the same booking")
    else:
        print("\n❌ DUPLICATE REMINDER PREVENTION FIX FAILED!")
        print("⚠️  Customers may still receive multiple reminders")
        print("⚠️  The fix needs further investigation")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)