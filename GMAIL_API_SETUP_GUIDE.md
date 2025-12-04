# Gmail API Setup Guide - The Right Way!
## For BookaRide.co.nz Email Confirmations

You're absolutely right - using Gmail API is the proper way to do this! Much more secure and reliable than SMTP app passwords.

---

## 📋 **Step-by-Step Setup**

### **Step 1: Google Cloud Console - Create Project**

1. Go to: https://console.cloud.google.com
2. Click the project dropdown at the top
3. Click "**New Project**"
4. **Project name:** BookaRide Email Service
5. Click "**Create**"
6. Wait for project to be created (takes ~10 seconds)

---

### **Step 2: Enable Gmail API**

1. Make sure your new project is selected
2. Go to: https://console.cloud.google.com/apis/library
3. Search for "**Gmail API**"
4. Click on "Gmail API"
5. Click "**Enable**"

---

### **Step 3: Create Service Account**

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Make sure correct project is selected at top
3. Click "**+ CREATE SERVICE ACCOUNT**"
4. Fill in:
   - **Service account name:** bookaride-email-sender
   - **Service account ID:** (auto-filled)
   - **Description:** Sends booking confirmation emails
5. Click "**CREATE AND CONTINUE**"
6. **Skip** the optional steps (Grant access, Grant users access)
7. Click "**DONE**"

---

### **Step 4: Create Service Account Key (JSON)**

1. Click on the service account you just created ("bookaride-email-sender")
2. Go to "**Keys**" tab at the top
3. Click "**ADD KEY**" dropdown
4. Select "**Create new key**"
5. Choose "**JSON**" format
6. Click "**Create**"
7. **JSON file will download** - save it securely!
8. Rename it to something simple like `bookaride-gmail-credentials.json`

---

### **Step 5: Enable Domain-Wide Delegation**

1. Still in the service account details page
2. Click "**SHOW ADVANCED SETTINGS**" or scroll down
3. Find "**Domain-wide delegation**"
4. Check the box: "**Enable Google Workspace Domain-wide Delegation**"
5. **Product name:** BookaRide Email Service
6. Click "**SAVE**"
7. **IMPORTANT:** Copy the "**Client ID**" (long number like: 123456789012345678901)

---

### **Step 6: Authorize in Google Workspace Admin Console**

This is the critical step that allows the service account to send emails as noreply@bookaride.co.nz

1. Go to: https://admin.google.com
2. Sign in as a Google Workspace **admin** for bookaride.co.nz
3. Navigate to: **Security** → **Access and data control** → **API controls**
4. Scroll to "**Domain-wide delegation**"
5. Click "**MANAGE DOMAIN-WIDE DELEGATION**"
6. Click "**Add new**"
7. Fill in:
   - **Client ID:** Paste the Client ID from Step 5
   - **OAuth scopes:** `https://www.googleapis.com/auth/gmail.send`
8. Click "**Authorize**"

---

### **Step 7: Upload JSON File to Server**

You need to upload the JSON credentials file to the server.

**Option A - Using the file upload (if available):**
- Upload `bookaride-gmail-credentials.json` to `/app/backend/`

**Option B - Copy/paste method:**
1. Open the JSON file on your computer
2. Copy all its contents
3. Tell me you're ready and I'll create the file on the server

---

### **Step 8: Update Environment Variables**

Once the JSON file is on the server at `/app/backend/bookaride-gmail-credentials.json`, update `.env`:

```bash
GOOGLE_SERVICE_ACCOUNT_FILE=/app/backend/bookaride-gmail-credentials.json
SENDER_EMAIL=noreply@bookaride.co.nz
```

---

### **Step 9: Restart Backend & Test**

```bash
sudo supervisorctl restart backend
```

Then test with a booking or run test script.

---

## 📝 **What the JSON File Looks Like**

Your downloaded JSON should look something like this:
```json
{
  "type": "service_account",
  "project_id": "bookaride-email-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "bookaride-email-sender@...",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

---

## ✅ **Why This is Better**

### **Gmail API (What we're doing now):**
- ✅ More secure (OAuth 2.0, no passwords)
- ✅ Recommended by Google
- ✅ Works with Google Workspace
- ✅ No 2-Step Verification hassles
- ✅ Better for automation
- ✅ More reliable
- ✅ Domain-wide delegation for sending as any user

### **SMTP with App Password (Old way):**
- ❌ Requires 2-Step Verification
- ❌ App password management hassle
- ❌ Less secure
- ❌ Google is phasing this out
- ❌ Authentication issues

---

## 🔒 **Security Notes**

### **Keep JSON File Secure:**
- ❌ Never commit to Git
- ❌ Never share publicly
- ✅ Store in secure location
- ✅ Add to .gitignore

### **Service Account Permissions:**
- Only has `gmail.send` scope
- Can only send emails
- Cannot read emails
- Cannot delete emails
- Cannot access other data

---

## 🧪 **Testing After Setup**

After completing all steps, test with:

```python
# Test script will be created once JSON is uploaded
python3 /tmp/test_gmail_api.py
```

---

## ❓ **Troubleshooting**

### **Error: "Delegation denied"**
- Make sure you completed Step 6 (Domain-wide delegation in Admin Console)
- Check Client ID matches exactly
- Check scope is correct: `https://www.googleapis.com/auth/gmail.send`

### **Error: "File not found"**
- Make sure JSON file is at `/app/backend/bookaride-gmail-credentials.json`
- Check file path in .env is correct

### **Error: "Invalid grant"**
- Service account might not have permission
- Re-do Step 6 in Admin Console

---

## 📊 **Email Limits**

With Gmail API:
- **Google Workspace:** 2,000 emails/day per user
- **Free Gmail:** 500 emails/day
- Rate: Up to 50 emails per second

---

## 🎯 **Current Status**

- ✅ Code updated to use Gmail API
- ✅ Backend restarted
- ⏳ **Needs:** JSON credentials file uploaded
- ⏳ **Needs:** Domain-wide delegation configured

---

## 📞 **Next Steps**

1. **Complete Steps 1-6** above to create service account and enable delegation
2. **Upload or send me the JSON file** content
3. **I'll configure the server** with the credentials
4. **Test** to make sure it works!

Much cleaner and more professional approach! 🚀
