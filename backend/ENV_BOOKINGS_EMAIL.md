# Booking notification emails

Admin copies of new bookings are sent to the address(es) configured by:

1. **BOOKINGS_NOTIFICATION_EMAIL** (preferred) – e.g. `bookings@bookaride.co.nz`
2. **ADMIN_EMAIL** (fallback) – e.g. `bookings@bookaride.co.nz`
3. Default: `bookings@bookaride.co.nz`

**On Render**, set:
```
BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz
```

Or for multiple recipients (comma-separated):
```
BOOKINGS_NOTIFICATION_EMAIL=bookings@bookaride.co.nz,info@bookaride.co.nz
```

**Email delivery** also requires either:
- **Mailgun**: `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`
- **Google Workspace SMTP**: `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`
