# SendGrid only – no Mailgun, no Google

The app sends email **only via SendGrid** now. Mailgun and Google Workspace SMTP are not used for booking confirmations.

---

## On Render (backend Environment)

**Set these:**

| Key | Value |
|-----|--------|
| **SENDGRID_API_KEY** | Your SendGrid API key |
| **NOREPLY_EMAIL** | Verified sender in SendGrid (e.g. `bookings@bookaride.co.nz`) |
| **BOOKINGS_NOTIFICATION_EMAIL** | Where admin copies go (e.g. `bookings@bookaride.co.nz`) |

**Remove or leave blank** (so nothing conflicts):

- **MAILGUN_API_KEY**
- **MAILGUN_DOMAIN**
- **SMTP_USER**
- **SMTP_PASS**
- **EMAIL_PROVIDER** (optional; if set, use `sendgrid`)

---

## Full setup

1. **SendGrid:** Create API key and verify the sender email (Single Sender Verification).  
   → See **SETUP-SENDGRID.md** for step-by-step.

2. **Render:** Add `SENDGRID_API_KEY` and `NOREPLY_EMAIL`; remove Mailgun and SMTP vars. Save and **Redeploy**.

3. **Check:** Open `https://your-backend.onrender.com/email-status`  
   - `email_provider`: `sendgrid`  
   - `sendgrid_configured`: `true`  
   - `email_configured`: `true`

4. **Test:** Do a test booking or use Admin → test email.

One provider (SendGrid) = no conflicts.
