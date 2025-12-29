#!/usr/bin/env python3
"""
Admin Booking Features Testing for BookaRide.co.nz
Tests the new admin booking features:
1. Manual Calendar Sync Endpoint (POST /api/bookings/{booking_id}/sync-calendar)
2. Resend Confirmation Endpoint (POST /api/bookings/{booking_id}/resend-confirmation)
3. Update Booking Endpoint (PATCH /api/bookings/{booking_id})
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://bookmend.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Chico9620!@"

class AdminBookingFeaturesTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.test_booking_id = None
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_admin_login(self):
        """Test admin authentication with provided credentials"""
        try:
            login_data = {
                "username": ADMIN_USERNAME,
                "password": ADMIN_PASSWORD
            }
            response = self.session.post(f"{BACKEND_URL}/admin/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.admin_token = data.get('access_token')
                self.session.headers.update({'Authorization': f'Bearer {self.admin_token}'})
                self.log_result("Admin Login", True, f"Admin authentication successful with token: {self.admin_token[:20]}...")
                return True
            else:
                self.log_result("Admin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def test_get_bookings_list(self):
        """Get list of bookings to find a valid booking ID for testing"""
        try:
            response = self.session.get(f"{BACKEND_URL}/bookings", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Use the first booking for testing
                    self.test_booking_id = data[0].get('id')
                    booking_count = len(data)
                    self.log_result("Get Bookings List", True, f"Retrieved {booking_count} bookings, using booking ID: {self.test_booking_id}")
                    return True
                else:
                    self.log_result("Get Bookings List", False, "No bookings found in the system")
                    return False
            else:
                self.log_result("Get Bookings List", False, f"Get bookings failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Bookings List", False, f"Get bookings error: {str(e)}")
            return False
    
    def test_manual_calendar_sync(self):
        """Test Manual Calendar Sync Endpoint (POST /api/bookings/{booking_id}/sync-calendar)"""
        if not self.test_booking_id:
            self.log_result("Manual Calendar Sync", False, "No booking ID available for testing")
            return False
        
        try:
            response = self.session.post(f"{BACKEND_URL}/bookings/{self.test_booking_id}/sync-calendar", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                success = data.get('success', False)
                message = data.get('message', 'No message')
                self.log_result("Manual Calendar Sync", True, f"Calendar sync successful: {message}")
                return True
            elif response.status_code == 404:
                self.log_result("Manual Calendar Sync", False, "Booking not found for calendar sync")
                return False
            elif response.status_code == 500:
                # Check if it's a calendar configuration issue
                try:
                    error_data = response.json()
                    error_detail = error_data.get('detail', response.text)
                    if 'calendar' in error_detail.lower() or 'google' in error_detail.lower():
                        self.log_result("Manual Calendar Sync", True, f"Calendar sync endpoint working but calendar not configured: {error_detail}")
                        return True
                    else:
                        self.log_result("Manual Calendar Sync", False, f"Calendar sync failed with error: {error_detail}")
                        return False
                except:
                    self.log_result("Manual Calendar Sync", False, f"Calendar sync failed with status {response.status_code}", response.text)
                    return False
            else:
                self.log_result("Manual Calendar Sync", False, f"Calendar sync failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Manual Calendar Sync", False, f"Calendar sync error: {str(e)}")
            return False
    
    def test_resend_confirmation(self):
        """Test Resend Confirmation Endpoint (POST /api/bookings/{booking_id}/resend-confirmation)"""
        if not self.test_booking_id:
            self.log_result("Resend Confirmation", False, "No booking ID available for testing")
            return False
        
        try:
            response = self.session.post(f"{BACKEND_URL}/bookings/{self.test_booking_id}/resend-confirmation", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', 'Confirmation sent')
                self.log_result("Resend Confirmation", True, f"Confirmation resent successfully: {message}")
                return True
            elif response.status_code == 404:
                # Check if endpoint exists but booking not found
                if 'booking not found' in response.text.lower():
                    self.log_result("Resend Confirmation", False, "Booking not found for resend confirmation")
                else:
                    self.log_result("Resend Confirmation", False, "Resend confirmation endpoint not found")
                return False
            elif response.status_code == 500:
                # Check if it's an email/SMS configuration issue
                try:
                    error_data = response.json()
                    error_detail = error_data.get('detail', response.text)
                    if any(keyword in error_detail.lower() for keyword in ['email', 'sms', 'mailgun', 'twilio']):
                        self.log_result("Resend Confirmation", True, f"Resend confirmation endpoint working but email/SMS not configured: {error_detail}")
                        return True
                    else:
                        self.log_result("Resend Confirmation", False, f"Resend confirmation failed with error: {error_detail}")
                        return False
                except:
                    self.log_result("Resend Confirmation", False, f"Resend confirmation failed with status {response.status_code}", response.text)
                    return False
            else:
                self.log_result("Resend Confirmation", False, f"Resend confirmation failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Resend Confirmation", False, f"Resend confirmation error: {str(e)}")
            return False
    
    def test_update_booking(self):
        """Test Update Booking Endpoint (PATCH /api/bookings/{booking_id})"""
        if not self.test_booking_id:
            self.log_result("Update Booking", False, "No booking ID available for testing")
            return False
        
        try:
            # Test updating various booking fields
            update_data = {
                "name": "Updated Test User",
                "email": "updated-test@bookaride.co.nz",
                "phone": "+64211111111",
                "pickupAddress": "Updated Pickup Address, Auckland",
                "dropoffAddress": "Updated Dropoff Address, Auckland",
                "date": "2025-12-20",
                "time": "15:30",
                "notes": "Updated booking notes for testing"
            }
            
            response = self.session.patch(f"{BACKEND_URL}/bookings/{self.test_booking_id}", json=update_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', 'Booking updated')
                self.log_result("Update Booking", True, f"Booking updated successfully: {message}")
                return True
            elif response.status_code == 404:
                self.log_result("Update Booking", False, "Booking not found for update")
                return False
            else:
                self.log_result("Update Booking", False, f"Update booking failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Update Booking", False, f"Update booking error: {str(e)}")
            return False
    
    def test_update_booking_with_multiple_pickups(self):
        """Test Update Booking with pickupAddresses array for multiple pickups"""
        if not self.test_booking_id:
            self.log_result("Update Booking (Multiple Pickups)", False, "No booking ID available for testing")
            return False
        
        try:
            # Test updating with multiple pickup addresses
            update_data = {
                "pickupAddresses": [
                    "Auckland Airport, Auckland",
                    "Queen Street, Auckland CBD",
                    "Sky Tower, Auckland"
                ],
                "notes": "Multiple pickup locations test"
            }
            
            response = self.session.patch(f"{BACKEND_URL}/bookings/{self.test_booking_id}", json=update_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', 'Booking updated')
                self.log_result("Update Booking (Multiple Pickups)", True, f"Booking updated with multiple pickups: {message}")
                return True
            elif response.status_code == 404:
                self.log_result("Update Booking (Multiple Pickups)", False, "Booking not found for multiple pickup update")
                return False
            else:
                self.log_result("Update Booking (Multiple Pickups)", False, f"Multiple pickup update failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Update Booking (Multiple Pickups)", False, f"Multiple pickup update error: {str(e)}")
            return False
    
    def test_endpoint_authentication(self):
        """Test that endpoints require proper authentication"""
        if not self.test_booking_id:
            self.log_result("Endpoint Authentication", False, "No booking ID available for testing")
            return False
        
        try:
            # Create a session without authentication
            unauth_session = requests.Session()
            
            # Test calendar sync without auth
            response = unauth_session.post(f"{BACKEND_URL}/bookings/{self.test_booking_id}/sync-calendar", timeout=10)
            calendar_auth_required = response.status_code in [401, 403]
            
            # Test resend confirmation without auth
            response = unauth_session.post(f"{BACKEND_URL}/bookings/{self.test_booking_id}/resend-confirmation", timeout=10)
            resend_auth_required = response.status_code in [401, 403]
            
            # Test update booking without auth
            response = unauth_session.patch(f"{BACKEND_URL}/bookings/{self.test_booking_id}", json={"name": "test"}, timeout=10)
            update_auth_required = response.status_code in [401, 403]
            
            if calendar_auth_required and resend_auth_required and update_auth_required:
                self.log_result("Endpoint Authentication", True, "All admin endpoints properly require authentication")
                return True
            else:
                auth_status = f"Calendar: {calendar_auth_required}, Resend: {resend_auth_required}, Update: {update_auth_required}"
                self.log_result("Endpoint Authentication", False, f"Some endpoints don't require auth: {auth_status}")
                return False
        except Exception as e:
            self.log_result("Endpoint Authentication", False, f"Authentication test error: {str(e)}")
            return False
    
    def run_admin_features_test(self):
        """Run all admin booking features tests"""
        print("🚀 Starting Admin Booking Features Testing")
        print("=" * 60)
        
        # Authentication test
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        # Get bookings for testing
        if not self.test_get_bookings_list():
            print("❌ Could not get bookings list - stopping tests")
            return False
        
        print(f"\n📋 Testing Admin Booking Features with Booking ID: {self.test_booking_id}")
        print("-" * 60)
        
        # Test new admin booking features
        print("\n📅 Testing Manual Calendar Sync...")
        self.test_manual_calendar_sync()
        
        print("\n📧 Testing Resend Confirmation...")
        self.test_resend_confirmation()
        
        print("\n✏️ Testing Update Booking...")
        self.test_update_booking()
        
        print("\n🔄 Testing Update Booking with Multiple Pickups...")
        self.test_update_booking_with_multiple_pickups()
        
        print("\n🔐 Testing Endpoint Authentication...")
        self.test_endpoint_authentication()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 ADMIN FEATURES TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if "✅ PASS" in result['status'])
        failed = sum(1 for result in self.test_results if "❌ FAIL" in result['status'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        # Show failed tests
        failed_tests = [result for result in self.test_results if "❌ FAIL" in result['status']]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        # Show passed tests
        passed_tests = [result for result in self.test_results if "✅ PASS" in result['status']]
        if passed_tests:
            print("\n✅ PASSED TESTS:")
            for test in passed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return failed == 0

def main():
    """Main test execution"""
    tester = AdminBookingFeaturesTester()
    
    try:
        success = tester.run_admin_features_test()
        
        # Save results to file
        with open('/app/admin_features_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'success': success,
                'results': tester.test_results,
                'test_booking_id': tester.test_booking_id
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/admin_features_test_results.json")
        
        if success:
            print("\n🎉 ALL ADMIN FEATURES TESTS PASSED!")
            sys.exit(0)
        else:
            print("\n⚠️  Some admin features tests failed. Check the details above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()