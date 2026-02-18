# Book A Ride

## Email Configuration

The site supports two email providers:

1. **Google Workspace** (recommended) – Use your domain's SMTP
2. **Mailgun** – Transactional email API

### Google Workspace Setup

See [docs/GOOGLE_WORKSPACE_EMAIL_SETUP.md](docs/GOOGLE_WORKSPACE_EMAIL_SETUP.md) for full instructions.

Quick setup: set these in your `.env`:

```
EMAIL_PROVIDER=google_workspace
SMTP_USER=noreply@bookaride.co.nz
SMTP_PASS=your-google-app-password
SENDER_EMAIL=noreply@bookaride.co.nz
```

### Mailgun Setup

Set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN`. Omit `EMAIL_PROVIDER` or set `EMAIL_PROVIDER=mailgun`.
