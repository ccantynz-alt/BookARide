# Test booking so admin receives a copy

Use this to confirm that (1) the backend sends email via Google Workspace and (2) the admin gets a copy of each booking.

---

## 1. Frontend: point to your local backend (one-time)

**Nothing in the frontend code needs to be edited.** You only set one env variable so the app talks to your local backend instead of production.

- In the **frontend** folder, create a file named **`.env`** (same folder as `package.json`).
- Put this in it (no quotes):

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

That’s it. No other frontend changes for email or booking copies.

---

## 2. Backend: set admin email for booking copies

- Open **`backend\.env`**.
- Set **admin real email** for the variable that receives every new booking:

```env
BOOKINGS_NOTIFICATION_EMAIL=admin@bookaride.co.nz
```

(Use your real admin address. You can use a comma-separated list to add more addresses.)

- Ensure **Google Workspace SMTP** is set in the same file (you should already have these from the email setup):

```env
SMTP_USER=bookings@bookaride.co.nz
SMTP_PASS=your-16-char-app-password
NOREPLY_EMAIL=bookings@bookaride.co.nz
```

Save the file.

---

## 3. Run backend and frontend

**Terminal 1 – backend**

```powershell
cd C:\Users\ccant\BookARide\backend
python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

Wait until you see something like `Uvicorn running on http://0.0.0.0:8000`.

**Terminal 2 – frontend**

```powershell
cd C:\Users\ccant\BookARide\frontend
npm install
npm start
```

When the browser opens (e.g. http://localhost:3000), you’re using the **local** backend because of `REACT_APP_BACKEND_URL=http://localhost:8000`.

---

## 4. Do a test booking

1. On the Book a Ride site (localhost:3000), go through **Book Now** and fill the form.
2. For **customer email**, use an address you can check (e.g. your own). The **admin** will get a copy automatically (to the address in `BOOKINGS_NOTIFICATION_EMAIL`).
3. Submit the booking.

---

## 5. How to know it worked

- **Backend terminal:** You should see log lines like:
  - `Confirmation email sent to ... via SMTP` (or Mailgun)
  - `Auto-notification sent to admin@... for booking: #...`
- **Admin inbox:** The address in `BOOKINGS_NOTIFICATION_EMAIL` should receive the **admin copy** (new booking notification). The **customer** email on the booking receives the customer confirmation.

If the admin doesn’t get anything, check:

- `backend\.env`: `SMTP_USER`, `SMTP_PASS`, `BOOKINGS_NOTIFICATION_EMAIL` (and that the App Password is correct).
- Backend logs for “SMTP credentials not configured” or “Failed to send”.
- Spam/junk for the admin address.

---

## Summary

| Question | Answer |
|----------|--------|
| Does anything need to be edited in the frontend? | Only add `frontend\.env` with `REACT_APP_BACKEND_URL=http://localhost:8000` for local testing. No code changes. |
| How do I know it will work? | After the test booking, check backend logs and admin inbox (customer + admin copy). |
| How do we do a test so admin gets a copy? | Set `BOOKINGS_NOTIFICATION_EMAIL=admin@bookaride.co.nz` (or your admin email) in `backend\.env`, run backend + frontend locally, submit a booking. |
