# Google Calendar Authorization - Troubleshooting Guide

## The Problem

The OAuth endpoint IS working and redirecting you to Google, but Google is likely rejecting it because of a **redirect URI mismatch**.

## The Solution

You need to add the correct redirect URI to your Google Cloud Console.

### Step 1: Find Your OAuth Client

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: **191372027842-0i5of06ta51t4s3p8u09dm8aa8j7segl**
3. Click on it to edit

### Step 2: Add These Exact Redirect URIs

In the "Authorized redirect URIs" section, add ALL of these:

```
http://localhost:8001/api/auth/google/callback
https://bookaride.co.nz/api/auth/google/callback
https://www.bookaride.co.nz/api/auth/google/callback
https://bookaridenz.com/api/auth/google/callback
```

**IMPORTANT:** They must match EXACTLY. No trailing slashes!

### Step 3: Save and Wait

1. Click **Save** at the bottom
2. Wait 1-2 minutes for changes to propagate

### Step 4: Try Again

Visit: **https://bookaride.co.nz/api/auth/google/login**

You should now:
1. Be redirected to Google
2. See a sign-in page
3. Be able to authorize

---

## Alternative: Use localhost for testing

If you want to test right now without DNS propagation:

1. Visit: **http://localhost:8001/api/auth/google/login** (from the server)
2. This should work immediately if you added the localhost redirect URI

---

## Still Not Working?

Check if you see an error message like:
- "redirect_uri_mismatch"
- "Error 400: redirect_uri_mismatch"

If yes, the redirect URI in Google Console doesn't match what the backend is sending.

**To fix:**
1. Check what redirect URI the backend is generating
2. Add that EXACT URI to Google Console

---

## What Happens After Authorization?

Once authorized successfully:
1. You'll be redirected back to your site
2. You should see a success message
3. Calendar events will be created automatically for all new bookings
4. Check your Google Calendar to confirm

---

**Current OAuth Client ID:** `191372027842-0i5of06ta51t4s3p8u09dm8aa8j7segl`  
**Current Client Secret:** `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`

Both are correctly configured in the backend.
