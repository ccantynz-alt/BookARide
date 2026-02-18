# Send Emails via Google Workspace (Gmail)

You can use your Google Workspace account (e.g. `info@bookaride.co.nz`) to send emails from the website instead of Mailgun. No extra cost – it uses your existing Google account.

The system tries providers in order: **Mailgun → Gmail API (service account) → SMTP App Password**. Use whichever option suits your setup.

---

## Option A: Gmail API via Service Account (Recommended)

This uses a Google service account with domain-wide delegation — no passwords, no App Passwords, and it's the most reliable method for Google Workspace accounts.

### 1. Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**, give it a name (e.g. `bookaride-email`)
3. Click **Create and Continue**, skip optional roles, click **Done**
4. Click the service account → **Keys** tab → **Add Key** → **Create new key** → **JSON**
5. Download the JSON file — you'll paste its contents into Render

### 2. Enable Domain-Wide Delegation

1. In the service account page, click **Edit** → check **Enable Google Workspace Domain-wide Delegation** → Save
2. Go to [Google Workspace Admin](https://admin.google.com/) → **Security** → **API Controls** → **Domain-wide Delegation**
3. Click **Add new** and enter:
   - **Client ID**: the service account's numeric Client ID (visible on the service account page)
   - **OAuth Scopes**: `https://www.googleapis.com/auth/gmail.send`
4. Click **Authorize**

### 3. Enable the Gmail API

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Library** → search for **Gmail API** → Enable it.

### 4. Add Environment Variables to Render

In **Render** → your backend service → **Environment**, add:

| Variable | Value |
|----------|-------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | The full contents of the downloaded JSON key file (paste entire JSON as one line) |
| `NOREPLY_EMAIL` | Address to send from — must be a real Google Workspace user (e.g. `noreply@bookaride.co.nz`) |

> **Important:** `NOREPLY_EMAIL` must be a real Google Workspace mailbox (or alias). The service account impersonates this address to send. If it's not a real user in your domain, Google will return a delegation error.

### 5. Redeploy

Click **Manual Deploy** in Render so the new env var is picked up.

---

## Option B: SMTP App Password (Simpler Setup)

### 1. Create an App Password

1. Go to [Google Account](https://myaccount.google.com/) → **Security**
2. Turn on **2-Step Verification** if it's not already on
3. Go to **2-Step Verification** → **App passwords**
4. Create a new app password:
   - App: **Mail**
   - Device: **Other** → name it "Book A Ride"
5. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)

> **Do not use your normal Google password** — Google blocks it. The App Password is different.

### 2. Add Environment Variables to Render

In **Render** → your backend service → **Environment**, add:

| Variable | Value |
|----------|-------|
| `SMTP_USER` | Your Google Workspace email (e.g. `info@bookaride.co.nz`) |
| `SMTP_PASS` | The 16-character App Password (no spaces) |
| `NOREPLY_EMAIL` | Address for customer confirmations (e.g. `noreply@bookaride.co.nz`) |
| `SENDER_EMAIL` | Fallback if NOREPLY_EMAIL not set (e.g. `noreply@bookaride.co.nz`) |

**Optional** (defaults work for most setups):

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | Use for Gmail/Google Workspace |
| `SMTP_PORT` | `587` | TLS port |

### 3. Redeploy

Click **Manual Deploy** in Render so the new env vars are picked up.

---

## How It Works

- **Mailgun** is used first if `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set.
- **Gmail API** is tried second if `GOOGLE_SERVICE_ACCOUNT_JSON` or `GOOGLE_SERVICE_ACCOUNT_FILE` is set.
- **Google Workspace SMTP** is used as final fallback if `SMTP_USER` and `SMTP_PASS` are set.
- You only need one of these configured.

## Sending from noreply@

Customer confirmations, payment links, and reminders are sent from `noreply@bookaride.co.nz` (or whatever you set in `NOREPLY_EMAIL`). With Google Workspace:

- Add `noreply@bookaride.co.nz` as an **alias** for your user in Admin Console → Users → [your user] → User information → Email aliases
- Or create a **Group** `noreply@bookaride.co.nz` and add your user as owner
- If your domain is verified, sending from `noreply@` works once the alias is added

## Sending Limits

- **Google Workspace**: about 2,000 emails/day (varies by plan)
- **Gmail (free)**: about 500/day

For a typical booking site, Google Workspace limits are usually enough.

## Diagnosing Issues

Use the admin test-email endpoint to see exactly which provider fails and why:

```
POST /api/admin/test-email
{"to": "your@email.com"}
```

Response includes `provider_errors` for each provider so you can see the actual error message from Google.

## Troubleshooting

**"Username and Password not accepted" (SMTP)**
- Use an **App Password**, not your normal Google password
- Remove spaces from the App Password
- Ensure 2-Step Verification is enabled on the Google account

**"delegation denied" or HttpError 403 (Gmail API)**
- The service account does not have domain-wide delegation granted for this user
- Go to Google Workspace Admin → Security → API Controls → Domain-wide Delegation and check the entry exists with scope `https://www.googleapis.com/auth/gmail.send`
- Ensure `NOREPLY_EMAIL` is a real Google Workspace user in your domain (not a group or an address outside your domain)

**"Could not deserialize key data" (Gmail API)**
- The `GOOGLE_SERVICE_ACCOUNT_JSON` value in Render may be malformed
- Make sure you pasted the entire JSON contents including the outer `{ }` braces
- If the private key shows `\\n` instead of newlines, the code will fix it automatically

**Emails not arriving**
- Check spam/junk
- Confirm `SENDER_EMAIL` / `NOREPLY_EMAIL` matches a real address in your Google Workspace
- Check Render logs for provider-specific error messages

**"Less secure app" errors**
- Google no longer supports "less secure apps"
- Use an App Password (Option B) or the service account approach (Option A) instead
