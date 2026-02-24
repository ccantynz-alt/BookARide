# One email provider only (no conflicts)

To get confirmations working and avoid conflicts, use **one** provider and turn the others off.

---

## Use Mailgun only (you said it was fast and easy)

On **Render** → your **backend** service → **Environment**:

### 1. Set these (Mailgun only)

| Key | Value |
|-----|--------|
| **EMAIL_PROVIDER** | `mailgun` |
| **MAILGUN_API_KEY** | your Mailgun API key |
| **MAILGUN_DOMAIN** | your sending domain (e.g. `mg.bookaride.co.nz`) |
| **NOREPLY_EMAIL** | address you send from (e.g. `bookings@bookaride.co.nz`) |
| **BOOKINGS_NOTIFICATION_EMAIL** | where admin copies go (e.g. `bookings@bookaride.co.nz`) |

### 2. Remove or leave blank

- **SENDGRID_API_KEY** – delete or leave empty  
- **SMTP_USER** – delete or leave empty  
- **SMTP_PASS** – delete or leave empty  

So only Mailgun is configured. The app will use **only** Mailgun when `EMAIL_PROVIDER=mailgun`.

### 3. Redeploy

Save env, then **Redeploy** the backend. After deploy, open:

`https://your-backend.onrender.com/email-status`

You should see:

- `"email_provider": "mailgun"`
- `"mailgun_configured": true`
- `"email_configured": true`

Then do a test booking and check that the confirmation email arrives.

---

## If you prefer SendGrid only

Set:

- **EMAIL_PROVIDER** = `sendgrid`
- **SENDGRID_API_KEY** = your key
- **NOREPLY_EMAIL** = verified sender

Remove or leave blank: **MAILGUN_API_KEY**, **MAILGUN_DOMAIN**, **SMTP_USER**, **SMTP_PASS**. Redeploy.

---

## If you prefer Google SMTP only

Set:

- **EMAIL_PROVIDER** = `smtp`
- **SMTP_USER** = e.g. `bookings@bookaride.co.nz`
- **SMTP_PASS** = your App Password
- **NOREPLY_EMAIL** = same as SMTP_USER

Remove or leave blank: **MAILGUN_***, **SENDGRID_API_KEY**. Redeploy.

---

**Summary:** Set **EMAIL_PROVIDER** to one of `mailgun`, `sendgrid`, or `smtp`, set that provider’s credentials, and remove or leave blank the others. One provider = no conflicts.
