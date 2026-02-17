# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in BookARide, please report it by emailing the repository owner directly. **Do not** create a public GitHub issue for security vulnerabilities.

## Credential Management

### Never Commit Credentials

**NEVER** commit any of the following to the repository:

- API keys (Stripe, Google Maps, Twilio, Mailgun, etc.)
- Database connection strings
- JWT secret keys
- Service account JSON files
- Private keys or certificates
- OAuth client secrets
- `.env` files or any environment configuration files containing secrets

### Using Environment Variables

All credentials and secrets **MUST** be stored as environment variables:

#### Backend (.env file - DO NOT COMMIT)

Create a `backend/.env` file locally (this is gitignored):

```bash
# Database
MONGO_URL=mongodb://localhost:27017/
DB_NAME=bookaride

# Authentication
JWT_SECRET_KEY=your_secure_random_string_here

# Google Services
GOOGLE_MAPS_API_KEY=your_key_here
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Payment Processing
STRIPE_API_KEY=your_stripe_key_here

# Communication Services
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
MAILGUN_API_KEY=your_key_here
MAILGUN_DOMAIN=your_domain_here
```

#### Frontend (.env file - DO NOT COMMIT)

Create a `frontend/.env` file locally (this is gitignored):

```bash
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_publishable_key_here
```

### Google Service Account Setup

For Google Calendar integration:

1. Create a service account in Google Cloud Console
2. Download the service account JSON file
3. Store it as `backend/service_account.json` (this is gitignored)
4. **NEVER** commit this file to git

### Environment Variable Templates

See `BOOKARIDE_QUICK_REFERENCE.md` for complete `.env` templates with all required variables.

## Pre-Commit Hooks

This repository uses pre-commit hooks to prevent accidental credential commits:

### Installation

```bash
# Install pre-commit
pip install pre-commit

# Install the git hook scripts
pre-commit install

# (Optional) Run against all files
pre-commit run --all-files
```

### What Gets Checked

- **Gitleaks**: Scans for hardcoded secrets, API keys, and credentials
- **detect-secrets**: Detects high-entropy strings that may be secrets
- **detect-private-key**: Blocks commits containing private keys
- **Large files**: Prevents accidentally committing large files

### Bypassing Hooks (Use with Caution)

If you need to bypass the pre-commit hooks (e.g., for a false positive):

```bash
git commit --no-verify -m "your message"
```

**Only bypass if you're certain the detected content is not a real secret.**

## GitHub Secret Scanning

This repository has automated secret scanning via GitHub Actions:

- **Gitleaks**: Runs on every push and pull request
- **TruffleHog**: Provides additional verification for detected secrets

Failed scans will block pull requests from being merged.

## What to Do If You Accidentally Commit a Secret

If you accidentally commit a credential:

### 1. Immediately Rotate the Credential

- Change the password/secret in the service (Stripe, Google Cloud, etc.)
- Generate a new API key or token
- Update your local `.env` file with the new credential

### 2. Remove from Git History

**Option A: If the commit is recent and not pushed:**

```bash
# Reset to the previous commit
git reset HEAD~1

# Restage your changes without the secret
git add .
git commit -m "Your message"
```

**Option B: If already pushed to GitHub:**

Contact the repository owner immediately. The credential must be:
1. Rotated/invalidated in the service
2. Removed from Git history using `git filter-branch` or `BFG Repo-Cleaner`
3. Force pushed to all branches

### 3. Verify Removal

Run Gitleaks locally to verify:

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks/releases

# Scan the entire repository
gitleaks detect --source . --verbose
```

## Production Deployment

### Render (Backend)

Set environment variables in the Render dashboard:
1. Go to your service → Environment
2. Add each environment variable as a key-value pair
3. Deploy

### Vercel/Static Hosting (Frontend)

Set environment variables in your hosting platform:
1. Add variables prefixed with `REACT_APP_`
2. Rebuild and redeploy

## Additional Security Measures

### .gitignore

The repository has comprehensive `.gitignore` rules to prevent common credential files from being committed. Review `.gitignore` before adding new types of configuration files.

### Code Review

All pull requests should be reviewed for:
- Hardcoded credentials or API keys
- Exposed connection strings
- Configuration files that should use environment variables

## Questions?

If you have questions about credential management or security practices, please contact the repository owner.

---

**Last Updated**: February 2026
