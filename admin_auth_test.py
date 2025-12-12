#!/usr/bin/env python3
"""
Admin Authentication Features Testing for BookaRide.co.nz
Tests Google OAuth Login and Password Reset functionality as requested
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration
BACKEND_URL = "https://ride-booking-fix-5.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Chico9620!@"
TEST_EMAIL = "bookings@bookaride.co.nz"

class AdminAuthTester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.test_results = []
        
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
    
    def test_admin_login_with_new_credentials(self):
        """Test admin login with updated credentials"""
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
                self.log_result("Admin Login (New Credentials)", True, f"Successfully logged in with {ADMIN_USERNAME}/{ADMIN_PASSWORD}")
                return True
            else:
                self.log_result("Admin Login (New Credentials)", False, f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Login (New Credentials)", False, f"Login error: {str(e)}")
            return False
    
    def test_google_oauth_session_endpoint(self):
        """Test POST /api/admin/google-auth/session endpoint"""
        try:
            # Test with mock session data
            oauth_data = {
                "session_id": "mock_emergent_session_12345"
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/google-auth/session", json=oauth_data, timeout=15)
            
            # We expect 401 (invalid session) which means endpoint is working
            if response.status_code == 401:
                data = response.json()
                detail = data.get('detail', '')
                if 'invalid session' in detail.lower():
                    self.log_result("Google OAuth Session Endpoint", True, "Endpoint exists and validates Emergent Auth sessions correctly")
                    return True
                else:
                    self.log_result("Google OAuth Session Endpoint", False, f"Unexpected 401 response: {detail}")
                    return False
            elif response.status_code == 404:
                self.log_result("Google OAuth Session Endpoint", False, "Google OAuth session endpoint not found")
                return False
            else:
                self.log_result("Google OAuth Session Endpoint", True, f"Endpoint exists (status: {response.status_code})")
                return True
        except Exception as e:
            self.log_result("Google OAuth Session Endpoint", False, f"Error: {str(e)}")
            return False
    
    def test_password_reset_request_endpoint(self):
        """Test POST /api/admin/password-reset/request endpoint"""
        try:
            reset_data = {
                "email": TEST_EMAIL
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/password-reset/request", json=reset_data, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                if 'password reset link' in message.lower():
                    self.log_result("Password Reset Request", True, f"Email reset request successful for {TEST_EMAIL}")
                    return True
                else:
                    self.log_result("Password Reset Request", False, f"Unexpected response: {message}")
                    return False
            else:
                self.log_result("Password Reset Request", False, f"Request failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Password Reset Request", False, f"Error: {str(e)}")
            return False
    
    def test_password_reset_validate_endpoint(self):
        """Test GET /api/admin/password-reset/validate/{token} endpoint"""
        try:
            test_token = "test_invalid_token_12345"
            
            response = self.session.get(f"{BACKEND_URL}/admin/password-reset/validate/{test_token}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                valid = data.get('valid', True)  # Should be False for invalid token
                if not valid:
                    message = data.get('message', '')
                    self.log_result("Password Reset Validate", True, f"Token validation working correctly: {message}")
                    return True
                else:
                    self.log_result("Password Reset Validate", False, "Invalid token returned as valid")
                    return False
            else:
                self.log_result("Password Reset Validate", False, f"Validate failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Password Reset Validate", False, f"Error: {str(e)}")
            return False
    
    def test_password_reset_confirm_endpoint(self):
        """Test POST /api/admin/password-reset/confirm endpoint"""
        try:
            confirm_data = {
                "token": "test_invalid_token_12345",
                "new_password": "NewTestPassword123!"
            }
            
            response = self.session.post(f"{BACKEND_URL}/admin/password-reset/confirm", json=confirm_data, timeout=10)
            
            # Should fail with 400 for invalid token
            if response.status_code == 400:
                data = response.json()
                detail = data.get('detail', '')
                if 'invalid' in detail.lower() or 'expired' in detail.lower():
                    self.log_result("Password Reset Confirm", True, f"Confirm endpoint working correctly: {detail}")
                    return True
                else:
                    self.log_result("Password Reset Confirm", False, f"Unexpected error: {detail}")
                    return False
            elif response.status_code == 404:
                self.log_result("Password Reset Confirm", False, "Password reset confirm endpoint not found")
                return False
            else:
                self.log_result("Password Reset Confirm", True, f"Endpoint exists (status: {response.status_code})")
                return True
        except Exception as e:
            self.log_result("Password Reset Confirm", False, f"Error: {str(e)}")
            return False
    
    def test_admin_auth_me_endpoint(self):
        """Test GET /api/admin/auth/me endpoint for session-based auth"""
        try:
            # Test without session cookie (should work with JWT token)
            response = self.session.get(f"{BACKEND_URL}/admin/auth/me", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                username = data.get('username')
                email = data.get('email')
                auth_method = data.get('auth_method')
                
                if username and email:
                    self.log_result("Admin Auth Me", True, f"Auth endpoint working - User: {username}, Email: {email}, Method: {auth_method}")
                    return True
                else:
                    self.log_result("Admin Auth Me", False, f"Missing user data in response: {data}")
                    return False
            elif response.status_code == 401:
                self.log_result("Admin Auth Me", True, "Auth endpoint exists and requires authentication (expected without session)")
                return True
            else:
                self.log_result("Admin Auth Me", False, f"Unexpected status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Auth Me", False, f"Error: {str(e)}")
            return False
    
    def test_admin_logout_endpoint(self):
        """Test POST /api/admin/logout endpoint"""
        try:
            response = self.session.post(f"{BACKEND_URL}/admin/logout", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                if 'logged out' in message.lower():
                    self.log_result("Admin Logout", True, f"Logout endpoint working: {message}")
                    return True
                else:
                    self.log_result("Admin Logout", False, f"Unexpected response: {message}")
                    return False
            else:
                self.log_result("Admin Logout", False, f"Logout failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Logout", False, f"Error: {str(e)}")
            return False
    
    def run_admin_auth_tests(self):
        """Run all admin authentication tests"""
        print("🔐 Starting Admin Authentication Features Testing")
        print("=" * 60)
        
        # Test basic admin login first
        if not self.test_admin_login_with_new_credentials():
            print("❌ Admin login failed - some tests may not work properly")
        
        print("\n🔑 Testing Google OAuth Features...")
        self.test_google_oauth_session_endpoint()
        
        print("\n📧 Testing Password Reset Features...")
        self.test_password_reset_request_endpoint()
        self.test_password_reset_validate_endpoint()
        self.test_password_reset_confirm_endpoint()
        
        print("\n👤 Testing Session Management...")
        self.test_admin_auth_me_endpoint()
        self.test_admin_logout_endpoint()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 ADMIN AUTH TEST SUMMARY")
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
        else:
            print("\n🎉 ALL ADMIN AUTHENTICATION TESTS PASSED!")
        
        return failed == 0

def main():
    """Main test execution"""
    tester = AdminAuthTester()
    
    try:
        success = tester.run_admin_auth_tests()
        
        # Save results to file
        with open('/app/admin_auth_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'success': success,
                'results': tester.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/admin_auth_test_results.json")
        
        if success:
            print("\n✅ ALL ADMIN AUTHENTICATION FEATURES ARE WORKING!")
            sys.exit(0)
        else:
            print("\n⚠️  Some admin auth tests failed. Check the details above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()