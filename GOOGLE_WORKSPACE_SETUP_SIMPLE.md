# Google Workspace Email Setup - Simple Checklist

Follow these steps in order. Each step has a direct link - just click and follow.

---

## ✅ Step 1: Create a Google Cloud Project (2 min)

1. **Click:** https://console.cloud.google.com/projectcreate
2. Project name: `BookaRide Email`
3. Click **Create**
4. Wait for it to finish

---

## ✅ Step 2: Enable Gmail API (1 min)

1. **Click:** https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. Make sure "BookaRide Email" project is selected (top dropdown)
3. Click **Enable**

---

## ✅ Step 3: Create Service Account (2 min)

1. **Click:** https://console.cloud.google.com/iam-admin/serviceaccounts/create
2. Service account name: `bookaride-email-sender`
3. Click **Create and Continue**
4. Click **Done** (skip the optional steps)

---

## ✅ Step 4: Download the JSON Key (1 min)

1. You should see your new service account - **click on it**
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Choose **JSON** → **Create**
5. A file downloads - **save it somewhere safe**
6. Rename it to: `bookaride-gmail-credentials.json`

---

## ✅ Step 5: Enable Domain-Wide Delegation (2 min)

1. Still on the service account page, click **Show advanced settings** (or scroll down)
2. Find **Domain-wide delegation**
3. Check **Enable Google Workspace Domain-wide Delegation**
4. Product name: `BookaRide Email`
5. Click **Save**
6. **Copy the Client ID** (the long number) - you need it for Step 6

---

## ✅ Step 6: Authorize in Google Workspace Admin (CRITICAL - 2 min)

**You need to be a Google Workspace admin for bookaride.co.nz**

1. **Click:** https://admin.google.com/ac/owl/domainwidedelegation
2. Click **Add new**
3. **Client ID:** Paste the number from Step 5
4. **OAuth Scopes:** Copy-paste this exactly:
   ```
   https://www.googleapis.com/auth/gmail.send
   ```
5. Click **Authorize**

---

## ✅ Step 7: Add Credentials to Your Project

### If using Render (hosted):

1. Go to your Render dashboard → your backend service
2. **Environment** → **Add Environment Variable**
3. Add:
   - **Key:** `GOOGLE_SERVICE_ACCOUNT_JSON`
   - **Value:** Open your JSON file, copy EVERYTHING, paste as one line (no line breaks)
4. Add:
   - **Key:** `SENDER_EMAIL`
   - **Value:** `noreply@bookaride.co.nz`
5. Save - Render will redeploy automatically

### If running locally or on your own server:

1. Put `bookaride-gmail-credentials.json` in the `backend/` folder
2. Create or edit `.env` in the project root with:
   ```
   GOOGLE_SERVICE_ACCOUNT_FILE=backend/bookaride-gmail-credentials.json
   SENDER_EMAIL=noreply@bookaride.co.nz
   ```

---

## ✅ Step 8: Test It

From the project root:

```bash
# Test that credentials load (no email sent)
cd backend && python test_gmail_setup.py

# Send a real test email to yourself
cd backend && python test_gmail_setup.py your-email@example.com
```

If you see "All checks passed!" - you're done! 🎉

---

## ❓ Something went wrong?

| Error | Fix |
|-------|-----|
| "Delegation denied" | Re-do Step 6 - make sure Client ID and scope are exact |
| "File not found" | Check the path in GOOGLE_SERVICE_ACCOUNT_FILE |
| "Invalid grant" | Step 6 might not have saved - try again |
| "noreply@bookaride.co.nz doesn't exist" | Create that user in Google Workspace, or use an email that exists |

---

## 📞 Need the JSON as env var?

For Render/Heroku, you need the JSON as one line. Open the file, and either:
- Manually remove all line breaks and paste, OR
- Use: `cat bookaride-gmail-credentials.json | tr -d '\n'` (Mac/Linux) to get one line
