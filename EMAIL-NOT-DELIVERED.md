# Emails not being delivered – what to check

If booking confirmations (customer or admin copy) are not arriving, work through this list.

---

## 0. Check the live server (Render) first

**If your bookings come from the live site (bookaride.co.nz), the backend running is on Render.** The `.env` on your PC is not used there. You must set SMTP in **Render → your backend service → Environment**.

1. **See if the server has email configured**  
   Open in a browser (use your real backend URL):
   ```
   https://bookaride-backend.onrender.com/api/email-status
   ```
   - If `smtp_configured` is **false**, add **SMTP_USER** and **SMTP_PASS** in Render Environment, then **redeploy**.
   - If `smtp_configured` is **true** but you still get no email, do step 2.

2. **Get the exact error from the server**  
   Log in to the admin dashboard, then in the browser console (F12) run:
   ```javascript
   fetch('https://bookaride-backend.onrender.com/api/admin/test-email', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
     body: JSON.stringify({ to: 'your@email.com' })
   }).then(r => r.json()).then(console.log).catch(console.error);
   ```
   Replace `your@email.com` and use your real admin token. The response will say **success** or show the **exact error** (e.g. "Username and Password not accepted" → use an App Password).

---

## 1. Run the test script locally (see the exact error)

From the **BookARide** folder:

```powershell
cd C:\Users\ccant\BookARide\backend
python scripts/test_email_send.py your@email.com
```

Replace `your@email.com` with an address you can check. The script will:

- Show whether `SMTP_USER` and `SMTP_PASS` are set
- Try to send one email and print **SUCCESS** or the **exact error** (e.g. "Username and Password not accepted")

That error tells you what to fix below.

---

## 2. Backend is using the right env

- **Local:** The backend loads `backend\.env`. Run the backend from the repo (or ensure the process’s working directory is such that `backend\.env` is found). If you run from another folder, env vars may be missing.
- **Render:** Env vars are set in the **Render dashboard** for the backend service, not from a file. Add `SMTP_USER`, `SMTP_PASS`, `NOREPLY_EMAIL`, `BOOKINGS_NOTIFICATION_EMAIL` (and optional Mailgun vars) in **Environment** for that service. Redeploy after changing env.

---

## 3. Google Workspace: use App Password and matching From

- **App Password:** You must use a **16-character App Password** from [Google App Passwords](https://myaccount.google.com/apppasswords), not your normal Google password. Put it in `SMTP_PASS`. If 2-Step Verification is off, turn it on first.
- **From address:** With Gmail/Google Workspace SMTP, the “From” address is usually required to be the same as the account you log in with. Set **NOREPLY_EMAIL** (or **SENDER_EMAIL**) to the **same** address as **SMTP_USER** (e.g. `bookings@bookaride.co.nz` for both). If they differ, Google may reject or drop the message.

---

## 4. Check backend logs when a booking is created

When a customer or admin creates a booking, look for:

- `Confirmation email sent to ... via SMTP` or `... via Mailgun` → email path ran and reported success.
- `SMTP credentials not configured` → `SMTP_USER` or `SMTP_PASS` not set in the environment the backend actually uses.
- `SMTP error: ...` or `Mailgun error: ...` → the next line usually has the real reason (e.g. auth failure, invalid From).

If you see **no** log line about sending email, the background task may be failing before send (e.g. exception in building the email). Check for “Background task failed” and the exception message.

---

## 5. Mailgun vs SMTP

- The app tries **Mailgun first** if `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set. If they’re set but wrong or expired, Mailgun fails and the app falls back to SMTP.
- To use **only Google Workspace**, leave Mailgun unset (no `MAILGUN_API_KEY` / `MAILGUN_DOMAIN`), and set `SMTP_USER`, `SMTP_PASS`, and `NOREPLY_EMAIL` as above.

---

## 6. Admin copy (BOOKINGS_NOTIFICATION_EMAIL)

- Admin notifications go to **BOOKINGS_NOTIFICATION_EMAIL** (or **ADMIN_EMAIL**). That variable must be set in the same place as the other env vars (local `backend\.env` or Render Environment).
- If only the **customer** email is missing, the same SMTP/From rules apply: correct credentials and From address so the customer message is accepted by the provider.

---

## Quick checklist

| Check | Action |
|------|--------|
| **Server configured?** | Open `https://your-backend.onrender.com/api/email-status` – if smtp_configured is false, set env on Render and redeploy |
| **Exact error** | POST `/api/admin/test-email` with admin auth (body: `{"to":"your@email.com"}`) or run `python backend/scripts/test_email_send.py your@email.com` locally |
| Env on server | Render: set SMTP_USER, SMTP_PASS, NOREPLY_EMAIL in dashboard and **redeploy** |
| App Password | Use 16-char App Password from myaccount.google.com/apppasswords (not your normal password) |
| From = SMTP user | Set NOREPLY_EMAIL to same as SMTP_USER (e.g. bookings@bookaride.co.nz) |
| Logs | Look for “Confirmation email sent” or “SMTP error” / “SMTP credentials not configured” |

After fixing, run the test script again and create a test booking; confirm both customer and admin receive the emails.
