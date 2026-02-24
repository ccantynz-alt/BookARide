# "Not Found" when opening email-status – what to do

If you see `{"detail":"Not Found"}` when opening the email-status or test-email URL, work through this.

---

## 1. Confirm you're hitting the right server

Open the **root** of your backend in the browser (no path, no trailing slash):

- **Render:** `https://bookaride-backend.onrender.com/`
- Or whatever your backend URL is (e.g. `https://your-service-name.onrender.com/`)

**If you see** something like:
```json
{"status":"ok","service":"bookaride-api","docs":"/docs","email_status":"/email-status or /api/email-status"}
```
then the server is correct. Go to step 2.

**If you see** `Not Found` or a different page (e.g. "Welcome to nginx"), you're not on the Book a Ride API. Check:
- You're using the **backend** URL, not the frontend (e.g. not bookaride.co.nz, but the API host like bookaride-backend.onrender.com).
- No typo in the URL (https, correct host, no extra path).

---

## 2. Try these exact URLs (same host as step 1)

Use the **same host** as in step 1. Try each in the browser:

| URL (replace host if yours is different) | What you should see |
|------------------------------------------|----------------------|
| `https://bookaride-backend.onrender.com/` | `{"status":"ok",...}` |
| `https://bookaride-backend.onrender.com/healthz` | `{"status":"healthy",...}` |
| `https://bookaride-backend.onrender.com/email-status` | JSON with `sendgrid_configured`, `smtp_configured`, etc. |
| `https://bookaride-backend.onrender.com/api/email-status` | Same as above |

If **/** and **/healthz** work but **/email-status** and **/api/email-status** return `Not Found`, the running app doesn’t have the email-status route yet (old deploy). Go to step 3.

---

## 3. Deploy the latest backend (Render)

The email-status route is in the BookARide backend code. If Render is running an old build, it won’t be there.

1. Push your latest code (including the BookARide backend with `server.py` that has `@app.get("/email-status")`) to the repo connected to Render.
2. In Render: open your **backend** service → **Manual Deploy** → **Deploy latest commit** (or let auto-deploy run after the push).
3. Wait for the deploy to finish (green / Live).
4. Try again: `https://your-backend-url.onrender.com/email-status`

---

## 4. If you're running the backend locally

Run the backend from the project that has the updated `server.py`:

```powershell
cd C:\Users\ccant\BookARide\backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Then open: **http://localhost:8000/email-status**

---

**Summary:** Confirm the root URL returns the bookaride-api JSON, then try `/email-status` and `/api/email-status`. If they still return Not Found, redeploy the backend (or run it locally) so the server has the latest code.
