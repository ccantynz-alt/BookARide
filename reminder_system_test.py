#!/usr/bin/env python3
"""
Day-Before Reminder System Testing for BookaRide.co.nz
Tests the 3-layer reliability system for day-before reminders
"""

import requests
import json
import time
import sys
from datetime import datetime, timedelta

# Configuration from review request
BACKEND_URL = "https://bookmend.preview.emergentagent.com/api"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "Kongkong2025!@"
CRON_API_KEY = "bookaride-cron-secret-2024"

class ReminderSystemTester:
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
    
    def test_admin_authentication(self):
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
                self.log_result("Admin Authentication", True, f"Admin login successful with credentials {ADMIN_USERNAME}/{ADMIN_PASSWORD}")
                return True
            else:
                self.log_result("Admin Authentication", False, f"Login failed with status {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Authentication", False, f"Login error: {str(e)}")
            return False
    
    def test_reminder_status_endpoint(self):
        """Test GET /api/admin/reminder-status endpoint"""
        try:
            if not self.admin_token:
                self.log_result("Reminder Status Endpoint", False, "No admin token available")
                return False
            
            response = self.session.get(f"{BACKEND_URL}/admin/reminder-status", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields from review request
                required_fields = [
                    'current_nz_time',
                    'checking_for_date', 
                    'total_bookings_tomorrow',
                    'reminders_sent_today',
                    'reminders_pending',
                    'scheduler_status',
                    'scheduled_jobs'
                ]
                
                missing_fields = []
                for field in required_fields:
                    if field not in data:
                        missing_fields.append(field)
                
                if missing_fields:
                    self.log_result("Reminder Status Endpoint", False, f"Missing required fields: {missing_fields}", data)
                    return False
                
                # Verify scheduler status
                scheduler_status = data.get('scheduler_status')
                if scheduler_status != 'running':
                    self.log_result("Reminder Status Endpoint", False, f"Scheduler status is '{scheduler_status}', expected 'running'", data)
                    return False
                
                # Verify scheduled jobs
                scheduled_jobs = data.get('scheduled_jobs', [])
                expected_jobs = [
                    "Primary: Send reminders at 8 AM NZ",
                    "Backup: Hourly reminder check"
                ]
                
                jobs_found = []
                for expected_job in expected_jobs:
                    job_found = any(expected_job in str(job) for job in scheduled_jobs)
                    if job_found:
                        jobs_found.append(expected_job)
                
                if len(jobs_found) != len(expected_jobs):
                    missing_jobs = [job for job in expected_jobs if job not in jobs_found]
                    self.log_result("Reminder Status Endpoint", False, f"Missing scheduled jobs: {missing_jobs}", data)
                    return False
                
                self.log_result("Reminder Status Endpoint", True, f"All required fields present, scheduler running, 2 jobs scheduled", data)
                return True
                
            elif response.status_code == 403:
                self.log_result("Reminder Status Endpoint", False, "Access forbidden - JWT token may be invalid")
                return False
            else:
                self.log_result("Reminder Status Endpoint", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Reminder Status Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def test_manual_send_reminders_endpoint(self):
        """Test POST /api/admin/send-reminders endpoint"""
        try:
            if not self.admin_token:
                self.log_result("Manual Send Reminders Endpoint", False, "No admin token available")
                return False
            
            response = self.session.post(f"{BACKEND_URL}/admin/send-reminders", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for success response with reminders_sent count (can be in root or details)
                reminders_sent = data.get('reminders_sent')
                if reminders_sent is None and 'details' in data:
                    reminders_sent = data['details'].get('reminders_sent')
                
                if reminders_sent is not None:
                    self.log_result("Manual Send Reminders Endpoint", True, f"Manual reminders sent successfully: {reminders_sent} reminders", data)
                    return True
                else:
                    self.log_result("Manual Send Reminders Endpoint", False, "Response missing 'reminders_sent' field", data)
                    return False
                    
            elif response.status_code == 403:
                self.log_result("Manual Send Reminders Endpoint", False, "Access forbidden - JWT token may be invalid")
                return False
            else:
                self.log_result("Manual Send Reminders Endpoint", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Manual Send Reminders Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def test_external_cron_endpoint(self):
        """Test GET /api/cron/send-reminders?api_key=bookaride-cron-secret-2024 endpoint"""
        try:
            # This endpoint should not require Bearer token, just API key
            headers_backup = self.session.headers.copy()
            if 'Authorization' in self.session.headers:
                del self.session.headers['Authorization']
            
            response = self.session.get(f"{BACKEND_URL}/cron/send-reminders?api_key={CRON_API_KEY}", timeout=15)
            
            # Restore headers
            self.session.headers = headers_backup
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for success response with reminders_sent count
                if 'reminders_sent' in data:
                    reminders_sent = data.get('reminders_sent', 0)
                    self.log_result("External Cron Endpoint", True, f"External cron reminders sent successfully: {reminders_sent} reminders", data)
                    return True
                else:
                    self.log_result("External Cron Endpoint", False, "Response missing 'reminders_sent' field", data)
                    return False
                    
            elif response.status_code == 401 or response.status_code == 403:
                self.log_result("External Cron Endpoint", False, f"Authentication failed - API key may be incorrect (status: {response.status_code})", response.text)
                return False
            else:
                self.log_result("External Cron Endpoint", False, f"Request failed with status {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("External Cron Endpoint", False, f"Request error: {str(e)}")
            return False
    
    def test_backend_logs_verification(self):
        """Verify backend logs contain expected scheduler messages"""
        try:
            import subprocess
            
            # Check backend logs for scheduler startup messages
            log_file = "/var/log/supervisor/backend.err.log"
            expected_messages = [
                "🚀 Reminder scheduler started with 3-layer reliability",
                "Layer 1: 8:00 AM NZ daily (primary)",
                "Layer 2: Hourly backup check", 
                "Layer 3: Startup check",
                "🔔 [startup_check] Checking reminders"
            ]
            
            try:
                # Read the log file
                result = subprocess.run(['tail', '-n', '100', log_file], 
                                      capture_output=True, text=True, timeout=10)
                
                if result.returncode != 0:
                    self.log_result("Backend Logs Verification", False, f"Could not read log file: {log_file}")
                    return False
                
                log_content = result.stdout
                messages_found = []
                messages_missing = []
                
                for message in expected_messages:
                    if message in log_content:
                        messages_found.append(message)
                    else:
                        messages_missing.append(message)
                
                if len(messages_found) >= 3:  # At least 3 out of 5 messages should be present
                    self.log_result("Backend Logs Verification", True, f"Found {len(messages_found)}/5 expected scheduler messages in logs", {
                        'found': messages_found,
                        'missing': messages_missing
                    })
                    return True
                else:
                    self.log_result("Backend Logs Verification", False, f"Only found {len(messages_found)}/5 expected scheduler messages", {
                        'found': messages_found,
                        'missing': messages_missing
                    })
                    return False
                    
            except subprocess.TimeoutExpired:
                self.log_result("Backend Logs Verification", False, "Timeout reading log file")
                return False
            except FileNotFoundError:
                self.log_result("Backend Logs Verification", False, f"Log file not found: {log_file}")
                return False
                
        except Exception as e:
            self.log_result("Backend Logs Verification", False, f"Log verification error: {str(e)}")
            return False
    
    def run_reminder_system_test(self):
        """Run all reminder system tests in sequence"""
        print("🔔 Starting Day-Before Reminder System Testing")
        print("=" * 60)
        
        # Basic connectivity test
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return False
        
        # Admin authentication test
        if not self.test_admin_authentication():
            print("❌ Admin authentication failed - stopping tests")
            return False
        
        # Core reminder system tests
        print("\n📊 Testing Reminder Status Endpoint...")
        self.test_reminder_status_endpoint()
        
        print("\n📤 Testing Manual Send Reminders Endpoint...")
        self.test_manual_send_reminders_endpoint()
        
        print("\n🌐 Testing External Cron Endpoint...")
        self.test_external_cron_endpoint()
        
        print("\n📋 Verifying Backend Logs...")
        self.test_backend_logs_verification()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 REMINDER SYSTEM TEST SUMMARY")
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
    tester = ReminderSystemTester()
    
    try:
        success = tester.run_reminder_system_test()
        
        # Save results to file
        with open('/app/reminder_system_test_results.json', 'w') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'success': success,
                'results': tester.test_results
            }, f, indent=2)
        
        print(f"\n📄 Detailed results saved to: /app/reminder_system_test_results.json")
        
        if success:
            print("\n🎉 ALL REMINDER SYSTEM TESTS PASSED! 3-layer reliability system is working correctly.")
            sys.exit(0)
        else:
            print("\n⚠️  Some reminder system tests failed. Check the details above.")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error during testing: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()