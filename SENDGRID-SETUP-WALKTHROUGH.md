# SendGrid setup walkthrough (step by step)

Follow these in order. You’ll end up with one API key and one verified sender – that’s all the app needs.

---

## Phase 1: SendGrid account and API key

### Step 1.1 – Sign up or log in

1. Go to **https://sendgrid.com**.
2. Click **Start for Free** (or **Sign In** if you already have an account).
3. Complete sign-up (email, password, etc.). Free tier is enough.

### Step 1.2 – Create an API key

1. In the SendGrid dashboard, open the left menu and go to **Settings** (gear icon at the bottom).
2. Under **Settings**, click **API Keys**.
   - Or go directly to: **https://app.sendgrid.com/settings/api_keys**
3. Click the blue **Create API Key** button.
4. On the form:
   - **API Key Name:** e.g. `Book a Ride` or `BookaRide backend`.
   - **API Key Permissions:** choose **Restricted Access**.
   - Expand **Mail Send** and turn **ON** only **Mail Send** (that’s all we need).
5. Click **Create & View**.
6. SendGrid shows the key **once**. Copy it and save it somewhere safe (e.g. a password manager). It will look like `SG.xxxxxxxxxxxxxxxxxxxxxxxx.yyyyyyyyyyyyyyyyyyyyyyyyyyyy`.
7. Click **Done**.

You’ll use this key as `SENDGRID_API_KEY` later.

---

## Phase 2: Verify your sender (required)

SendGrid will only send from addresses (or domains) you’ve verified. For a quick setup we use **Single Sender Verification**.

### Step 2.1 – Open Single Sender Verification

1. In the left menu, go to **Settings**.
2. Under **Sender Authentication**, click **Single Sender Verification**.
   - Or go to: **https://app.sendgrid.com/settings/sender_auth/senders**
3. Click **Create New Sender** (or **Verify a Single Sender**).

### Step 2.2 – Fill in the sender form

Use the email address you want customers to see as “From” (e.g. your booking address). Example:

| Field | Example | Notes |
|-------|--------|--------|
| **From Name** | Book a Ride NZ | Shown as sender name. |
| **From Email Address** | bookings@bookaride.co.nz | Must be an inbox you can access. |
| **Reply To** | Same as From, or info@bookaride.co.nz | Optional. |
| **Company Address** | Your business address | Required by SendGrid. |
| **City, Zip, Country** | Your details | Required. |
| **Nickname** | BookaRide (optional) | For your reference in SendGrid. |

Click **Create** (or **Save**).

### Step 2.3 – Verify the sender

1. SendGrid sends a verification email to the **From Email Address** you entered.
2. Open that inbox and find the email from SendGrid.
3. Click the **verification link** in the email.
4. You should see a success page. The sender status in SendGrid will change to **Verified**.

If you don’t verify, SendGrid will not send from that address.

---

## Phase 3: Add the key and sender to your app

### Step 3.1 – Decide where the backend runs

- **Only on your PC:** use the backend **`.env`** file.
- **On Render (or another host):** use that host’s **Environment** (e.g. Render dashboard).

### Step 3.2 – Set the variables

You need two values:

| Variable | Value | Example |
|----------|--------|--------|
| **SENDGRID_API_KEY** | The API key you copied in Phase 1 | `SG.xxxx...` (paste the full key) |
| **NOREPLY_EMAIL** | The **exact** verified sender email from Phase 2 | `bookings@bookaride.co.nz` |

**Local (backend `.env`):**

1. Open `C:\Users\ccant\BookARide\backend\.env` in a text editor.
2. Add or edit:
   ```env
   SENDGRID_API_KEY=SG.paste_your_full_key_here
   NOREPLY_EMAIL=bookings@bookaride.co.nz
   ```
3. Save. No quotes around the values.

**Render:**

1. Go to **https://dashboard.render.com** and open your **backend** service.
2. Go to the **Environment** tab.
3. Click **Add Environment Variable**.
4. Add:
   - Key: `SENDGRID_API_KEY` → Value: your full API key.
   - Key: `NOREPLY_EMAIL` → Value: your verified sender email (e.g. `bookings@bookaride.co.nz`).
5. Save.
6. **Redeploy** the service (e.g. **Manual Deploy → Deploy latest commit** or trigger a new deploy). Env changes only apply after a redeploy.

---

## Phase 4: Check that it works

### Step 4.1 – Check that the server sees SendGrid

1. Open in your browser (use your real backend URL if different):
   - **https://bookaride-backend.onrender.com/api/email-status**  
   or  
   - **https://bookaride-backend.onrender.com/email-status**
2. You should see JSON with something like:
   - `"sendgrid_configured": true`
   - `"email_configured": true`
   - `"noreply_email": "bookings@bookaride.co.nz"`

If `sendgrid_configured` is `false`, the backend doesn’t have the key (wrong env or not redeployed).

### Step 4.2 – Send a test email

**Option A – From the admin dashboard**

1. Log in to your Book a Ride admin dashboard.
2. Open the browser console (F12 → Console).
3. Run (replace the email and backend URL if needed):

```javascript
fetch('https://bookaride-backend.onrender.com/api/admin/test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ to: 'your@email.com' })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

4. You should see a success message and receive an email at the address you used.

**Option B – After a real booking**

Create a test booking on the site and check that:

- The customer gets the confirmation email.
- The admin address (e.g. `bookings@bookaride.co.nz`) gets the booking notification.

---

## Quick checklist

- [ ] SendGrid account created / logged in  
- [ ] API key created and copied (Settings → API Keys)  
- [ ] Single Sender added and **verified** (Settings → Sender Authentication → Single Sender)  
- [ ] `SENDGRID_API_KEY` and `NOREPLY_EMAIL` set in backend env (local `.env` or Render)  
- [ ] Backend redeployed (if using Render)  
- [ ] `/api/email-status` or `/email-status` shows `sendgrid_configured: true`  
- [ ] Test email received (admin test-email or test booking)

If any step fails, the most common issues are: sender not verified, typo in the API key, or (on Render) env added but service not redeployed.
