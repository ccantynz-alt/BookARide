#!/usr/bin/env python3
"""
Test SMS functionality
"""

import sys
import os
sys.path.append('/app/backend')

from server import send_booking_confirmation_sms

def test_sms_function():
    """Test SMS function"""
    
    test_booking = {
        'id': 'test-sms-12345',
        'name': 'SMS Test User',
        'phone': '+64211234567',
        'serviceType': 'airport-shuttle',
        'pickupAddress': 'Auckland Airport, Auckland',
        'dropoffAddress': 'Queen Street, Auckland CBD',
        'date': '2025-12-20',
        'time': '15:30',
        'totalPrice': 105.50
    }
    
    print("📱 Testing SMS Function")
    print("=" * 30)
    
    try:
        result = send_booking_confirmation_sms(test_booking)
        if result:
            print("✅ SMS function executed successfully")
        else:
            print("⚠️ SMS function returned False (check Twilio credentials)")
    except Exception as e:
        print(f"❌ SMS function error: {str(e)}")

if __name__ == "__main__":
    test_sms_function()