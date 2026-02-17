# Google Workspace Email Setup for Book A Ride

This guide explains how to configure the Book A Ride website to send emails via Google Workspace instead of Mailgun.

## Prerequisites

- A Google Workspace account with your domain (e.g. `bookaride.co.nz`)
- Admin access to create App Passwords (or 2-Step Verification enabled on the sending account)

## Step 1: Create an App Password

Google Workspace requires an **App Password** for SMTP access when 2-Step Verification is enabled.

1. Sign in to your Google Workspace account
2. Go to [Google Account Security](https://myaccount.google.com/security)
3. Enable **2-Step Verification** if not already enabled
4. Under "Signing in to Google", select **App passwords**
5. Create a new App Password:
   - Select app: **Mail**
   - Select device: **Other** → name it "Book A Ride"
6. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)

## Step 2: Configure Environment Variables

Copy `backend/env.example` to `backend/.env` and add these email variables:

```bash
# Use Google Workspace for email
EMAIL_PROVIDER=google_workspace

# Your Google Workspace email (e.g. noreply@bookaride.co.nz)
SMTP_USER=noreply@bookaride.co.nz
SMTP_PASS=your-16-char-app-password

# Optional - defaults work for Google Workspace
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# Sender address (should match SMTP_USER or be an alias)
SENDER_EMAIL=noreply@bookaride.co.nz
NOREPLY_EMAIL=noreply@bookaride.co.nz
```

**Important:** The `SMTP_USER` must be a valid Google Workspace mailbox. You can use:
- `noreply@bookaride.co.nz` – create this user/alias in Google Admin
- `bookings@bookaride.co.nz` – if you prefer to send from the main bookings address

## Step 3: Create the Sending Address in Google Workspace

1. In [Google Admin Console](https://admin.google.com), go to **Users** or **Groups**
2. Create a user `noreply@bookaride.co.nz` (or use an existing one)
3. Enable 2-Step Verification for that user
4. Generate an App Password for that user

Alternatively, use an existing mailbox like `bookings@bookaride.co.nz` and create an App Password for it.

## Step 4: Verify Configuration

After deploying, test that emails are sent:

1. Create a test booking on the website
2. Check that the confirmation email arrives
3. Check backend logs for `Email sent to ... via SMTP (Google Workspace)`

## Switching Back to Mailgun

To use Mailgun instead:

```bash
EMAIL_PROVIDER=mailgun
MAILGUN_API_KEY=key-xxxx
MAILGUN_DOMAIN=mg.bookaride.co.nz
```

Or simply omit `EMAIL_PROVIDER` and ensure `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` are set.

## Troubleshooting

### "SMTP send error: Username and Password not accepted"
- Ensure 2-Step Verification is enabled
- Use an App Password, not your regular account password
- Verify the email address is correct (no typos)

### "SMTP send error: Connection refused"
- Check `SMTP_HOST` (smtp.gmail.com) and `SMTP_PORT` (587)
- Ensure your firewall allows outbound connections on port 587

### Emails going to spam
- Set up SPF and DKIM for your domain in Google Admin
- Use a consistent From address that matches your domain
