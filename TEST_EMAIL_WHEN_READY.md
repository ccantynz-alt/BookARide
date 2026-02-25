# Testing Multi-Language Email Confirmations

## Prerequisites
✅ Mailgun DNS must be verified (State: 'active')
✅ Run: `python3 /app/check_mailgun_dns.py` to check status

---

## Test Plan: Multi-Language Email & SMS Confirmations

### Test Case 1: English Booking
1. Go to: http://localhost:3000/book-now
2. Select language: **English** (from top-right selector)
3. Fill booking form:
   - Service: Airport Shuttle
   - Pickup: Auckland Airport
   - Dropoff: Your test address
   - Date & Time: Tomorrow
   - Contact info: Your email & phone
4. Complete payment (use Stripe test card: `4242 4242 4242 4242`)
5. **Expected Result:**
   - ✅ Email in English to your email
   - ✅ SMS in English to your phone

### Test Case 2: Chinese Booking
1. Change language to: **中文** (Chinese)
2. Complete a booking
3. **Expected Result:**
   - ✅ Email in Chinese
   - ✅ SMS in Chinese

### Test Case 3: Spanish Booking
1. Change language to: **Español** (if added) or any other language
2. Complete a booking
3. **Expected Result:**
   - ✅ Email in selected language
   - ✅ SMS in selected language

---

## Manual Testing Steps

### Step 1: Verify DNS is Active
```bash
python3 /app/check_mailgun_dns.py
```
Should show: `State: ACTIVE`

### Step 2: Test Email Sending
```bash
cd /app/backend
# Load .env then run (API key must come from environment only)
python3 << 'EOF'
import os
import requests
from dotenv import load_dotenv
load_dotenv()

api_key = os.environ.get("MAILGUN_API_KEY")  # Set in .env only; never commit
domain = os.environ.get("MAILGUN_DOMAIN", "mg.bookaride.co.nz")
from_email = f"noreply@{domain}"
to_email = "YOUR_EMAIL@example.com"  # Replace with your email

if not api_key:
    print("Set MAILGUN_API_KEY in .env")
    exit(1)
response = requests.post(
    f"https://api.mailgun.net/v3/{domain}/messages",
    auth=("api", api_key),
    data={
        "from": f"Book A Ride <{from_email}>",
        "to": to_email,
        "subject": "Test Email - Book A Ride NZ",
        "text": "This is a test email. If you received this, Mailgun is working!"
    }
)
if response.status_code == 200:
    print("✅ Email sent successfully!")
    print(f"Response: {response.json()}")
else:
    print(f"❌ Error: {response.status_code}")
    print(f"Response: {response.text}")
EOF
```

### Step 3: Check Backend Logs
```bash
tail -f /var/log/supervisor/backend.out.log
```

Look for:
- Mailgun API calls
- Email sending logs
- Any errors

---

## Backend Email Logic

The multi-language email logic is in `/app/backend/server.py`:

```python
# Language translations for emails (lines ~450-550)
TRANSLATIONS = {
    'en': { ... },
    'zh': { ... },  # Chinese
    'es': { ... },  # Spanish
    'ja': { ... },  # Japanese
    'ko': { ... },  # Korean
    'fr': { ... }   # French
}

# Webhook endpoint that sends emails (line ~1250)
@app.post("/api/webhooks/stripe")
async def stripe_webhook(...):
    # Gets language from booking
    # Sends email in that language via Mailgun
```

---

## What to Check in Received Emails

### Email Subject (varies by language)
- **English:** "Booking Confirmation - Book A Ride NZ"
- **Chinese:** "预订确认 - Book A Ride NZ"
- **Spanish:** "Confirmación de Reserva - Book A Ride NZ"

### Email Content
- Greeting in selected language
- Booking details
- Pickup/dropoff addresses
- Date, time, price
- Contact information

### SMS Content
- Short message in selected language
- Booking confirmation number
- Pickup time & location

---

## Troubleshooting

### If emails don't arrive:
1. Check spam folder
2. Verify Mailgun logs: https://app.mailgun.com/
3. Check backend logs for errors
4. Verify DNS is still active
5. Check Mailgun sending limits

### If wrong language:
1. Verify language selector is working
2. Check browser console for `i18n.language`
3. Verify booking API receives correct language
4. Check backend logs for language parameter

---

## Current Mailgun Configuration

- **Domain:** mg.bookaride.co.nz
- **Sender Email:** noreply@mg.bookaride.co.nz
- **API Key:** (stored in .env)
- **Status:** Awaiting DNS propagation

---

## Next Steps After DNS Verification

1. ✅ Run manual email test (Step 2 above)
2. ✅ Test end-to-end booking in English
3. ✅ Test end-to-end booking in Chinese
4. ✅ Test end-to-end booking in another language
5. ✅ Verify all languages work correctly
6. 🎉 Mark feature as COMPLETE

---

**Remember:** DNS propagation can take 5 minutes to 48 hours. Check status with:
```bash
python3 /app/check_mailgun_dns.py
```
