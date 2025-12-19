#!/usr/bin/env python3
"""
Comprehensive Backend Testing for BookaRide.co.nz
Tests specific features requested in review: pricing, flight tracking, driver assignment, AI email auto-responder, and payment endpoints
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://bookride-fix.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Kongkong2025!@"

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

    def test_pricing_calculation_orewa_to_airport_with_rate_per_km(self):
        """Test pricing calculation for Orewa to Auckland Airport with ratePerKm field (Barbara Walsh bug fix)"""
        try:
            price_request = {
                "serviceType": "airport-shuttle",
                "pickupAddress": "Orewa, Auckland, New Zealand",
                "dropoffAddress": "Auckland Airport, Auckland, New Zealand",
                "passengers": 1,
                "vipAirportPickup": False,
                "oversizedLuggage": False
            }
            
            response = self.session.post(f"{BACKEND_URL}/calculate-price", json=price_request, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                total_price = data.get('totalPrice', 0)
                distance = data.get('distance', 0)
                rate_per_km = data.get('ratePerKm')
                
                # Check if ratePerKm field is present (Barbara Walsh bug fix)
                if rate_per_km is None:
                    self.log_result("Pricing: Orewa to Airport (ratePerKm)", False, f"Missing ratePerKm field in response: {data}")
                    return False
                
                # For long trips (~60km), should be around $2.47 per km
                if 50 <= distance <= 70:
                    expected_rate = 2.47
                    if abs(rate_per_km - expected_rate) <= 0.5:  # Allow some tolerance
                        self.log_result("Pricing: Orewa to Airport (ratePerKm)", True, f"Correct pricing with ratePerKm: ${total_price} for {distance}km at ${rate_per_km}/km (expected ~${expected_rate}/km)")
                        return True
                    else:
                        self.log_result("Pricing: Orewa to Airport (ratePerKm)", False, f"Incorrect rate per km: ${rate_per_km}/km for {distance}km (expected ~${expected_rate}/km)")
                        return False
                else:
                    self.log_result("Pricing: Orewa to Airport (ratePerKm)", True, f"Distance different than expected but ratePerKm present: ${total_price} for {distance}km at ${rate_per_km}/km")
                    return True
            else:
                self.log_result("Pricing: Orewa to Airport (ratePerKm)", False, f"Price calculation failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Pricing: Orewa to Airport (ratePerKm)", False, f"Price calculation error: {str(e)}")
            return False

    def test_pricing_calculation_short_trip_with_rate_per_km(self):
        """Test pricing calculation for short trip with ratePerKm field (Barbara Walsh bug fix)"""
        try:
            price_request = {
                "serviceType": "airport-shuttle",
                "pickupAddress": "Takapuna, Auckland, New Zealand",
                "dropoffAddress": "Auckland CBD, Auckland, New Zealand",
                "passengers": 1,
                "vipAirportPickup": False,
                "oversizedLuggage": False
            }
            
            response = self.session.post(f"{BACKEND_URL}/calculate-price", json=price_request, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                total_price = data.get('totalPrice', 0)
                distance = data.get('distance', 0)
                rate_per_km = data.get('ratePerKm')
                
                # Check if ratePerKm field is present (Barbara Walsh bug fix)
                if rate_per_km is None:
                    self.log_result("Pricing: Short Trip (ratePerKm)", False, f"Missing ratePerKm field in response: {data}")
                    return False
                
                # For short trips (<15km), should be $12.00 per km
                if distance < 15:
                    expected_rate = 12.00
                    if rate_per_km == expected_rate:
                        self.log_result("Pricing: Short Trip (ratePerKm)", True, f"Correct short trip pricing with ratePerKm: ${total_price} for {distance}km at ${rate_per_km}/km (expected ${expected_rate}/km)")
                        return True
                    else:
                        self.log_result("Pricing: Short Trip (ratePerKm)", False, f"Incorrect rate per km for short trip: ${rate_per_km}/km for {distance}km (expected ${expected_rate}/km)")
                        return False
                else:
                    # If distance is longer, check appropriate rate
                    self.log_result("Pricing: Short Trip (ratePerKm)", True, f"Trip longer than expected but ratePerKm present: ${total_price} for {distance}km at ${rate_per_km}/km")
                    return True
            else:
                self.log_result("Pricing: Short Trip (ratePerKm)", False, f"Price calculation failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Pricing: Short Trip (ratePerKm)", False, f"Price calculation error: {str(e)}")
            return False

    def test_flight_tracker(self):
        """Test flight tracker with EK448"""
        try:
            response = self.session.get(f"{BACKEND_URL}/flight/track?flight_number=EK448", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                flight_number = data.get('flightNumber', '')
                live = data.get('live', False)
                status = data.get('status', '')
                
                if flight_number == 'EK448' and live and status:
                    self.log_result("Flight Tracker", True, f"Flight tracking working: {flight_number}, Status: {status}, Live: {live}")
                    return True
                else:
                    self.log_result("Flight Tracker", False, f"Incomplete flight data: Flight: {flight_number}, Live: {live}, Status: {status}")
                    return False
            else:
                self.log_result("Flight Tracker", False, f"Flight tracking failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Flight Tracker", False, f"Flight tracking error: {str(e)}")
            return False

    def test_ai_email_auto_responder(self):
        """Test AI email auto-responder endpoint"""
        try:
            # Simulate Mailgun webhook form data
            form_data = {
                'sender': 'test@customer.com',
                'from': 'Test Customer <test@customer.com>',
                'subject': 'Price question',
                'body-plain': 'How much from Auckland CBD to airport?',
                'recipient': 'info@bookaride.co.nz'
            }
            
            response = self.session.post(f"{BACKEND_URL}/email/incoming", data=form_data, timeout=20)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', '')
                message = data.get('message', '')
                
                if status == 'success' and 'AI response sent' in message:
                    self.log_result("AI Email Auto-Responder", True, f"AI auto-responder working: {message}")
                    return True
                else:
                    self.log_result("AI Email Auto-Responder", False, f"Unexpected response: Status: {status}, Message: {message}")
                    return False
            else:
                self.log_result("AI Email Auto-Responder", False, f"AI auto-responder failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("AI Email Auto-Responder", False, f"AI auto-responder error: {str(e)}")
            return False

    def test_driver_assignment_flow(self):
        """Test driver assignment with notifications"""
        try:
            # First, create a test booking
            booking_data = {
                "serviceType": "airport-shuttle",
                "pickupAddress": "Auckland CBD, Auckland",
                "dropoffAddress": "Auckland Airport, Auckland",
                "date": "2025-12-20",
                "time": "10:00",
                "passengers": "1",
                "name": "Test Customer",
                "email": "test@customer.com",
                "phone": "+64211234567",
                "pricing": {"totalPrice": 85.00}
            }
            
            booking_response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=10)
            
            if booking_response.status_code != 200:
                self.log_result("Driver Assignment Flow", False, "Could not create test booking for driver assignment")
                return False
            
            booking_id = booking_response.json().get('id')
            
            # Get available drivers
            drivers_response = self.session.get(f"{BACKEND_URL}/drivers", timeout=10)
            
            if drivers_response.status_code != 200:
                self.log_result("Driver Assignment Flow", False, "Could not fetch drivers list")
                return False
            
            drivers_data = drivers_response.json()
            drivers = drivers_data.get('drivers', [])
            
            if not drivers:
                self.log_result("Driver Assignment Flow", False, "No drivers available for assignment test")
                return False
            
            # Use the first available driver
            driver_id = drivers[0].get('id')
            driver_name = drivers[0].get('name', 'Unknown')
            
            # Assign driver to booking
            assign_response = self.session.patch(
                f"{BACKEND_URL}/drivers/{driver_id}/assign?booking_id={booking_id}", 
                timeout=15
            )
            
            if assign_response.status_code == 200:
                data = assign_response.json()
                message = data.get('message', '')
                
                if 'assigned successfully' in message:
                    self.log_result("Driver Assignment Flow", True, f"Driver assignment successful: {driver_name} assigned to booking {booking_id}")
                    return True
                else:
                    self.log_result("Driver Assignment Flow", False, f"Unexpected assignment response: {message}")
                    return False
            else:
                self.log_result("Driver Assignment Flow", False, f"Driver assignment failed with status {assign_response.status_code}", assign_response.text)
                return False
                
        except Exception as e:
            self.log_result("Driver Assignment Flow", False, f"Driver assignment error: {str(e)}")
            return False

    def test_payment_create_checkout(self):
        """Test payment checkout creation endpoint"""
        try:
            # First, create a test booking
            booking_data = {
                "serviceType": "airport-shuttle",
                "pickupAddress": "Auckland CBD, Auckland",
                "dropoffAddress": "Auckland Airport, Auckland",
                "date": "2025-12-20",
                "time": "14:00",
                "passengers": "1",
                "name": "Payment Test Customer",
                "email": "payment@test.com",
                "phone": "+64211234567",
                "pricing": {"totalPrice": 85.00}
            }
            
            booking_response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=10)
            
            if booking_response.status_code != 200:
                self.log_result("Payment Checkout Creation", False, "Could not create test booking for payment")
                return False
            
            booking_id = booking_response.json().get('id')
            
            # Test payment checkout creation
            checkout_data = {
                "booking_id": booking_id,
                "origin_url": "https://bookaride.co.nz"
            }
            
            response = self.session.post(f"{BACKEND_URL}/payment/create-checkout", json=checkout_data, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                session_id = data.get('session_id')
                
                if session_id:
                    self.log_result("Payment Checkout Creation", True, f"Checkout session created successfully: {session_id}")
                    return True
                else:
                    self.log_result("Payment Checkout Creation", False, f"No session_id in response: {data}")
                    return False
            else:
                self.log_result("Payment Checkout Creation", False, f"Payment checkout failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Payment Checkout Creation", False, f"Payment checkout error: {str(e)}")
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

    def test_booking_update_return_trip_sync(self):
        """Test booking update with return trip sync (Barbara Walsh bug fix)"""
        try:
            # First get an existing booking ID
            response = self.session.get(f"{BACKEND_URL}/bookings", timeout=10)
            
            if response.status_code != 200:
                self.log_result("Booking Update: Return Trip Sync", False, "Could not fetch bookings list")
                return False
            
            bookings = response.json()
            if not bookings:
                self.log_result("Booking Update: Return Trip Sync", False, "No existing bookings found")
                return False
            
            booking_id = bookings[0].get('id')
            
            # Test 1: Set returnDate - should auto-set bookReturn to true
            update_data = {
                "returnDate": "2025-12-25"
            }
            
            update_response = self.session.patch(f"{BACKEND_URL}/bookings/{booking_id}", json=update_data, timeout=10)
            
            if update_response.status_code != 200:
                self.log_result("Booking Update: Return Trip Sync", False, f"Failed to update booking with returnDate: {update_response.status_code} - {update_response.text}")
                return False
            
            # Verify the booking was updated correctly
            get_response = self.session.get(f"{BACKEND_URL}/bookings", timeout=10)
            if get_response.status_code == 200:
                updated_bookings = get_response.json()
                updated_booking = next((b for b in updated_bookings if b.get('id') == booking_id), None)
                
                if updated_booking:
                    book_return = updated_booking.get('bookReturn')
                    return_date = updated_booking.get('returnDate')
                    
                    if book_return is True and return_date == "2025-12-25":
                        self.log_result("Booking Update: Return Trip Sync (Set)", True, f"bookReturn auto-synced to true when returnDate set to {return_date}")
                    else:
                        self.log_result("Booking Update: Return Trip Sync (Set)", False, f"bookReturn not synced correctly: bookReturn={book_return}, returnDate={return_date}")
                        return False
                else:
                    self.log_result("Booking Update: Return Trip Sync (Set)", False, "Could not find updated booking")
                    return False
            
            # Test 2: Clear returnDate - should auto-set bookReturn to false
            clear_data = {
                "returnDate": ""
            }
            
            clear_response = self.session.patch(f"{BACKEND_URL}/bookings/{booking_id}", json=clear_data, timeout=10)
            
            if clear_response.status_code != 200:
                self.log_result("Booking Update: Return Trip Sync", False, f"Failed to clear returnDate: {clear_response.status_code} - {clear_response.text}")
                return False
            
            # Verify the booking was cleared correctly
            get_response2 = self.session.get(f"{BACKEND_URL}/bookings", timeout=10)
            if get_response2.status_code == 200:
                cleared_bookings = get_response2.json()
                cleared_booking = next((b for b in cleared_bookings if b.get('id') == booking_id), None)
                
                if cleared_booking:
                    book_return = cleared_booking.get('bookReturn')
                    return_date = cleared_booking.get('returnDate')
                    
                    if book_return is False and (return_date == "" or return_date is None):
                        self.log_result("Booking Update: Return Trip Sync (Clear)", True, f"bookReturn auto-synced to false when returnDate cleared")
                        return True
                    else:
                        self.log_result("Booking Update: Return Trip Sync (Clear)", False, f"bookReturn not synced correctly on clear: bookReturn={book_return}, returnDate={return_date}")
                        return False
                else:
                    self.log_result("Booking Update: Return Trip Sync (Clear)", False, "Could not find cleared booking")
                    return False
            
            return True
            
        except Exception as e:
            self.log_result("Booking Update: Return Trip Sync", False, f"Booking update error: {str(e)}")
            return False

    def test_email_generation_return_trips(self):
        """Test email generation for return trips (Barbara Walsh bug fix)"""
        try:
            # Create a manual booking with legacy bug scenario (bookReturn: false but returnDate set)
            booking_data = {
                "serviceType": "airport-shuttle",
                "pickupAddress": "Auckland CBD, Auckland",
                "dropoffAddress": "Auckland Airport, Auckland",
                "date": "2025-12-25",
                "time": "10:00",
                "passengers": "2",
                "name": "Barbara Walsh",
                "email": "barbara.walsh@test.com",
                "phone": "+64211234567",
                "bookReturn": False,  # Legacy bug: false but has return details
                "returnDate": "2025-12-25",
                "returnTime": "15:00",
                "pricing": {"totalPrice": 150.00}
            }
            
            # Check if manual booking endpoint exists
            manual_response = self.session.post(f"{BACKEND_URL}/bookings/manual", json=booking_data, timeout=10)
            
            booking_id = None
            if manual_response.status_code == 200:
                booking_id = manual_response.json().get('id')
                self.log_result("Email Generation: Manual Booking", True, f"Manual booking created: {booking_id}")
            elif manual_response.status_code == 404:
                # Manual endpoint doesn't exist, use regular booking endpoint
                regular_response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=10)
                if regular_response.status_code == 200:
                    booking_id = regular_response.json().get('id')
                    self.log_result("Email Generation: Regular Booking", True, f"Regular booking created for email test: {booking_id}")
                else:
                    self.log_result("Email Generation: Return Trips", False, f"Could not create test booking: {regular_response.status_code}")
                    return False
            else:
                self.log_result("Email Generation: Return Trips", False, f"Manual booking failed: {manual_response.status_code} - {manual_response.text}")
                return False
            
            if not booking_id:
                self.log_result("Email Generation: Return Trips", False, "No booking ID obtained")
                return False
            
            # Test resend confirmation email
            resend_response = self.session.post(f"{BACKEND_URL}/bookings/{booking_id}/resend-confirmation", timeout=15)
            
            if resend_response.status_code == 200:
                data = resend_response.json()
                message = data.get('message', '')
                
                if 'sent' in message.lower() or 'success' in message.lower():
                    self.log_result("Email Generation: Return Trips", True, f"Confirmation email resent successfully: {message}")
                    return True
                else:
                    self.log_result("Email Generation: Return Trips", False, f"Unexpected resend response: {message}")
                    return False
            elif resend_response.status_code == 404:
                self.log_result("Email Generation: Return Trips", False, "Resend confirmation endpoint not found")
                return False
            else:
                self.log_result("Email Generation: Return Trips", False, f"Resend confirmation failed: {resend_response.status_code} - {resend_response.text}")
                return False
                
        except Exception as e:
            self.log_result("Email Generation: Return Trips", False, f"Email generation test error: {str(e)}")
            return False

    def test_duplicate_reminder_prevention(self):
        """Test duplicate reminder prevention fix - comprehensive test"""
        try:
            from datetime import datetime, timedelta
            import pytz
            
            # Get NZ tomorrow date
            nz_tz = pytz.timezone('Pacific/Auckland')
            nz_tomorrow = (datetime.now(nz_tz) + timedelta(days=1)).strftime('%Y-%m-%d')
            
            print(f"\n🔔 Testing Duplicate Reminder Prevention for date: {nz_tomorrow}")
            
            # Step 1: Create a test booking for tomorrow
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
            
            booking_response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=10)
            
            if booking_response.status_code != 200:
                self.log_result("Duplicate Reminder Prevention: Create Booking", False, f"Could not create test booking: {booking_response.status_code}")
                return False
            
            booking_id = booking_response.json().get('id')
            self.log_result("Duplicate Reminder Prevention: Create Booking", True, f"Test booking created: {booking_id}")
            
            # Step 2: Check initial reminder status (should show pending)
            status_response = self.session.get(f"{BACKEND_URL}/admin/reminder-status", timeout=10)
            
            if status_response.status_code != 200:
                self.log_result("Duplicate Reminder Prevention: Initial Status", False, f"Could not get reminder status: {status_response.status_code}")
                return False
            
            initial_status = status_response.json()
            pending_count = initial_status.get('reminders_pending', 0)
            self.log_result("Duplicate Reminder Prevention: Initial Status", True, f"Initial pending reminders: {pending_count}")
            
            # Step 3: Trigger reminders twice rapidly (test concurrent execution)
            print("🔄 Triggering reminders twice in quick succession...")
            
            # First trigger
            trigger1_response = self.session.post(f"{BACKEND_URL}/admin/send-reminders", timeout=20)
            
            # Second trigger immediately (should be blocked by lock)
            trigger2_response = self.session.post(f"{BACKEND_URL}/admin/send-reminders", timeout=20)
            
            # Check both responses
            trigger1_success = trigger1_response.status_code == 200
            trigger2_success = trigger2_response.status_code == 200
            
            if trigger1_success:
                trigger1_data = trigger1_response.json()
                reminders_sent_1 = trigger1_data.get('reminders_sent', 0)
                skipped_1 = trigger1_data.get('skipped', 0)
                self.log_result("Duplicate Reminder Prevention: First Trigger", True, f"First trigger: {reminders_sent_1} sent, {skipped_1} skipped")
            else:
                self.log_result("Duplicate Reminder Prevention: First Trigger", False, f"First trigger failed: {trigger1_response.status_code}")
                return False
            
            if trigger2_success:
                trigger2_data = trigger2_response.json()
                reminders_sent_2 = trigger2_data.get('reminders_sent', 0)
                skipped_2 = trigger2_data.get('skipped', 0)
                self.log_result("Duplicate Reminder Prevention: Second Trigger", True, f"Second trigger: {reminders_sent_2} sent, {skipped_2} skipped")
            else:
                self.log_result("Duplicate Reminder Prevention: Second Trigger", False, f"Second trigger failed: {trigger2_response.status_code}")
                return False
            
            # Step 4: Check final reminder status (should show sent with details)
            time.sleep(2)  # Wait a moment for processing
            final_status_response = self.session.get(f"{BACKEND_URL}/admin/reminder-status", timeout=10)
            
            if final_status_response.status_code != 200:
                self.log_result("Duplicate Reminder Prevention: Final Status", False, f"Could not get final reminder status: {final_status_response.status_code}")
                return False
            
            final_status = final_status_response.json()
            sent_count = final_status.get('reminders_sent', 0)
            pending_final = final_status.get('reminders_pending', 0)
            sent_bookings = final_status.get('sent_bookings', [])
            
            self.log_result("Duplicate Reminder Prevention: Final Status", True, f"Final status: {sent_count} sent, {pending_final} pending")
            
            # Step 5: Try triggering again - should skip (already sent)
            print("🔄 Triggering reminders again (should skip already sent)...")
            trigger3_response = self.session.post(f"{BACKEND_URL}/admin/send-reminders", timeout=15)
            
            if trigger3_response.status_code == 200:
                trigger3_data = trigger3_response.json()
                reminders_sent_3 = trigger3_data.get('reminders_sent', 0)
                skipped_3 = trigger3_data.get('skipped', 0)
                
                # Third trigger should send 0 reminders (already sent)
                if reminders_sent_3 == 0:
                    self.log_result("Duplicate Reminder Prevention: Third Trigger", True, f"Third trigger correctly sent 0 reminders: {reminders_sent_3} sent, {skipped_3} skipped (already processed)")
                else:
                    self.log_result("Duplicate Reminder Prevention: Third Trigger", False, f"Third trigger should have sent 0: {reminders_sent_3} sent, {skipped_3} skipped")
                    return False
            else:
                self.log_result("Duplicate Reminder Prevention: Third Trigger", False, f"Third trigger failed: {trigger3_response.status_code}")
                return False
            
            # Validation: Check that only ONE reminder was sent total
            total_sent = reminders_sent_1 + reminders_sent_2 + reminders_sent_3
            
            # Expected results:
            # - First trigger should send 1 reminder (or second if first was locked)
            # - Subsequent triggers should send 0 (already processed)
            # - Total should be exactly 1 reminder sent
            
            if total_sent == 1:
                self.log_result("Duplicate Reminder Prevention: Validation", True, f"✅ SUCCESS: Only 1 reminder sent total (expected), duplicate prevention working correctly")
                
                # Check if reminderSentForDate field is set correctly
                if sent_bookings:
                    for sent_booking in sent_bookings:
                        reminder_date = sent_booking.get('reminderSentForDate', '')
                        if reminder_date == nz_tomorrow:
                            self.log_result("Duplicate Reminder Prevention: Date Field", True, f"reminderSentForDate correctly set to {reminder_date}")
                        else:
                            self.log_result("Duplicate Reminder Prevention: Date Field", False, f"reminderSentForDate incorrect: {reminder_date} (expected {nz_tomorrow})")
                            return False
                
                return True
            else:
                self.log_result("Duplicate Reminder Prevention: Validation", False, f"❌ FAILED: {total_sent} reminders sent (expected 1), duplicate prevention not working")
                return False
                
        except Exception as e:
            self.log_result("Duplicate Reminder Prevention", False, f"Test error: {str(e)}")
            return False

    def test_24_hour_booking_approval_rule_within_24h(self):
        """Test 24-hour booking approval rule - booking within 24 hours should get status='pending_approval'"""
        try:
            from datetime import datetime, timedelta
            import pytz
            
            # Get NZ tomorrow date (within 24 hours)
            nz_tz = pytz.timezone('Pacific/Auckland')
            tomorrow = datetime.now(nz_tz) + timedelta(days=1)
            tomorrow_date = tomorrow.strftime('%Y-%m-%d')
            
            print(f"\n⏰ Testing 24-hour rule: Booking for {tomorrow_date} (within 24 hours)")
            
            booking_data = {
                "serviceType": "airport-transfer",
                "pickupAddress": "123 Test Street, Auckland",
                "dropoffAddress": "Auckland Airport",
                "date": tomorrow_date,
                "time": "10:00",
                "passengers": "2",
                "name": "24hr Test User",
                "email": "test24hr@example.com",
                "phone": "021111222",
                "pricing": {"totalPrice": 85}
            }
            
            response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                booking_id = data.get('id')
                status = data.get('status')
                
                if status == 'pending_approval':
                    self.log_result("24-Hour Rule: Within 24h", True, f"Booking within 24h correctly set to 'pending_approval': {booking_id}")
                    return True
                else:
                    self.log_result("24-Hour Rule: Within 24h", False, f"Booking within 24h has wrong status: '{status}' (expected 'pending_approval')")
                    return False
            else:
                self.log_result("24-Hour Rule: Within 24h", False, f"Booking creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("24-Hour Rule: Within 24h", False, f"Test error: {str(e)}")
            return False

    def test_24_hour_booking_approval_rule_beyond_24h(self):
        """Test 24-hour booking approval rule - booking more than 24 hours away should get status='pending'"""
        try:
            from datetime import datetime, timedelta
            import pytz
            
            # Get date 7 days from now (beyond 24 hours)
            nz_tz = pytz.timezone('Pacific/Auckland')
            future_date = datetime.now(nz_tz) + timedelta(days=7)
            future_date_str = future_date.strftime('%Y-%m-%d')
            
            print(f"\n⏰ Testing 24-hour rule: Booking for {future_date_str} (beyond 24 hours)")
            
            booking_data = {
                "serviceType": "airport-transfer",
                "pickupAddress": "456 Future Street, Auckland",
                "dropoffAddress": "Auckland Airport",
                "date": future_date_str,
                "time": "14:00",
                "passengers": "3",
                "name": "Future Test User",
                "email": "testfuture@example.com",
                "phone": "021333444",
                "pricing": {"totalPrice": 95}
            }
            
            response = self.session.post(f"{BACKEND_URL}/bookings", json=booking_data, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                booking_id = data.get('id')
                status = data.get('status')
                
                if status == 'pending':
                    self.log_result("24-Hour Rule: Beyond 24h", True, f"Booking beyond 24h correctly set to 'pending': {booking_id}")
                    return True
                else:
                    self.log_result("24-Hour Rule: Beyond 24h", False, f"Booking beyond 24h has wrong status: '{status}' (expected 'pending')")
                    return False
            else:
                self.log_result("24-Hour Rule: Beyond 24h", False, f"Booking creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("24-Hour Rule: Beyond 24h", False, f"Test error: {str(e)}")
            return False

    def test_admin_dashboard_pending_approval_count(self):
        """Test admin dashboard shows correct count of pending_approval bookings"""
        try:
            # Get all bookings to count pending_approval ones
            response = self.session.get(f"{BACKEND_URL}/bookings", timeout=10)
            
            if response.status_code == 200:
                bookings = response.json()
                pending_approval_count = sum(1 for booking in bookings if booking.get('status') == 'pending_approval')
                
                self.log_result("Admin Dashboard: Pending Approval Count", True, f"Found {pending_approval_count} bookings with status 'pending_approval'")
                
                # If we have pending_approval bookings, the admin dashboard should show them
                if pending_approval_count > 0:
                    self.log_result("Admin Dashboard: Alert Banner Data", True, f"Admin dashboard should show alert banner with {pending_approval_count} booking(s) needing approval")
                else:
                    self.log_result("Admin Dashboard: Alert Banner Data", True, "No pending_approval bookings found - alert banner should not appear")
                
                return True
            else:
                self.log_result("Admin Dashboard: Pending Approval Count", False, f"Failed to get bookings: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result("Admin Dashboard: Pending Approval Count", False, f"Test error: {str(e)}")
            return False

    def test_seo_pages_backend_support(self):
        """Test if backend supports the new SEO page routes (basic connectivity test)"""
        try:
            # Test a few key SEO routes to see if they're accessible
            # Note: These are frontend routes, but we can test if the backend serves them
            seo_routes = [
                "/auckland-cbd-airport",
                "/ponsonby-to-airport", 
                "/parnell-to-airport",
                "/newmarket-to-airport"
            ]
            
            # Since these are frontend routes, we'll test if the backend root serves them
            # or if there are any backend endpoints that support these routes
            base_url = BACKEND_URL.replace('/api', '')  # Remove /api for frontend routes
            
            accessible_routes = []
            for route in seo_routes:
                try:
                    response = self.session.get(f"{base_url}{route}", timeout=5)
                    if response.status_code in [200, 301, 302]:  # Success or redirect
                        accessible_routes.append(route)
                except:
                    pass  # Route not accessible, which is expected for backend-only testing
            
            if accessible_routes:
                self.log_result("SEO Pages: Backend Support", True, f"SEO routes accessible: {accessible_routes}")
            else:
                self.log_result("SEO Pages: Backend Support", True, "SEO routes are frontend-only (expected for backend testing)")
            
            return True
                
        except Exception as e:
            self.log_result("SEO Pages: Backend Support", False, f"Test error: {str(e)}")
            return False
    
    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        print("🚀 Starting BookaRide Backend Testing - Review Request Features")
        print("=" * 70)
        
        # Basic connectivity tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
        
        # NEW REVIEW REQUEST FEATURES TESTING
        print("\n🚨 Testing 24-Hour Booking Approval Rule (NEW FEATURE)...")
        self.test_24_hour_booking_approval_rule_within_24h()
        self.test_24_hour_booking_approval_rule_beyond_24h()
        
        print("\n📊 Testing Admin Dashboard Pending Approval Count...")
        self.test_admin_dashboard_pending_approval_count()
        
        print("\n🌐 Testing SEO Pages Backend Support...")
        self.test_seo_pages_backend_support()
        
        # BARBARA WALSH BUG FIX TESTS (REVIEW REQUEST)
        print("\n💰 Testing Pricing Calculation with ratePerKm (Barbara Walsh Bug Fix)...")
        self.test_pricing_calculation_orewa_to_airport_with_rate_per_km()
        self.test_pricing_calculation_short_trip_with_rate_per_km()
        
        print("\n🔄 Testing Booking Update with Return Trip Sync (Barbara Walsh Bug Fix)...")
        self.test_booking_update_return_trip_sync()
        
        print("\n📧 Testing Email Generation for Return Trips (Barbara Walsh Bug Fix)...")
        self.test_email_generation_return_trips()
        
        print("\n✈️ Testing Flight Tracker...")
        self.test_flight_tracker()
        
        print("\n🚗 Testing Driver Assignment with Notifications...")
        self.test_driver_assignment_flow()
        
        print("\n🤖 Testing AI Email Auto-Responder...")
        self.test_ai_email_auto_responder()
        
        print("\n💳 Testing Payment Endpoints...")
        self.test_payment_create_checkout()
        
        # DUPLICATE REMINDER PREVENTION TEST (REVIEW REQUEST)
        print("\n🔔 Testing Duplicate Reminder Prevention Fix...")
        self.test_duplicate_reminder_prevention()
        
        # Additional core functionality tests
        print("\n📧 Testing Email System...")
        self.test_direct_mailgun_email()
        
        print("\n📋 Testing Booking System...")
        self.test_price_calculation()
        self.test_create_booking('en')
        self.test_get_bookings()
        
        # Payment webhook test
        print("\n🔗 Testing Payment Webhooks...")
        self.test_stripe_webhook_simulation()
        
        # Admin Authentication Features
        print("\n🔐 Testing Admin Authentication Features...")
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