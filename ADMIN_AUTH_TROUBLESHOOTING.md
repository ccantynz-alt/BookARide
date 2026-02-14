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

### 2. Password reset email not arriving / Forgot password link not working

**Cause:** Mailgun API keys missing or incorrect in your backend deployment (e.g. Render).

**Workaround – set password while logged in:** If you're logged in (e.g. via Google), go to **Settings** in the admin dashboard and click **Change Password**. Click **"Forgot current password? Set a new one instead."** – you can set a new password without entering the current one.

**To fix the email flow**, add one of these to **Render → Environment**:

**Option A – Google Workspace** (no extra cost): See [GOOGLE_WORKSPACE_EMAIL_SETUP.md](GOOGLE_WORKSPACE_EMAIL_SETUP.md) for setup. You need `SMTP_USER`, `SMTP_PASS`, and `SENDER_EMAIL`.

**Option B – Mailgun:**

| Variable | Description | Example |
|----------|-------------|---------|
| `MAILGUN_API_KEY` | Private API key from Mailgun | `key-abc123...` |
| `MAILGUN_DOMAIN` | Sending domain | `mg.bookaride.co.nz` or `sandboxXXX.mailgun.org` |
| `SENDER_EMAIL` | From address (optional) | `noreply@bookaride.co.nz` |
| `PUBLIC_DOMAIN` | Site URL for reset links | `https://www.bookaride.co.nz` |

**Check your Mailgun setup:**
1. Log in at https://app.mailgun.com
2. Go to **Account → API Keys** – copy the **Private** key
3. Go to **Sending → Domains** – use your verified domain (e.g. `mg.bookaride.co.nz`) or sandbox domain
4. Ensure `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` match exactly (no extra spaces)

**Common mistakes:**
- Using the **Public** key instead of **Private**
- Wrong domain (e.g. `bookaride.co.nz` instead of `mg.bookaride.co.nz`)
- Domain not verified in Mailgun
- `PUBLIC_DOMAIN` missing – reset links will use `https://www.bookaride.co.nz` by default

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

### 5. Google login button not showing / `{"detail":"Not Found"}` on Google auth

**Cause:** Render backend may be serving an old deployment that doesn't have the admin Google OAuth routes.

**Fix – force a Render redeploy:**
1. Go to https://dashboard.render.com
2. Open your **bookaride-backend** service
3. Click **Manual Deploy** → **Deploy latest commit**
4. Wait for the build to finish (2–5 minutes)
5. Verify: `curl https://bookaride-backend.onrender.com/api/admin/google-auth/start` should redirect (302), not return 404

**Backend env vars for Google OAuth** (in Render → Environment):
| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console OAuth client |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `BACKEND_URL` or `RENDER_EXTERNAL_URL` | Backend URL for OAuth redirect (e.g. `https://bookaride-backend.onrender.com`) |

**Frontend:** If `REACT_APP_BACKEND_URL` is not set in Vercel, the frontend now falls back to `https://bookaride-backend.onrender.com` when on bookaride.co.nz.

### 6. Render backend returns 404 for all routes

If `/`, `/healthz`, and `/api/admin/google-auth/start` all return 404, the deployed code is outdated. Trigger a **Manual Deploy** in the Render dashboard (see §5 above). Ensure the service is configured to deploy from the `main` branch.

### 7. Failed to send Stripe link

**Cause:** Stripe payment link generation or email delivery failed.

**Check Render → Environment:**
| Variable | Description |
|----------|-------------|
| `STRIPE_API_KEY` or `STRIPE_SECRET_KEY` | Secret key from [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (starts with `sk_`) |
| `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` | Required to email the payment link to the customer |
| `PUBLIC_URL` or `PUBLIC_DOMAIN` | Site URL for Stripe redirects (e.g. `https://www.bookaride.co.nz`) |

**Common causes:**
- Stripe key missing or wrong (use Secret key, not Publishable)
- Booking has $0 or invalid amount
- Mailgun not configured (link is generated but email fails)

---

## Summary of fixes applied

1. **Password hashing:** Server now supports both bcrypt and pbkdf2_sha256 so existing admins can log in.
2. **create_admin.py:** Aligned with server to use pbkdf2_sha256 for new accounts.
3. **reset_admin_password.py:** Emergency script to reset a password when email reset isn’t working.
