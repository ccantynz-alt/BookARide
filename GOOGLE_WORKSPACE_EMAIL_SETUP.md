# Google Workspace Email Setup Guide
## For BookaRide.co.nz / AirportShuttleService.co.nz

---

## ✅ What Changed

**Replaced:** SendGrid API → Google Workspace SMTP
**Why:** More reliable, easier setup, likely already have Google Workspace

---

## 📋 Setup Instructions

### **Step 1: Create App Password in Google**

1. Go to your Google Account: https://myaccount.google.com/apppasswords
2. Sign in with your Google Workspace email (e.g., info@bookaride.co.nz)
3. If you don't see "App passwords":
   - Go to Security Settings: https://myaccount.google.com/security
   - Enable **2-Step Verification** first (required for app passwords)
   - Then return to App passwords
4. Click **Select app** → Choose **"Mail"**
5. Click **Select device** → Choose **"Other (Custom name)"**
6. Enter name: **"BookaRide Website"**
7. Click **Generate**
8. **COPY the 16-character password** (looks like: `abcd efgh ijkl mnop`)
9. Save this password - you won't see it again!

---

### **Step 2: Update Environment Variables**

Open `/app/backend/.env` and update these lines:

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@bookaride.co.nz
SMTP_PASSWORD=abcd efgh ijkl mnop
SENDER_EMAIL=your-email@bookaride.co.nz
```

**Replace with YOUR details:**
- `SMTP_USERNAME`: Your Google Workspace email
- `SMTP_PASSWORD`: The 16-character app password you just generated
- `SENDER_EMAIL`: The "from" email customers will see (same as username)

**Example:**
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=info@bookaride.co.nz
SMTP_PASSWORD=wxyz abcd efgh ijkl
SENDER_EMAIL=info@bookaride.co.nz
```

---

### **Step 3: Restart Backend**

```bash
sudo supervisorctl restart backend
```

---

### **Step 4: Test Email Sending**

Create test file:
```bash
cat > /tmp/test_google_email.py << 'EOF'
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Load from .env
import sys
sys.path.append('/app/backend')

# Set your credentials (or load from .env)
smtp_username = "YOUR_EMAIL@bookaride.co.nz"
smtp_password = "YOUR_APP_PASSWORD"
sender_email = "YOUR_EMAIL@bookaride.co.nz"
test_recipient = "YOUR_EMAIL@bookaride.co.nz"  # Send to yourself for testing

try:
    message = MIMEMultipart('alternative')
    message['Subject'] = "Test Booking Confirmation"
    message['From'] = sender_email
    message['To'] = test_recipient

    html_content = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h1 style="color: #D4AF37;">Test Email - BookaRide</h1>
            <p>This is a test email from your BookaRide website.</p>
            <p>If you receive this, email integration is working! ✅</p>
        </body>
    </html>
    """

    html_part = MIMEText(html_content, 'html')
    message.attach(html_part)

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)

    print("✅ Email sent successfully via Google Workspace!")

except Exception as e:
    print(f"❌ Error: {str(e)}")
EOF
```

Run the test:
```bash
# Edit the file first with your credentials
nano /tmp/test_google_email.py
# Then run
python3 /tmp/test_google_email.py
```

**Expected Output:**
```
✅ Email sent successfully via Google Workspace!
```

Check your inbox - you should receive the test email!

---

## 🔒 Security Notes

### **App Password vs Regular Password**
- ✅ **DO use:** App password (16 characters from Google)
- ❌ **DON'T use:** Your regular Gmail/Google Workspace password
- App passwords are safer and can be revoked independently

### **Email Account Recommendations**
**Best options:**
1. `noreply@bookaride.co.nz` - Professional, clear it's automated
2. `bookings@bookaride.co.nz` - Customers can reply for questions
3. `info@bookaride.co.nz` - General business email

**Avoid:**
- Personal emails (looks unprofessional)
- Shared accounts without app passwords

---

## 📧 Email Settings Explained

```bash
SMTP_SERVER=smtp.gmail.com    # Google's SMTP server
SMTP_PORT=587                 # Standard SMTP port (with STARTTLS)
SMTP_USERNAME=your@email.com  # Your Google Workspace email
SMTP_PASSWORD=app-password     # 16-char app password from Google
SENDER_EMAIL=your@email.com   # "From" address in emails
```

**Alternative ports:**
- Port 587: TLS/STARTTLS (recommended) ✅
- Port 465: SSL (also works)
- Port 25: Plain (not recommended for security)

---

## 🧪 Troubleshooting

### **Error: "Username and Password not accepted"**
**Solutions:**
1. Make sure you're using the **app password**, not your regular password
2. Check if 2-Step Verification is enabled on your Google account
3. Verify email address is correct (no typos)
4. Try generating a new app password

### **Error: "SMTP AUTH extension not supported"**
**Solution:** You're connecting to wrong port. Use port 587, not 25.

### **Error: "534 Please log in via your web browser"**
**Solutions:**
1. Go to: https://accounts.google.com/DisplayUnlockCaptcha
2. Sign in with your Google Workspace account
3. Click "Continue" to allow access
4. Try sending email again

### **Error: "535 Authentication credentials invalid"**
**Solution:** App password might have spaces - remove them:
```bash
# Wrong: wxyz abcd efgh ijkl
# Right: wxyzabcdefghijkl
```

### **Emails not arriving**
**Check:**
1. Spam folder (both yours and customer's)
2. Backend logs: `tail -f /var/log/supervisor/backend.err.log`
3. Test with your own email first
4. Verify sender email is correct in .env

---

## 🚀 What Happens Now

### **When Customer Books:**
1. Customer completes booking and pays via Stripe ✅
2. Backend receives payment confirmation ✅
3. **Email automatically sent** via Google Workspace ✅
4. SMS sent via Twilio (if configured) ✅
5. Google Calendar event created (if configured) ✅

### **Email Content Includes:**
- Booking reference number
- Service type
- Pickup & drop-off addresses
- Date and time
- Number of passengers
- Total price paid
- Contact information

---

## 📊 Email Limits

### **Google Workspace Limits:**
- **Free Gmail:** 500 emails/day
- **Google Workspace:** 2,000 emails/day per user
- Rate: ~20-30 emails per minute

### **For Your Business:**
If you get more than 2,000 bookings per day:
- Use multiple sender accounts
- Upgrade to SendGrid/Mailgun (paid)
- Or use AWS SES (0.10 per 1000 emails)

---

## 💡 Best Practices

### **1. Monitor Email Delivery**
Check backend logs regularly:
```bash
tail -f /var/log/supervisor/backend.err.log | grep "email"
```

### **2. Test After Every Change**
Always test email after:
- Changing .env variables
- Restarting backend
- Deploying to production

### **3. Keep App Password Secure**
- Don't share it
- Don't commit it to Git (it's in .env, which should be .gitignored)
- Rotate it every 6-12 months

### **4. Professional Email Template**
The current email includes:
- Company branding (colors, logo reference)
- All booking details
- Contact information
- Professional footer

---

## 🔄 Switching Back to SendGrid (If Needed)

If you later want to use SendGrid instead:

1. Revert code changes (I can help)
2. Update .env:
   ```bash
   SENDGRID_API_KEY=your_key
   SENDER_EMAIL=noreply@bookaride.co.nz
   ```
3. Restart backend

---

## ✅ Checklist

- [ ] 2-Step Verification enabled on Google account
- [ ] App password generated
- [ ] Updated `/app/backend/.env` with credentials
- [ ] Restarted backend: `sudo supervisorctl restart backend`
- [ ] Tested with test script - email received
- [ ] Tested real booking - confirmation received
- [ ] Checked spam folder
- [ ] Verified backend logs show "email sent"

---

## 📞 Support

If you still have issues after following this guide:
- Check backend logs for specific error messages
- Verify Google Workspace account is active
- Ensure domain (bookaride.co.nz) is verified in Google
- Let me know the exact error message you're seeing

---

**Status After Setup:**
✅ Email confirmations working
✅ Professional, branded emails
✅ No monthly API costs (included with Google Workspace)
✅ Can send from your business domain
✅ 2,000 emails/day limit (sufficient for most operations)

**Setup Time:** 10-15 minutes
**Cost:** Free (included with Google Workspace)
**Reliability:** High (Google infrastructure)
