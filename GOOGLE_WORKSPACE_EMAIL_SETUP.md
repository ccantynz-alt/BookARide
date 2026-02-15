# Send Emails via Google Workspace (Gmail API or SMTP)

All booking confirmations, reminders, admin notifications, and other transactional emails are now sent using your existing Google Workspace account - no extra cost on top of what you already pay for Google.

## Email Provider Priority

The system tries providers in this order:

1. **Gmail API** (recommended) - Uses a service account with domain-wide delegation
2. **Google Workspace SMTP** - Uses an App Password
3. **Mailgun** - Kept as last-resort fallback only

You only need **one** of these configured. Gmail API is the best option.

---

## Option A: Gmail API (Recommended)

This is the most secure and reliable method. Uses OAuth 2.0 via a service account.

### Setup Steps

1. **Enable Gmail API** in Google Cloud Console
   - Go to [APIs & Services](https://console.cloud.google.com/apis/library)
   - Search for "Gmail API" and enable it

2. **Create or reuse a Service Account**
   - You can use the existing `service_account.json` (already set up for Calendar)
   - Or create a dedicated one at [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)

3. **Enable Domain-Wide Delegation**
   - In the service account details, enable "Domain-wide delegation"
   - Copy the **Client ID**

4. **Authorize in Google Admin Console**
   - Go to [admin.google.com](https://admin.google.com) > Security > API controls > Domain-wide delegation
   - Click "Add new"
   - **Client ID**: paste from step 3
   - **OAuth scopes**: `https://www.googleapis.com/auth/gmail.send`
   - Click "Authorize"

5. **Add Environment Variables** (in Render or your hosting):

| Variable | Value | Required? |
|----------|-------|-----------|
| `GMAIL_DELEGATED_USER` | `noreply@bookaride.co.nz` (the Google Workspace user to send as) | Yes |
| `GOOGLE_SERVICE_ACCOUNT_FILE` | Path to service account JSON (e.g. `/app/backend/service_account.json`) | Only if not using default |

If the service account JSON is at `backend/service_account.json`, it will be found automatically.

### Environment Variable Alternatives

- `GOOGLE_SERVICE_ACCOUNT_JSON` - Raw JSON string (useful for Render secrets / Docker)
- `NOREPLY_EMAIL` or `SENDER_EMAIL` - Fallback sender address if `GMAIL_DELEGATED_USER` is not set

---

## Option B: Google Workspace SMTP (Simpler but less secure)

Uses a Gmail App Password. Simpler to set up but Google is phasing out App Passwords.

### Setup Steps

1. Go to [Google Account](https://myaccount.google.com/) > Security
2. Turn on **2-Step Verification**
3. Go to 2-Step Verification > **App passwords**
4. Create a new app password (name it "Book A Ride")
5. Copy the 16-character password

### Environment Variables

| Variable | Value |
|----------|-------|
| `SMTP_USER` | Your Google Workspace email (e.g. `info@bookaride.co.nz`) |
| `SMTP_PASS` | The 16-character App Password (no spaces) |
| `NOREPLY_EMAIL` | Address for customer confirmations (e.g. `noreply@bookaride.co.nz`) |

Optional (defaults work for Gmail):

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server |
| `SMTP_PORT` | `587` | TLS port |

---

## Sending from noreply@

To send emails from `noreply@bookaride.co.nz`:

- **Gmail API**: Set `GMAIL_DELEGATED_USER=noreply@bookaride.co.nz` and ensure the service account has delegation permission for that user
- **SMTP**: Add `noreply@bookaride.co.nz` as an alias in Admin Console > Users > [your user] > Email aliases

---

## Email Sending Limits

- **Google Workspace**: ~2,000 emails/day per user
- **Gmail (free)**: ~500/day

For a booking site, Google Workspace limits are typically more than enough.

---

## Troubleshooting

### Gmail API: "Delegation denied"
- Complete step 4 above (Domain-wide delegation in Admin Console)
- Check Client ID matches exactly
- Check scope is `https://www.googleapis.com/auth/gmail.send`

### Gmail API: "File not found"
- Check `GOOGLE_SERVICE_ACCOUNT_FILE` path or ensure `service_account.json` exists in `backend/`

### SMTP: "Username and Password not accepted"
- Use an **App Password**, not your Google password
- Remove spaces from the App Password
- Ensure 2-Step Verification is enabled

### Emails not arriving
- Check spam/junk folder
- Check Render logs for errors (search for "email" or "Gmail")

---

## Checking Configuration

The backend logs which email provider is configured at startup. You can also check:

```python
from email_sender import is_email_configured, get_configured_provider

print(f"Email configured: {is_email_configured()}")
print(f"Provider: {get_configured_provider()}")
```

---

## Migration from Mailgun

If you previously used Mailgun, you can now remove the `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` environment variables from Render. The system no longer needs Mailgun and won't use it unless Gmail API and SMTP are both unconfigured.

All email sending now goes through the unified sender in `backend/email_sender.py`.
