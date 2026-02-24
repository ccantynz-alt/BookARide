# Book a Ride – run from this folder

This is the **Book a Ride** project. Open **this folder** in Cursor (File → Open Folder → `C:\Users\ccant\BookARide`) so all paths and commands refer to this project only.

---

## Backend and Google Workspace email

1. **Copy the example env file**  
   In the `backend` folder: copy `backend\.env.example` to `backend\.env`.

2. **Get a Google Workspace App Password** (no API needed)  
   Open **SETUP-GOOGLE-WORKSPACE-EMAIL.md** in this folder. It explains:
   - App Passwords are created in the **user’s** Google Account (e.g. bookings@bookaride.co.nz), **not** in the Google Workspace Admin Console.
   - Direct link: https://myaccount.google.com/apppasswords (sign in as the user who will send mail).
   - You do **not** need any Google API key for sending email.

3. **Edit `backend\.env`**  
   Set at least:
   - `SMTP_USER` = that email (e.g. bookings@bookaride.co.nz)
   - `SMTP_PASS` = the 16-character App Password
   - `NOREPLY_EMAIL` = same as SMTP_USER

4. **Run the backend**  
   From this folder:
   ```powershell
   cd backend
   python -m uvicorn server:app --reload --host 0.0.0.0 --port 8000
   ```
   (Use your usual Python/venv if you have one.)

---

## Frontend

From this folder:

```powershell
cd frontend
npm install
npm start
```

---

For full deployment and feature docs, see the other guides in this folder (e.g. BOOKARIDE_COMPLETE_HANDBOOK.md).
