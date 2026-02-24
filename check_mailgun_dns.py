#!/usr/bin/env python3
"""
Mailgun DNS Propagation Checker
Checks every 10 minutes if mg.bookaride.co.nz is verified
"""

import requests
import time
from datetime import datetime

# Mailgun configuration
MAILGUN_API_KEY = "151d31c4dd7cd9fd3015d140b2c58f76-235e4bb2-1ecf548a"
MAILGUN_DOMAIN = "mg.bookaride.co.nz"
CHECK_INTERVAL = 600  # 10 minutes in seconds

def check_dns_status():
    """Check Mailgun domain verification status"""
    try:
        response = requests.get(
            f"https://api.mailgun.net/v3/domains/{MAILGUN_DOMAIN}",
            auth=("api", MAILGUN_API_KEY),
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            domain_info = data.get('domain', {})
            state = domain_info.get('state', 'unknown')
            
            print(f"\n{'='*70}")
            print(f"🕐 Check Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"{'='*70}")
            print(f"Domain: {MAILGUN_DOMAIN}")
            print(f"State: {state.upper()}")
            
            # Check DNS records
            all_valid = True
            for record_type in ['sending_dns_records', 'receiving_dns_records']:
                records = domain_info.get(record_type, [])
                if records:
                    print(f"\n{record_type.replace('_', ' ').title()}:")
                    for record in records:
                        is_valid = record.get('valid') == 'valid'
                        status = "✅" if is_valid else "❌"
                        if not is_valid:
                            all_valid = False
                        print(f"  {status} {record.get('record_type'):6} - {record.get('name')}")
            
            if state == 'active' and all_valid:
                print(f"\n{'='*70}")
                print("🎉 SUCCESS! DOMAIN IS VERIFIED AND ACTIVE!")
                print("{'='*70}")
                print("\n✅ Next Steps:")
                print("   1. Test email sending with a booking")
                print("   2. Test multi-language confirmations")
                print("   3. Verify emails arrive in correct language")
                return True
            else:
                print(f"\n⏳ Status: Still waiting for DNS propagation...")
                print(f"   (Checked {datetime.now().strftime('%H:%M:%S')})")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking DNS: {e}")
        return False

def main():
    """Main monitoring loop"""
    print("🚀 Starting Mailgun DNS Monitoring...")
    print(f"📡 Checking domain: {MAILGUN_DOMAIN}")
    print(f"⏰ Check interval: {CHECK_INTERVAL // 60} minutes")
    print(f"{'='*70}\n")
    
    check_count = 0
    
    while True:
        check_count += 1
        print(f"\n📊 Check #{check_count}")
        
        is_verified = check_dns_status()
        
        if is_verified:
            print("\n🎯 Monitoring complete! Domain is verified.")
            break
        
        print(f"\n⏳ Next check in {CHECK_INTERVAL // 60} minutes...")
        print(f"   (Press Ctrl+C to stop monitoring)")
        
        try:
            time.sleep(CHECK_INTERVAL)
        except KeyboardInterrupt:
            print("\n\n⚠️  Monitoring stopped by user")
            print("   Run this script again to resume checking")
            break

if __name__ == "__main__":
    main()
