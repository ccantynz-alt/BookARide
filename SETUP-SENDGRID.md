# SendGrid setup (often easier than Google)

SendGrid only needs **one API key** – no App Passwords, no 2FA, no SMTP. The booking system uses it for all confirmation and admin emails when `SENDGRID_API_KEY` is set.

---

## 1. Create a SendGrid account and API key

1. Sign up at **https://sendgrid.com** (free tier is enough to start).
2. Go to **Settings → API Keys** (or **https://app.sendgrid.com/settings/api_keys**).
3. Click **Create API Key**.
4. Name it (e.g. "Book a Ride"), choose **Restricted Access** or **Full Access** (Restricted: enable only **Mail Send**).
5. Click **Create & View**, then **copy the key**. You won’t see it again.

---

## 2. Verify your sender (required by SendGrid)

SendGrid must have a verified sender for the "From" address.

1. Go to **Settings → Sender Authentication** (or **Single Sender Verification**).
2. Add a **Single Sender** (or use **Domain Authentication** if you prefer):
   - **From Name:** e.g. Book a Ride NZ  
   - **From Email:** the address you want to send from (e.g. `bookings@bookaride.co.nz`).  
   - Fill in the rest and submit. SendGrid will send a verification link to that email – click it.

---

## 3. Set env vars

**Local (backend `.env`):**

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
NOREPLY_EMAIL=bookings@bookaride.co.nz
```

Use the **same** address as the verified sender for `NOREPLY_EMAIL`.

**Render:**  
In your backend service → **Environment**, add:

- **SENDGRID_API_KEY** = your API key  
- **NOREPLY_EMAIL** = your verified sender email (e.g. `bookings@bookaride.co.nz`)

Then **redeploy**.

---

## 4. Test

- Open **https://your-backend.onrender.com/api/email-status** – you should see `sendgrid_configured: true`.
- Use **Admin → test email** (or `POST /api/admin/test-email` with body `{"to":"your@email.com"}`) and check your inbox.

---

## Summary

| Step              | What to do |
|-------------------|------------|
| API key           | SendGrid → Settings → API Keys → Create, copy key. |
| Sender            | Single Sender Verification: add and verify the From email. |
| Env               | Set `SENDGRID_API_KEY` and `NOREPLY_EMAIL` (same as verified sender). |
| Deploy            | Redeploy backend after changing env (e.g. on Render). |

No SMTP, no Google App Passwords – just one key and a verified sender.
