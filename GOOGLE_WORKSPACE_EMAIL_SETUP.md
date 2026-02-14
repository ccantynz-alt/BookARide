# Send Emails via Google Workspace (Gmail)

You can use your Google Workspace account (e.g. `info@bookaride.co.nz`) to send emails from the website instead of Mailgun. No extra cost – it uses your existing Google account.

## Quick Setup (about 5 minutes)

### 1. Create an App Password

1. Go to [Google Account](https://myaccount.google.com/) → **Security**
2. Turn on **2-Step Verification** if it’s not already on
3. Go to **2-Step Verification** → **App passwords**
4. Create a new app password:
   - App: **Mail**
   - Device: **Other** → name it "Book A Ride"
5. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)

### 2. Add Environment Variables to Render

In **Render** → your backend service → **Environment**, add:

| Variable | Value |
|----------|-------|
| `SMTP_USER` | Your Google Workspace email (e.g. `info@bookaride.co.nz`) |
| `SMTP_PASS` | The 16-character App Password (no spaces) |
| `SENDER_EMAIL` | Same as SMTP_USER (e.g. `info@bookaride.co.nz`) |

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
- **Google Workspace SMTP** is used if Mailgun is not configured but `SMTP_USER` and `SMTP_PASS` are set.
- You can use either Mailgun or Google Workspace; you don’t need both.

## Sending Limits

- **Google Workspace**: about 2,000 emails/day (varies by plan)
- **Gmail (free)**: about 500/day

For a typical booking site, Google Workspace limits are usually enough.

## Troubleshooting

**"Username and Password not accepted"**
- Use an **App Password**, not your normal Google password
- Remove spaces from the App Password
- Ensure 2-Step Verification is enabled

**Emails not arriving**
- Check spam/junk
- Confirm `SENDER_EMAIL` matches your Google Workspace address
- Check Render logs for SMTP errors

**"Less secure app" errors**
- Google no longer supports “less secure apps”
- Use an App Password instead of your normal password
