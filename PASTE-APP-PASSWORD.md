# One step left: paste your App Password

Everything else is already set for Google Workspace email. You only need to add your App Password in one place.

---

## Local (this machine)

1. Open **`backend\.env`** in a text editor.
2. Find the line:  
   `SMTP_PASS=your-16-char-app-password`
3. Replace `your-16-char-app-password` with your actual 16-character App Password (no quotes). You can leave or remove spaces.
4. Save the file.

Then test:

```powershell
cd C:\Users\ccant\BookARide\backend
python scripts/test_email_send.py your@email.com
```

If you see **SUCCESS**, create a test booking and confirm both customer and admin get the emails.

---

## Production (Render)

1. In **Render** → your **backend service** → **Environment**.
2. Add or edit:
   - **SMTP_USER** = `bookings@bookaride.co.nz`
   - **SMTP_PASS** = *(paste your App Password)*
   - **SMTP_HOST** = `smtp.gmail.com`
   - **SMTP_PORT** = `587`
   - **NOREPLY_EMAIL** = `bookings@bookaride.co.nz`
   - **BOOKINGS_NOTIFICATION_EMAIL** = `bookings@bookaride.co.nz`
3. Save and **redeploy** the service.

After deploy, create a test booking on the live site and check that emails are delivered.
