#!/usr/bin/env python3
"""
Test email functionality directly by calling the email functions
"""

import sys
import os
sys.path.append('/app/backend')

# Import the email functions from server.py
from server import send_booking_confirmation_email, send_via_mailgun, EMAIL_TRANSLATIONS

def test_email_functions():
    """Test email functions directly"""
    
    # Test booking data
    test_booking = {
        'id': 'test-booking-12345',
        'name': 'Test User Email',
        'email': 'test-email@bookaride.co.nz',
        'phone': '+64211234567',
        'serviceType': 'airport-shuttle',
        'pickupAddress': 'Auckland Airport, Auckland',
        'dropoffAddress': 'Queen Street, Auckland CBD',
        'date': '2025-12-20',
        'time': '15:30',
        'passengers': '2',
        'language': 'en',
        'pricing': {'totalPrice': 105.50}
    }
    
    print("📧 Testing Email Functions Directly")
    print("=" * 40)
    
    # Test 1: Check if EMAIL_TRANSLATIONS are loaded
    print("\n1. Testing Email Translations...")
    if 'en' in EMAIL_TRANSLATIONS:
        print("✅ English translations loaded")
        print(f"   Subject template: {EMAIL_TRANSLATIONS['en']['subject']}")
    else:
        print("❌ English translations not found")
    
    if 'zh' in EMAIL_TRANSLATIONS:
        print("✅ Chinese translations loaded")
        print(f"   Subject template: {EMAIL_TRANSLATIONS['zh']['subject']}")
    else:
        print("❌ Chinese translations not found")
    
    # Test 2: Test Mailgun function directly
    print("\n2. Testing Mailgun Email Function...")
    try:
        result = send_via_mailgun(test_booking)
        if result:
            print("✅ Mailgun email function executed successfully")
        else:
            print("⚠️ Mailgun email function returned False (check credentials)")
    except Exception as e:
        print(f"❌ Mailgun email function error: {str(e)}")
    
    # Test 3: Test main email function
    print("\n3. Testing Main Email Function...")
    try:
        result = send_booking_confirmation_email(test_booking)
        if result:
            print("✅ Main email function executed successfully")
        else:
            print("⚠️ Main email function returned False")
    except Exception as e:
        print(f"❌ Main email function error: {str(e)}")
    
    # Test 4: Test different languages
    print("\n4. Testing Multi-Language Emails...")
    languages = ['en', 'zh', 'ja', 'ko', 'fr']
    
    for lang in languages:
        test_booking_lang = test_booking.copy()
        test_booking_lang['language'] = lang
        test_booking_lang['email'] = f'test-{lang}@bookaride.co.nz'
        
        try:
            result = send_via_mailgun(test_booking_lang)
            status = "✅" if result else "⚠️"
            print(f"   {status} {lang.upper()} email test: {'Success' if result else 'Failed'}")
        except Exception as e:
            print(f"   ❌ {lang.upper()} email test error: {str(e)}")

if __name__ == "__main__":
    test_email_functions()