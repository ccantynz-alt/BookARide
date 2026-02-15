# Admin Email Configuration Guide

## Overview
This guide explains how to configure the admin email address that receives booking notifications.

## Current Setup
- **Default Admin Email**: `bookings@bookaride.co.nz`
- **Environment Variable (Primary)**: `BOOKINGS_NOTIFICATION_EMAIL`
- **Environment Variable (Fallback)**: `ADMIN_EMAIL`

## How to Configure

### Option 1: Single Admin Email (Recommended)
Set the `BOOKINGS_NOTIFICATION_EMAIL` environment variable to your admin email:

```bash
BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz
```

### Option 2: Multiple Admin Emails
You can send booking notifications to multiple email addresses by separating them with commas:

```bash
BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz,admin@bookaride.co.nz,manager@bookaride.co.nz
```

### Option 3: Using ADMIN_EMAIL (Fallback)
If `BOOKINGS_NOTIFICATION_EMAIL` is not set, the system will use `ADMIN_EMAIL`:

```bash
ADMIN_EMAIL=bookings@bookaride.co.nz
```

## Setting Environment Variables in Render.com

1. Go to your Render.com dashboard
2. Select your backend service
3. Click on "Environment" in the left sidebar
4. Add a new environment variable:
   - **Key**: `BOOKINGS_NOTIFICATION_EMAIL`
   - **Value**: `bookings@bookaride.co.nz` (or your desired email)
5. Click "Save Changes"
6. Render will automatically redeploy your service

## Verifying Email Configuration

### 1. Check Email Service Setup
Make sure one of these email services is configured:

#### Mailgun (Recommended)
```bash
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=mg.bookaride.co.nz
SENDER_EMAIL=noreply@mg.bookaride.co.nz
```

#### Google Workspace SMTP (Alternative)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@bookaride.co.nz
SMTP_PASSWORD=your-app-password
SENDER_EMAIL=noreply@bookaride.co.nz
```

### 2. Test Booking Notification
Create a test booking through the website and verify that you receive an email notification at your configured admin email address.

### 3. Check Server Logs
Look for these log messages in your server logs:
- `Auto-notification sent to {admin_email} for booking: {booking_ref}`
- `Admin SMS sent for new booking: #{booking_ref}`

## Troubleshooting

### Not Receiving Emails?

1. **Check Spam Folder**: Admin emails might be filtered as spam
2. **Verify Email Service**: Ensure Mailgun or SMTP credentials are correct
3. **Check Environment Variables**: Verify `BOOKINGS_NOTIFICATION_EMAIL` is set correctly
4. **Check Server Logs**: Look for email sending errors in the logs
5. **Test Email Service**: Use the Mailgun or SMTP test tools to verify connectivity

### Common Issues

#### Issue: "No email provider configured"
**Solution**: Set up either Mailgun (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`) or SMTP (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`)

#### Issue: "Failed to send to {admin_email}"
**Solution**: Check that your email service credentials are correct and the service is not rate-limited

#### Issue: Emails going to wrong address
**Solution**: Update `BOOKINGS_NOTIFICATION_EMAIL` environment variable and redeploy

## Email Notification Content

Admin email notifications include:
- Booking reference number
- Customer contact information (name, email, phone)
- Trip details (pickup, dropoff, date, time, passengers)
- Pricing breakdown
- Flight information (if provided)
- Special notes/requests
- Payment status
- Direct link to admin dashboard

## SMS Notifications

In addition to email, admins can also receive SMS notifications. Configure:

```bash
ADMIN_PHONE=+64212345678  # Your admin phone number
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

## Related Documentation

- `EMAIL_SYSTEM_READY.md` - Email system setup guide
- `MAILGUN_SETUP_GUIDE.md` - Mailgun configuration
- `GOOGLE_WORKSPACE_EMAIL_SETUP.md` - SMTP setup guide

## Support

If you continue to have issues with admin email notifications, check:
1. Backend server logs for error messages
2. Email service provider dashboard for delivery status
3. DNS records for email domain (if using custom domain)

---

**Last Updated**: February 2026  
**Contact**: info@bookaride.co.nz
