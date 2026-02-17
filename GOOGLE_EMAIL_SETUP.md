# Google Workspace Email Setup for BookaRide

All transactional emails (booking confirmations, payment links, reminders, etc.) are now sent exclusively through your Google Workspace account via SMTP. This eliminates the need for Mailgun and reduces your operational costs.

## Benefits

- ✅ **No additional cost** - Uses your existing Google Workspace subscription
- ✅ **Up to 2,000 emails/day** - Sufficient for most shuttle operations
- ✅ **Reliable delivery** - Google's excellent email infrastructure
- ✅ **Simple setup** - Just 3 environment variables

## Quick Setup (5 minutes)

### Step 1: Create a Google App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Create a new app password:
   - **App**: Mail
   - **Device**: Other (custom name) → Enter "BookaRide Website"
5. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)
6. Remove all spaces: `abcdefghijklmnop`

### Step 2: Configure Environment Variables

Add these variables to your Render backend service (or .env file for local development):

```bash
# Required - Google SMTP Configuration
SMTP_USER=your-email@yourdomain.co.nz          # Your Google Workspace email
SMTP_PASS=abcdefghijklmnop                      # The 16-char app password (no spaces)

# Required - Email Sender Configuration
NOREPLY_EMAIL=noreply@yourdomain.co.nz         # Email address for transactional emails
SENDER_EMAIL=noreply@yourdomain.co.nz          # Fallback sender address

# Optional - SMTP Server Configuration (defaults work for Gmail/Google Workspace)
SMTP_HOST=smtp.gmail.com                        # Default: smtp.gmail.com
SMTP_PORT=587                                   # Default: 587 (TLS)
```

### Step 3: Set Up Email Alias (Recommended)

To send from `noreply@yourdomain.co.nz`:

**Option A: Add Email Alias in Google Workspace**
1. Go to [Google Admin Console](https://admin.google.com)
2. Navigate to **Users** → Select your user
3. Under **User information** → **Email aliases**
4. Add `noreply` as an alias

**Option B: Create a Group**
1. Go to [Google Groups](https://groups.google.com)
2. Create a new group: `noreply@yourdomain.co.nz`
3. Add your user as an owner/member
4. Configure group to allow sending

### Step 4: Deploy & Test

1. **Save environment variables** in Render dashboard
2. **Trigger manual deploy** to apply changes
3. **Test by creating a booking** or sending a test email from admin panel

## Email Sending Limits

### Google Workspace
- **Standard**: ~2,000 emails per day
- **More than enough** for typical shuttle operations
- Example: 2,000 emails = ~65 bookings/day (assuming 30 emails per booking lifecycle)

### If You Exceed Limits
If your business grows beyond 2,000 emails/day, you can:
1. Upgrade to multiple Google Workspace accounts
2. Consider a dedicated transactional email service (SendGrid, Mailgun, etc.)

## Emails Sent Automatically

The system sends emails for:

1. **Booking Confirmation** - After successful payment
2. **Payment Links** - For pay-later bookings
3. **Booking Reminders** - 24 hours before pickup
4. **Admin Notifications** - New bookings, driver assignments
5. **Driver Notifications** - Job assignments, updates
6. **Customer Updates** - Status changes, cancellations

## Troubleshooting

### "Authentication failed" or "Username and Password not accepted"

**Solution:**
- Ensure you're using an **App Password**, not your regular Google password
- Remove all spaces from the app password
- Verify 2-Step Verification is enabled on your Google account
- Check that `SMTP_USER` matches your Google Workspace email exactly

### Emails not arriving

**Check:**
1. **Spam/Junk folder** - First place to look
2. **Email alias** - Ensure `noreply@` alias is properly configured
3. **Render logs** - Check backend logs for SMTP errors:
   ```bash
   # In Render dashboard → Logs, search for:
   "SMTP send error" or "Email sent"
   ```
4. **Environment variables** - Verify all variables are set correctly (no extra spaces)

### "SMTP not configured" error

**Solution:**
- Check that `SMTP_USER` and `SMTP_PASS` are set in Render environment variables
- After adding variables, trigger a manual deploy
- Variables must be set in the **backend service**, not frontend

### Rate limiting / Too many emails

**Temporary solution:**
- Wait 24 hours for quota to reset
- Reduce frequency of reminder emails

**Long-term solution:**
- Contact Google Workspace support to request limit increase
- Consider using multiple sender accounts for different email types

## Security Best Practices

1. ✅ **Never commit** app passwords to git
2. ✅ **Use environment variables** for all credentials
3. ✅ **Rotate app passwords** periodically (every 6-12 months)
4. ✅ **Monitor email logs** for suspicious activity
5. ✅ **Use email aliases** (noreply@) instead of personal email addresses

## Comparison: Google SMTP vs Mailgun

| Feature | Google Workspace SMTP | Mailgun |
|---------|----------------------|---------|
| **Cost** | Included with Google Workspace | $0-35+/month |
| **Setup Time** | 5 minutes | 15-30 minutes + DNS |
| **Daily Limit** | ~2,000 emails | 5,000 (free), unlimited (paid) |
| **Reliability** | Excellent | Excellent |
| **Deliverability** | Excellent (Google reputation) | Excellent |
| **Analytics** | Basic (in Gmail) | Advanced dashboard |
| **DNS Setup** | Not required | Required (SPF, DKIM, MX) |

## Migration from Mailgun

If you previously used Mailgun, no additional steps are needed. The system now uses Google SMTP exclusively. You can:

1. ✅ **Remove Mailgun environment variables** (optional cleanup):
   - `MAILGUN_API_KEY`
   - `MAILGUN_DOMAIN`

2. ✅ **Cancel Mailgun subscription** (if desired)

3. ✅ **Keep monitoring** email delivery for the first few days

## Testing Email Sending

### Method 1: Admin Panel Email Test
1. Log into admin dashboard
2. Go to **Settings** or **Email** section
3. Use "Send Test Email" feature

### Method 2: Create Test Booking
1. Make a test booking on your website
2. Complete payment
3. Check email inbox for confirmation

### Method 3: Check Logs
Monitor Render logs for email sending:
```
✅ "Email sent to customer@example.com via Google Workspace SMTP"
❌ "SMTP send error: [error details]"
```

## Support

If you need help:

1. **Google Workspace Support**: [support.google.com/a](https://support.google.com/a)
2. **Render Support**: Check Render dashboard logs
3. **BookaRide System**: Check backend logs for detailed error messages

## Summary Checklist

- [ ] 2-Step Verification enabled on Google account
- [ ] App Password created and saved
- [ ] Environment variables set in Render:
  - [ ] SMTP_USER
  - [ ] SMTP_PASS
  - [ ] NOREPLY_EMAIL
- [ ] Email alias `noreply@yourdomain.co.nz` configured
- [ ] Manual deploy triggered in Render
- [ ] Test email sent successfully
- [ ] Mailgun variables removed (optional)
- [ ] Mailgun subscription cancelled (optional)

---

**You're all set!** Your BookaRide system now sends all emails through Google Workspace SMTP. 🎉
