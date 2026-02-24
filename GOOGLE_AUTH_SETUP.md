# Google Admin Login Setup

Sign in with Google for the admin panel using your own OAuth credentials (no Emergent).

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select existing (e.g. BookARide)
3. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**
4. Application type: **Web application**
5. Name: `BookARide Admin`
6. **Authorized redirect URIs** – add:
   - `https://bookaride-backend.onrender.com/api/admin/google-auth/callback`
   - `https://www.bookaride.co.nz/api/admin/google-auth/callback` (if using same domain)
   - `http://localhost:8000/api/admin/google-auth/callback` (for local dev)
7. Copy **Client ID** and **Client Secret**

## 2. Backend Environment Variables (Render)

Add to your Render service:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | Your OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your OAuth Client Secret |
| `BACKEND_URL` | `https://bookaride-backend.onrender.com` |
| `PUBLIC_DOMAIN` | `https://www.bookaride.co.nz` |

**Note:** `BACKEND_URL` is used for the OAuth redirect URI. Render may set `RENDER_EXTERNAL_URL` automatically.

## 3. Admin Email Must Match

Google login only works for emails that exist in `admin_users`. If you created an admin with `info@bookaride.co.nz`, you must sign in with that Google account.

To add another admin for Google login:

```bash
cd backend
MONGO_URL='...' python create_admin.py
# Use the email of the Google account you want to allow
```

## 4. Flow

1. User clicks **Sign in with Google** on admin login
2. Redirects to `/api/admin/google-auth/start` → Google
3. User signs in with Google
4. Google redirects to `/api/admin/google-auth/callback` with code
5. Backend exchanges code for tokens, checks admin by email, creates JWT
6. Redirects to frontend `/admin/auth/callback#token=JWT`
7. Frontend stores token and redirects to dashboard

## 5. Troubleshooting

- **"Google OAuth not configured"** – Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render
- **"This Google account is not authorized"** – Admin not found for that email. Create admin with `create_admin.py` using that email
- **Redirect URI mismatch** – Ensure the redirect URI in Google Console exactly matches `BACKEND_URL/api/admin/google-auth/callback`
- **Google button not showing** – Ensure `REACT_APP_BACKEND_URL=https://bookaride-backend.onrender.com` is set in Vercel and redeploy the frontend
- **Render 404 on health check** – In Render → Service → Settings → Health Check Path, set to `/health` or `/` or `/healthz`. Root `/` now returns 200.
