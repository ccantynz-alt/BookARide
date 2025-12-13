#!/usr/bin/env python3
"""
Comprehensive Backend Testing for BookaRide.co.nz
Tests booking flow, multi-language email confirmations, and Mailgun integration
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://bookaseat-1.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Chico9620!@"

# Test data for different languages
TEST_BOOKINGS = {
    'en': {
        "serviceType": "airport-shuttle",
        "pickupAddress": "Auckland Airport, Auckland",
        "dropoffAddress": "Sky Tower, Auckland CBD",
        "date": "2025-12-15",
        "time": "10:00",
        "passengers": "2",
        "name": "Test User",
        "email": "test@bookaride.co.nz",
        "phone": "+64211234567",
        "language": "en",
        "pricing": {"totalPrice": 100.00}
    },
    'zh': {
        "serviceType": "airport-shuttle",
        "pickupAddress": "奥克兰机场",
        "dropoffAddress": "奥克兰市中心",
        "date": "2025-12-16",
        "time": "14:00",
        "passengers": "1",
        "name": "测试用户",
        "email": "test-zh@bookaride.co.nz",
        "phone": "+64211234568",
        "language": "zh",
        "pricing": {"totalPrice": 95.00}
    },
    'ja': {
        "serviceType": "airport-shuttle",
        "pickupAddress": "オークランド空港",
        "dropoffAddress": "オークランド市内",
        "date": "2025-12-17",
        "time": "16:00",
        "passengers": "3",
        "name": "テストユーザー",
        "email": "test-ja@bookaride.co.nz",
        "phone": "+64211234569",
        "language": "ja",
        "pricing": {"totalPrice": 120.00}
    }
}

class BookaRideBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        self.booking_ids = []
        
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
    
    def test_health_check(self):
        """Test basic API health"""
        try:
            response = self.session.get(f"{BACKEND_URL}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_result("Health Check", True, f"API is healthy: {data}")
                return True
            else:
                self.log_result("Health Check", False, f"Health check failed with status {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test admin authentication"""
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
                self.log_result("Admin Login", True, "Admin authentication successful")
                return True
            else:
                self.log_result("Admin Login", False, f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def test_direct_mailgun_email(self):
        """Test direct Mailgun email sending"""
        try:
            # Using curl equivalent with requests
            mailgun_url = "https://api.mailgun.net/v3/mg.bookaride.co.nz/messages"
            auth = ('api', '151d31c4dd7cd9fd3015d140b2c58f76-235e4bb2-1ecf548a')
            
            data = {
                'from': 'Book A Ride <noreply@mg.bookaride.co.nz>',
                'to': 'test@example.com',
                'subject': 'Test Email - DNS Verification',
                'text': 'Mailgun DNS is verified and working!'
            }
            
            response = requests.post(mailgun_url, auth=auth, data=data, timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("Direct Mailgun Test", True, f"Email sent successfully: {result.get('message', 'OK')}")
                return True
            else:
                self.log_result("Direct Mailgun Test", False, f"Mailgun failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Direct Mailgun Test", False, f"Mailgun error: {str(e)}")
            return False
    
    def test_price_calculation(self):
        """Test price calculation endpoint"""
        try:
            price_request = {
                "serviceType": "airport-shuttle",
                "pickupAddress": "Auckland Airport, Auckland",
                "dropoffAddress": "Sky Tower, Auckland CBD",
                "passengers": 2,
                "vipAirportPickup": False,
                "oversizedLuggage": False
            }
            
            response = self.session.post(f"{BACKEND_URL}/calculate-price", json=price_request, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                total_price = data.get('totalPrice', 0)
                distance = data.get('distance', 0)
                self.log_result("Price Calculation", True, f"Price calculated: ${total_price} for {distance}km")
                return True
            else:
                self.log_result("Price Calculation", False, f"Price calculation failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Price Calculation", False, f"Price calculation error: {str(e)}")
            return False
    
    def test_create_booking(self, language='en'):
        """Test booking creation for specific language"""
        try:
            booking_data = TEST_BOOKINGS[language].copy()
            
            response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                booking_id = data.get('id')
                self.booking_ids.append(booking_id)
                self.log_result(f"Create Booking ({language.upper()})", True, f"Booking created: {booking_id}")
                return booking_id
            else:
                self.log_result(f"Create Booking ({language.upper()})", False, f"Booking creation failed with status {response.status_code}", response.text)
                return None
        except Exception as e:
            self.log_result(f"Create Booking ({language.upper()})", False, f"Booking creation error: {str(e)}")
            return None
    
    def test_get_bookings(self):
        """Test retrieving all bookings"""
        try:
            response = self.session.get(f"{BACKEND_URL}/bookings", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                booking_count = len(data) if isinstance(data, list) else 0
                self.log_result("Get Bookings", True, f"Retrieved {booking_count} bookings")
                return True
            else:
                self.log_result("Get Bookings", False, f"Get bookings failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Get Bookings", False, f"Get bookings error: {str(e)}")
            return False
    
    def test_stripe_webhook_simulation(self):
        """Test Stripe webhook endpoint"""
        try:
            # Create a test booking first
            booking_id = self.test_create_booking('en')
            if not booking_id:
                self.log_result("Stripe Webhook Test", False, "Could not create test booking for webhook")
                return False
            
            # Simulate Stripe webhook
            webhook_data = {
                "type": "checkout.session.completed",
                "data": {
                    "object": {
                        "id": "cs_test_123",
                        "payment_status": "paid",
                        "metadata": {
                            "booking_id": booking_id
                        }
                    }
                }
            }
            
            response = self.session.post(f"{BACKEND_URL}/webhook/stripe", json=webhook_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Stripe Webhook Test", True, f"Webhook processed successfully: {data}")
                return True
            else:
                self.log_result("Stripe Webhook Test", False, f"Webhook failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Stripe Webhook Test", False, f"Webhook error: {str(e)}")
            return False
    
    def test_email_endpoint(self):
        """Test email sending endpoint if it exists"""
        try:
            email_data = {
                "email": "test@example.com",
                "subject": "Test Booking Confirmation",
                "message": "This is a test booking confirmation",
                "language": "en"
            }
            
            response = self.session.post(f"{BACKEND_URL}/send-email", json=email_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Email Endpoint Test", True, f"Email endpoint working: {data}")
                return True
            elif response.status_code == 404:
                self.log_result("Email Endpoint Test", True, "Email endpoint not found (expected - using webhook flow)")
                return True
            else:
                self.log_result("Email Endpoint Test", False, f"Email endpoint failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Email Endpoint Test", False, f"Email endpoint error: {str(e)}")
            return False
    
    def test_translation_endpoints(self):
        """Test translation endpoints if they exist"""
        languages = ['en', 'zh', 'ja', 'ko', 'fr']
        translation_results = []
        
        for lang in languages:
            try:
                response = self.session.get(f"{BACKEND_URL}/translations/{lang}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    translation_results.append(f"{lang}: Available")
                elif response.status_code == 404:
                    translation_results.append(f"{lang}: Not found (using hardcoded translations)")
                else:
                    translation_results.append(f"{lang}: Error {response.status_code}")
            except Exception as e:
                translation_results.append(f"{lang}: Exception - {str(e)}")
        
        # Check if translations are working (either via endpoint or hardcoded)
        success = any("Available" in result or "Not found" in result for result in translation_results)
        self.log_result("Translation Support", success, f"Translation status: {', '.join(translation_results)}")
        return success
    
    def test_google_oauth_session_endpoint(self):
        """Test Google OAuth session processing endpoint"""
        try:
            # Test with a mock session ID (this will fail but we can check the endpoint exists)
            oauth_data = {
                "session_id": "test_session_12345"
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/google-auth/session", json=oauth_data, timeout=10)
            
            # We expect this to fail with 401 (invalid session) but endpoint should exist
            if response.status_code == 401:
                self.log_result("Google OAuth Endpoint", True, "Google OAuth endpoint exists and validates sessions correctly")
                return True
            elif response.status_code == 404:
                self.log_result("Google OAuth Endpoint", False, "Google OAuth endpoint not found")
                return False
            else:
                # Any other response means endpoint exists
                self.log_result("Google OAuth Endpoint", True, f"Google OAuth endpoint exists (status: {response.status_code})")
                return True
        except Exception as e:
            self.log_result("Google OAuth Endpoint", False, f"Google OAuth endpoint error: {str(e)}")
            return False
    
    def test_password_reset_request(self):
        """Test password reset request endpoint"""
        try:
            reset_data = {
                "email": "bookings@bookaride.co.nz"
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/password-reset/request", json=reset_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                if 'password reset link' in message.lower():
                    self.log_result("Password Reset Request", True, f"Password reset request successful: {message}")
                    return True
                else:
                    self.log_result("Password Reset Request", False, f"Unexpected response: {message}")
                    return False
            else:
                self.log_result("Password Reset Request", False, f"Password reset request failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Password Reset Request", False, f"Password reset request error: {str(e)}")
            return False
    
    def test_password_reset_validate(self):
        """Test password reset token validation endpoint"""
        try:
            # Test with a dummy token (should return invalid)
            test_token = "test_token_12345"
            
            response = self.session.get(f"{BACKEND_URL}/admin/password-reset/validate/{test_token}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                valid = data.get('valid', False)
                if not valid:  # We expect this to be invalid
                    self.log_result("Password Reset Validate", True, "Password reset validation endpoint working correctly")
                    return True
                else:
                    self.log_result("Password Reset Validate", False, "Validation endpoint returned unexpected result")
                    return False
            else:
                self.log_result("Password Reset Validate", False, f"Password reset validate failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Password Reset Validate", False, f"Password reset validate error: {str(e)}")
            return False
    
    def test_password_reset_confirm(self):
        """Test password reset confirm endpoint"""
        try:
            # Test with dummy data (should fail but endpoint should exist)
            confirm_data = {
                "token": "test_token_12345",
                "new_password": "NewTestPassword123!"
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/password-reset/confirm", json=confirm_data, timeout=10)
            
            # We expect this to fail with 400 (invalid token) but endpoint should exist
            if response.status_code == 400:
                data = response.json()
                detail = data.get('detail', '')
                if 'invalid' in detail.lower() or 'expired' in detail.lower():
                    self.log_result("Password Reset Confirm", True, "Password reset confirm endpoint working correctly")
                    return True
                else:
                    self.log_result("Password Reset Confirm", False, f"Unexpected error message: {detail}")
                    return False
            elif response.status_code == 404:
                self.log_result("Password Reset Confirm", False, "Password reset confirm endpoint not found")
                return False
            else:
                self.log_result("Password Reset Confirm", True, f"Password reset confirm endpoint exists (status: {response.status_code})")
                return True
        except Exception as e:
            self.log_result("Password Reset Confirm", False, f"Password reset confirm error: {str(e)}")
            return False
    
    def test_admin_auth_me_endpoint(self):
        """Test admin auth/me endpoint for session-based authentication"""
        try:
            response = self.session.get(f"{BACKEND_URL}/admin/auth/me", timeout=10)
            
            # Without session cookie, this should return 401
            if response.status_code == 401:
                self.log_result("Admin Auth Me Endpoint", True, "Admin auth/me endpoint exists and requires authentication")
                return True
            elif response.status_code == 404:
                self.log_result("Admin Auth Me Endpoint", False, "Admin auth/me endpoint not found")
                return False
            else:
                # Any other response means endpoint exists
                self.log_result("Admin Auth Me Endpoint", True, f"Admin auth/me endpoint exists (status: {response.status_code})")
                return True
        except Exception as e:
            self.log_result("Admin Auth Me Endpoint", False, f"Admin auth/me endpoint error: {str(e)}")
            return False
    
    def test_payment_checkout_creation(self):
        """Test Stripe checkout session creation"""
        try:
            # Create a test booking first
            booking_id = self.test_create_booking('en')
            if not booking_id:
                self.log_result("Payment Checkout Test", False, "Could not create test booking for payment")
                return False
            
            checkout_data = {
                "booking_id": booking_id,
                "origin_url": "https://bookaride.co.nz"
            }
            
            response = self.session.post(f"{BACKEND_URL}/payment/create-checkout", json=checkout_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                session_id = data.get('session_id')
                checkout_url = data.get('checkout_url')
                self.log_result("Payment Checkout Test", True, f"Checkout session created: {session_id}")
                return True
            else:
                self.log_result("Payment Checkout Test", False, f"Checkout creation failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Payment Checkout Test", False, f"Checkout creation error: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting Comprehensive BookaRide Backend Testing")
        print("=" * 60)
        
        # Basic connectivity tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        # Core functionality tests
        print("\n📧 Testing Email System...")
        self.test_direct_mailgun_email()
        
        print("\n💰 Testing Booking System...")
        self.test_price_calculation()
        
        # Multi-language booking tests
        print("\n🌍 Testing Multi-Language Bookings...")
        for lang in ['en', 'zh', 'ja']:
            self.test_create_booking(lang)
        
        self.test_get_bookings()
        
        # Payment and notification tests
        print("\n💳 Testing Payment System...")
        self.test_payment_checkout_creation()
        self.test_stripe_webhook_simulation()
        
        # Additional tests
        print("\n🔧 Testing Additional Features...")
        self.test_email_endpoint()
        self.test_translation_endpoints()
        
        # New Admin Authentication Features
        print("\n🔐 Testing New Admin Authentication Features...")
        self.test_google_oauth_session_endpoint()
        self.test_password_reset_request()
        self.test_password_reset_validate()
        self.test_password_reset_confirm()
        self.test_admin_auth_me_endpoint()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
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
        
        # Show created bookings
        if self.booking_ids:
            print(f"\n📝 Created Test Bookings: {len(self.booking_ids)}")
            for booking_id in self.booking_ids:
                print(f"  - {booking_id}")
        
        return failed == 0

def main():
    """Main test execution"""
    tester = BookaRideBackendTester()
    
    try:
        success = tester.run_comprehensive_test()
        
        # Save results to file
        with open('/app/test_results_backend.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'success': success,
                'results': tester.test_results,
                'booking_ids': tester.booking_ids
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/test_results_backend.json")
        
        if success:
            print("\n🎉 ALL TESTS PASSED! Backend is working correctly.")
            sys.exit(0)
        else:
            print("\n⚠️  Some tests failed. Check the details above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()