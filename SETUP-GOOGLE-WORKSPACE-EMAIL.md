# Set up Google Workspace email for Book a Ride (no API needed)

Book a Ride sends booking confirmations and notifications by **email**. You can use **Google Workspace** for this. You do **not** need a Google API or any API key for sending email—only an **App Password** from the Google account that will send the mail.

---

## Admin Console vs your Google account (important)

- **Google Workspace Admin** (admin.google.com) is for managing your organization (users, security policies, etc.). You **cannot** create an App Password there.
- The **App Password** is created in the **Google Account** of the **user** who will send the emails (e.g. `bookings@bookaride.co.nz`).

So: leave the Admin Console for now. Sign in as the **user** (the mailbox you want to send from) and follow the steps below.

---

## Step 1: Choose the sending address

Decide which Google Workspace address will send the emails (e.g. `bookings@bookaride.co.nz`). You’ll use this same address as the “From” address and to sign in when creating the App Password.

---

## Step 2: Turn on 2-Step Verification (required)

1. Sign in to Google as that user (e.g. bookings@bookaride.co.nz).
2. Open: **https://myaccount.google.com/security**
3. Under **“How you sign in to Google”**, click **2-Step Verification** and turn it on if it isn’t already.

*(If you’re a Workspace admin and 2-Step Verification is enforced for your org, it may already be on.)*

---

## Step 3: Create an App Password

1. While signed in as that user, open: **https://myaccount.google.com/apppasswords**  
   - If you don’t see “App passwords”, go to **https://myaccount.google.com/signinoptions/two-step-verification** and scroll to **“App passwords”**.
2. Click **“Select app”** → choose **“Mail”**.
3. Click **“Select device”** → choose **“Other”** and type a name (e.g. **“Book a Ride backend”**).
4. Click **“Generate”**.
5. Google shows a **16-character password** (e.g. `abcd efgh ijkl mnop`). **Copy it** and store it somewhere safe—you’ll use it as `SMTP_PASS` in the backend. You won’t see it again.

That’s the only “password” you need from Google for sending email. **No API key or API enablement is required** for this.

---

## Step 4: Configure the Book a Ride backend

1. Open the project in the **BookARide** folder (e.g. `C:\Users\ccant\BookARide`).
2. In the **backend** folder, copy the example env file and create your `.env`:
   - Copy `backend\.env.example` to `backend\.env`.
3. Edit `backend\.env` and set at least:

```env
SMTP_USER=bookings@bookaride.co.nz
SMTP_PASS=paste-your-16-char-app-password-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
NOREPLY_EMAIL=bookings@bookaride.co.nz
```

Use the **exact** email you used to create the App Password for `SMTP_USER` and `NOREPLY_EMAIL`. Paste the App Password with or without spaces; both work.

4. To use **only** Google Workspace (no Mailgun), leave `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` unset or remove them from `.env`.

---

## Step 5: Run the backend and test

From the **BookARide** folder:

```powershell
cd C:\Users\ccant\BookARide\backend
# If you use a virtual environment, activate it first, then:
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Create a test booking on the site and check that the confirmation email arrives. If you see “SMTP credentials not configured”, check that `SMTP_USER` and `SMTP_PASS` are set in `backend\.env`.

---

## Summary

| You need | Where to get it |
|----------|------------------|
| Sending address | Your Google Workspace user (e.g. bookings@bookaride.co.nz) |
| App Password | That user’s Google Account → Security → 2-Step Verification → App passwords → Generate for “Mail” |
| API key for email? | **No.** SMTP + App Password is enough. |

All email sending in Book a Ride uses this SMTP setup when Mailgun is not configured.
