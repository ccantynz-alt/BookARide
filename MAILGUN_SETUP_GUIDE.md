# Mailgun Setup Guide - Simple & Fast!
## For BookaRide.co.nz Email Confirmations

---

## ✅ Why Mailgun?

- 💰 **5,000 FREE emails/month**
- ⚡ **5-minute setup**
- 🎯 **Designed for transactional emails**
- 🔒 **Reliable & secure**
- 📊 **Great delivery tracking**

---

## 🚀 **Step-by-Step Setup**

### **Step 1: Sign Up (2 minutes)**

1. Go to: https://signup.mailgun.com/new/signup
2. Fill in:
   - **Email:** your email
   - **Password:** create a password
   - **Company name:** BookaRide NZ
3. Click "**Sign Up**"
4. **Verify your email** (check inbox for confirmation link)

---

### **Step 2: Get Your API Key (1 minute)**

1. After logging in, go to: https://app.mailgun.com/app/account/security/api_keys
2. Find "**Private API key**"
3. Click "**Copy**" (it looks like: `key-abc123def456...`)
4. **Save this somewhere** - you'll need it in Step 4

---

### **Step 3: Add Sending Domain (2 minutes)**

You have two options:

#### **Option A: Use Mailgun Sandbox (Testing - Instant)**
- Mailgun gives you a sandbox domain for testing
- Format: `sandboxXXXXX.mailgun.org`
- Can send to **verified recipients only**
- Good for testing immediately

#### **Option B: Add Your Domain (Production - Takes 24 hours)**
1. Go to: https://app.mailgun.com/app/sending/domains
2. Click "**Add New Domain**"
3. Enter: `mg.bookaride.co.nz` (recommended subdomain)
4. Click "**Add Domain**"
5. **Add DNS records** to your domain (Mailgun will show you exactly what to add)
6. Wait for verification (usually 24 hours)

**Recommendation:** Start with **Option A** (sandbox) to test immediately, then switch to **Option B** for production.

---

### **Step 4: Send Me Your Credentials**

I need two things:

1. **API Key:** The key you copied in Step 2 (starts with `key-`)
2. **Domain:** Either:
   - Your sandbox domain (e.g., `sandbox123abc.mailgun.org`), OR
   - Your custom domain after verification (e.g., `mg.bookaride.co.nz`)

**Just reply with:**
```
API Key: key-abc123...
Domain: sandboxXXXX.mailgun.org
```

---

### **Step 5: I'll Configure Everything (1 minute)**

Once you send me those, I'll:
1. Update the .env file
2. Restart the backend
3. Send a test email
4. Confirm it's working!

---

## 🧪 **Testing with Sandbox Domain**

If using sandbox for testing first:

1. **Add authorized recipients:**
   - Go to: https://app.mailgun.com/app/sending/domains/[your-sandbox-domain]
   - Click "Authorized Recipients"
   - Add your email address
   - Verify the email sent to you

2. **Now you can test!**
   - Make a test booking
   - Email will be sent successfully

3. **Later, switch to your domain:**
   - Once `mg.bookaride.co.nz` is verified
   - Tell me the new domain
   - I'll update the config
   - Can send to ANY email address!

---

## 📧 **Setting Up Your Domain (Optional - For Production)**

### **Recommended Domain Setup:**
Use a subdomain like `mg.bookaride.co.nz` instead of `bookaride.co.nz`

**Why?**
- Keeps main domain clean
- Better email deliverability
- Industry standard practice

### **DNS Records to Add:**
Mailgun will give you exact records, typically:
- 2 **TXT records** (for SPF and DKIM)
- 1 **MX record** (optional, for receiving)
- 1 **CNAME record** (for tracking)

**Where to add these:**
- Your domain registrar (where you bought bookaride.co.nz)
- Usually in "DNS Management" or "DNS Settings"

---

## 💰 **Pricing Breakdown**

### **Free Tier (What You'll Use):**
- **5,000 emails/month: FREE**
- Good for: ~160 bookings/day (if every booking = 1 email)

### **If You Grow Beyond 5,000/month:**
- 5,001 - 50,000 emails: $35/month
- 50,001 - 100,000 emails: $80/month

**For most shuttle businesses, free tier is plenty!**

---

## 📊 **What Happens After Setup**

### **Email Flow:**
1. Customer completes booking & pays ✅
2. Backend automatically calls Mailgun API ✅
3. Mailgun sends professional email ✅
4. Customer receives confirmation instantly ✅

### **Email Content:**
- From: BookaRide <noreply@bookaride.co.nz>
- Subject: Booking Confirmation - [Reference]
- Content: Branded HTML email with:
  - Booking reference
  - Service details
  - Pickup/dropoff
  - Date/time
  - Price paid
  - Contact information

---

## ✅ **Features You Get**

- 📧 **Email tracking** - See delivery status
- 📊 **Analytics dashboard** - Open rates, clicks
- 🔄 **Webhooks** - Get notified of bounces
- 📝 **Email logs** - See all sent emails
- 🎨 **Template management** - Store email templates
- 🚨 **Bounce handling** - Automatic bad email detection

---

## 🆘 **Troubleshooting**

### **"Authorized recipients only"**
- You're using sandbox domain
- Add recipient email to authorized list
- Or verify your custom domain

### **"Invalid domain"**
- Check domain spelling
- Make sure it matches Mailgun dashboard exactly
- Include full domain (e.g., `sandbox123.mailgun.org`)

### **"Forbidden - API key invalid"**
- Check API key is correct
- Should start with `key-`
- No extra spaces

### **Emails not arriving**
- Check spam folder
- Verify recipient email is correct
- Check Mailgun logs: https://app.mailgun.com/app/logs

---

## 🔒 **Security Best Practices**

- ✅ API key in .env file (not in code)
- ✅ .env file not committed to Git
- ✅ Use subdomain for sending
- ✅ Monitor Mailgun logs regularly
- ✅ Keep API key private

---

## 📞 **Getting Help**

**Mailgun Support:**
- Docs: https://documentation.mailgun.com
- Support: https://www.mailgun.com/support

**Need help?**
- Send me your API key & domain
- I'll configure and test everything

---

## 🎯 **Quick Checklist**

- [ ] Signed up for Mailgun
- [ ] Verified email address
- [ ] Got API key from dashboard
- [ ] Got domain (sandbox or custom)
- [ ] (If sandbox) Added authorized recipient
- [ ] Sent API key & domain to agent
- [ ] Agent configured .env
- [ ] Backend restarted
- [ ] Test email sent successfully
- [ ] Ready for production!

---

## 🚀 **Next Steps**

1. **Sign up:** https://signup.mailgun.com/new/signup
2. **Get credentials:** API key + Domain
3. **Send to me:** I'll configure in 1 minute
4. **Test:** Send a test booking
5. **Done!** Emails working! 🎉

---

**Setup Time:** 5-10 minutes
**Cost:** $0/month (free tier)
**Emails:** 5,000/month included
**Reliability:** Very high (99.9% uptime)
