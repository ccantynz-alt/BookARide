# Booking notification emails

## Customer confirmations + Admin copies

**Both** require an email provider. Set one of:

1. **Mailgun** (recommended): `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`
2. **Google Workspace SMTP**: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`

Without these, **no emails are sent** – neither to customers nor admins.

## Admin copies of new bookings

Sent to the address(es) configured by:

1. **BOOKINGS_NOTIFICATION_EMAIL** (preferred) – e.g. `bookings@bookaride.co.nz`
2. **ADMIN_EMAIL** (fallback)
3. Default: `bookings@bookaride.co.nz`

**On Render**, set:
```
BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz
GEOAPIFY_API_KEY=your_key
```

**Multiple recipients** (comma-separated):
```
BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz,info@bookaride.co.nz
```

## Troubleshooting "not receiving emails"

1. Check server logs at startup – you'll see "EMAIL NOT CONFIGURED" or "Email configured. Admin booking copies: ..."
2. Verify `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` (or `SMTP_*`) are set in your environment
3. For admin copies, also set `BOOKINGS_NOTIFICATION_EMAIL`
4. Check spam/junk folders
5. For Mailgun: verify domain is verified and not in sandbox mode blocking recipients
