# Google Workspace Email Setup for Book a Ride

This guide configures **Google Workspace** (or Gmail) to send booking confirmations and other transactional emails from the Book a Ride backend.

The app already supports this: it uses **SMTP** with `smtp.gmail.com` when Mailgun is not configured or as a fallback. You only need to add the right environment variables and create an **App Password** in Google.

---

## 1. Use a Google Workspace or Gmail account

- Use the address you want to send **from** (e.g. `bookings@bookaride.co.nz` if it’s on Google Workspace, or `yourname@gmail.com`).
- That address will be used for:
  - Booking confirmations
  - Admin notifications
  - Password reset emails
  - Driver notifications
  - Payment link emails

---

## 2. Turn on 2-Step Verification (required for App Passwords)

1. Go to [Google Account → Security](https://myaccount.google.com/security).
2. Under **“How you sign in to Google”**, turn on **2-Step Verification** if it’s not already on.

---

## 3. Create an App Password

1. Go to [Google Account → Security → 2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification).
2. At the bottom, open **“App passwords”**.
3. Choose **“Mail”** and **“Other”**, name it e.g. **“Book a Ride backend”**.
4. Click **Generate**.
5. Copy the **16-character password** (e.g. `abcd efgh ijkl mnop`). You can store it with or without spaces; the app will use it as-is.

You’ll use this as `SMTP_PASS` in the next step.

---

## 4. Set environment variables

Add these to your backend environment (e.g. `.env` in the backend folder, or your host’s env vars like Render/Vercel).

### Required for Google Workspace SMTP

```env
# Google Workspace / Gmail SMTP (for confirmations and notifications)
SMTP_USER=bookings@bookaride.co.nz
SMTP_PASS=your-16-char-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

- **SMTP_USER**: Full email address (same as the Google account you created the App Password for).
- **SMTP_PASS**: The 16-character App Password from step 3.
- **SMTP_HOST** / **SMTP_PORT**: Defaults in the app are `smtp.gmail.com` and `587`; you can omit them if you use these.

### “From” address (what customers see)

```env
# Address shown as "From" on emails (use your domain for best deliverability)
NOREPLY_EMAIL=bookings@bookaride.co.nz
# Or:
SENDER_EMAIL=bookings@bookaride.co.nz
```

- Use an address that is either:
  - The same Google Workspace mailbox as `SMTP_USER`, or  
  - An alias/send-as address for that mailbox in Google.
- If you don’t set these, the app falls back to `noreply@bookaride.co.nz` (that address must be valid in Google if you use it).

### Optional: use only Google Workspace (no Mailgun)

To send **only** via Google Workspace and not use Mailgun:

- Do **not** set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (or remove them).
- Set the SMTP and sender variables above.

The app will use SMTP for all transactional emails when Mailgun is not configured.

---

## 5. Restart the backend

After changing env vars, restart the backend process (e.g. restart the server or redeploy).

---

## 6. Test that it works

1. **Create a test booking** on the site using a real email you can check.
2. Confirm you receive the **booking confirmation** at that address.
3. Optionally trigger **“Resend confirmation”** from the admin panel for an existing booking.

If you see “SMTP credentials not configured” in logs, double-check `SMTP_USER` and `SMTP_PASS` and that the App Password has no extra spaces.

---

## Diagnosing Issues

Use the admin test-email endpoint to see exactly which provider fails and why:

```
POST /api/admin/test-email
{"to": "your@email.com"}
```

Response includes `provider_errors` for each provider so you can see the actual error message from Google.

## Troubleshooting

| Issue | What to do |
|-------|------------|
| “Username and Password not accepted” | Use an **App Password**, not your normal Google password. Ensure 2-Step Verification is on and the App Password is for “Mail”. |
| “SMTP credentials not configured” | Ensure `SMTP_USER` and `SMTP_PASS` are set in the environment the backend actually uses (e.g. `.env` next to `server.py` or in the host’s dashboard). |
| Emails go to spam | Use a **Google Workspace** address on your own domain (e.g. `bookings@bookaride.co.nz`), set SPF/DKIM in Google Admin, and use that same address as `NOREPLY_EMAIL` / `SENDER_EMAIL`. |
| Wrong “From” address | Set `NOREPLY_EMAIL` or `SENDER_EMAIL` to the exact address you want; it must be the same as `SMTP_USER` or a configured send-as alias. |

---

## Summary

1. Enable 2-Step Verification on the Google account.
2. Create an App Password for “Mail”.
3. Set `SMTP_USER`, `SMTP_PASS`, and optionally `SMTP_HOST`, `SMTP_PORT`, `NOREPLY_EMAIL`/`SENDER_EMAIL`.
4. Omit or remove Mailgun vars to use only Google Workspace.
5. Restart the backend and test with a real booking.

After this, Book a Ride will send all confirmation and notification emails through Google Workspace.
