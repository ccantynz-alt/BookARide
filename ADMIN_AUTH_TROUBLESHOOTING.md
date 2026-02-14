# Admin Login & Password Reset Troubleshooting

## Quick Fixes

### 1. Can't log in with username/password

**Cause:** Password hashing mismatch (now fixed). If you still can't log in:

- **Reset your password locally** (no email needed):
  ```bash
  cd backend
  python reset_admin_password.py
  ```
  You'll need `MONGO_URL` in `backend/.env` pointing to your MongoDB.

- **Create a new admin** if none exist:
  ```bash
  cd backend
  python create_admin.py
  ```

### 2. Password reset email not arriving

**Cause:** Mailgun API keys missing or incorrect.

**Required backend env vars** (in `backend/.env` or your deployment):

| Variable | Description | Example |
|----------|-------------|---------|
| `MAILGUN_API_KEY` | Private API key from Mailgun | `key-abc123...` |
| `MAILGUN_DOMAIN` | Sending domain | `mg.bookaride.co.nz` or `sandboxXXX.mailgun.org` |
| `SENDER_EMAIL` | From address (optional) | `noreply@bookaride.co.nz` |
| `PUBLIC_DOMAIN` | Site URL for reset links (optional) | `https://bookaride.co.nz` |

**Check your Mailgun setup:**
1. Log in at https://app.mailgun.com
2. Go to **Account → API Keys** – copy the **Private** key
3. Go to **Sending → Domains** – use your verified domain (e.g. `mg.bookaride.co.nz`) or sandbox domain
4. Ensure `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` match exactly (no extra spaces)

**Common mistakes:**
- Using the **Public** key instead of **Private**
- Wrong domain (e.g. `bookaride.co.nz` instead of `mg.bookaride.co.nz`)
- Domain not verified in Mailgun

### 3. Frontend can't reach backend (API errors)

**Moving off Emergent:** The proxy to Emergent has been removed. You must point the frontend to your own backend.

**In Vercel → Settings → Environment Variables**, add:
| Variable | Value |
|----------|-------|
| `REACT_APP_BACKEND_URL` | Your backend URL, e.g. `https://api.bookaride.co.nz` or `https://your-app.onrender.com` |

Do NOT include `/api` at the end – the frontend adds it. Redeploy after adding.

**If your backend is on the same domain** (e.g. `bookaride.co.nz/api`), set `REACT_APP_BACKEND_URL=https://www.bookaride.co.nz` so API calls go to the same origin.

### 4. MongoDB connection

Admin users are stored in the `admin_users` collection. Ensure:

- `MONGO_URL` is correct in `backend/.env`
- `DB_NAME` matches (default: `bookaride`)

---

## Summary of fixes applied

1. **Password hashing:** Server now supports both bcrypt and pbkdf2_sha256 so existing admins can log in.
2. **create_admin.py:** Aligned with server to use pbkdf2_sha256 for new accounts.
3. **reset_admin_password.py:** Emergency script to reset a password when email reset isn’t working.
