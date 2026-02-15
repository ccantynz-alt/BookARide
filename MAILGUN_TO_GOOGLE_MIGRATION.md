# Migration from Mailgun to Google Workspace SMTP

## Summary

BookaRide has been successfully migrated from Mailgun to Google Workspace SMTP for all email sending. This change eliminates the need for a separate email service and reduces operational costs.

## What Changed

### Code Changes

1. **Email Sender (`backend/email_sender.py`)**
   - ✅ Removed Mailgun API integration
   - ✅ Now uses Google Workspace SMTP exclusively
   - ✅ Added support for CC emails
   - ✅ Simplified configuration (3 env vars instead of 2)

2. **Backend Server (`backend/server.py`)**
   - ✅ Replaced 14+ direct Mailgun API calls with unified `send_email()` function
   - ✅ All booking confirmations now use Google SMTP
   - ✅ All admin notifications now use Google SMTP
   - ✅ All customer emails now use Google SMTP

3. **Bulk Operations (`backend/routes_bulk.py`)**
   - ✅ Updated bulk email function to use Google SMTP
   - ✅ Renamed `send_email_via_mailgun()` to `send_email_bulk()`

### Configuration Changes

**Old (Mailgun):**
```bash
MAILGUN_API_KEY=key-abc123...
MAILGUN_DOMAIN=mg.bookaride.co.nz
SENDER_EMAIL=noreply@bookaride.co.nz
```

**New (Google Workspace SMTP):**
```bash
SMTP_USER=your-email@yourdomain.co.nz
SMTP_PASS=your-16-char-app-password
NOREPLY_EMAIL=noreply@yourdomain.co.nz
SENDER_EMAIL=noreply@yourdomain.co.nz          # Optional fallback
SMTP_HOST=smtp.gmail.com                        # Optional (has default)
SMTP_PORT=587                                   # Optional (has default)
```

### Documentation Changes

1. ✅ **Created**: `GOOGLE_EMAIL_SETUP.md` - Comprehensive Google SMTP setup guide
2. ✅ **Updated**: `MAILGUN_SETUP_GUIDE.md` - Marked as deprecated
3. ✅ **Updated**: `GOOGLE_WORKSPACE_EMAIL_SETUP.md` - Points to new comprehensive guide

## Migration Steps for Deployment

### 1. Update Environment Variables in Render

**Add new variables:**
```bash
SMTP_USER=your-google-workspace-email
SMTP_PASS=your-app-password-no-spaces
NOREPLY_EMAIL=noreply@yourdomain.co.nz
```

**Remove old variables (optional cleanup):**
```bash
MAILGUN_API_KEY=...    # Can be removed
MAILGUN_DOMAIN=...     # Can be removed
```

### 2. Configure Google Workspace

1. Create app password (see [GOOGLE_EMAIL_SETUP.md](./GOOGLE_EMAIL_SETUP.md))
2. Set up `noreply@yourdomain.co.nz` email alias
3. Test email sending

### 3. Deploy Changes

1. Push code changes to repository
2. Trigger manual deploy in Render
3. Monitor logs for successful email sending

### 4. Verify Email Sending

Test these email types:
- [ ] Booking confirmation emails
- [ ] Payment link emails
- [ ] Admin notification emails
- [ ] Reminder emails (24h before pickup)
- [ ] Bulk emails from admin panel

### 5. Clean Up (Optional)

Once confirmed working:
- [ ] Cancel Mailgun subscription
- [ ] Remove Mailgun DNS records (if any)
- [ ] Remove `MAILGUN_*` environment variables

## Benefits of This Change

### Cost Savings
- ❌ **Before**: Google Workspace + Mailgun ($35/month for >5k emails)
- ✅ **After**: Google Workspace only (no additional cost)
- 💰 **Savings**: Up to $420/year

### Simplicity
- ✅ Fewer external dependencies
- ✅ Simpler configuration (3 env vars vs 2 + DNS setup)
- ✅ One less service to monitor
- ✅ No DNS configuration required

### Reliability
- ✅ Google's excellent email infrastructure
- ✅ 2,000 emails/day included (sufficient for most operations)
- ✅ Better deliverability (Google's reputation)

## Email Sending Limits

### Google Workspace
- **Limit**: ~2,000 emails per day per account
- **Sufficient for**: ~60-65 bookings per day (assuming 30 emails per booking lifecycle)

### If You Need More
- Use multiple Google Workspace accounts
- Upgrade to a dedicated transactional email service
- Contact Google Workspace support for limit increase

## Rollback Plan (If Needed)

If issues arise, you can temporarily rollback:

1. **Restore Mailgun variables** in Render:
   ```bash
   MAILGUN_API_KEY=your-old-api-key
   MAILGUN_DOMAIN=your-old-domain
   ```

2. **Revert code changes**:
   ```bash
   git revert <commit-hash>
   git push
   ```

3. **Trigger manual deploy**

Note: The new code checks for email service availability and will log errors if neither is configured.

## Testing Checklist

Before considering migration complete:

- [ ] Create test booking → Confirmation email received
- [ ] Create pay-later booking → Payment link email received
- [ ] Check admin email → Booking notification received
- [ ] Send test email from admin panel → Email received
- [ ] Check Render logs → No SMTP errors
- [ ] Verify emails not in spam folder
- [ ] Test with different email providers (Gmail, Outlook, etc.)

## Monitoring

Keep an eye on these for the first week:

1. **Render Backend Logs**
   - Look for: "Email sent to X via Google Workspace SMTP"
   - Watch for: "SMTP send error"

2. **Customer Feedback**
   - Monitor for reports of missing emails
   - Check spam/junk folder reports

3. **Email Sending Volume**
   - Track daily email count
   - Ensure staying under 2,000/day limit

## Support

If you encounter issues:

1. **Check logs** in Render dashboard
2. **Verify environment variables** are set correctly
3. **Test app password** in Google account
4. **Review** [GOOGLE_EMAIL_SETUP.md](./GOOGLE_EMAIL_SETUP.md) troubleshooting section

## Timeline

- **Code Changes**: Completed
- **Documentation**: Updated
- **Testing**: Ready for deployment
- **Production Deployment**: Pending environment variable configuration

---

**Status**: ✅ Ready for production deployment

**Next Steps**:
1. Configure Google Workspace app password
2. Set environment variables in Render
3. Deploy to production
4. Monitor for 24-48 hours
5. Cancel Mailgun subscription (optional)
