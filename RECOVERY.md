# Emergency: Get your bookings back

If your admin panel shows **no bookings** or the **Deleted** list is empty, use these steps.

**If you see your bookings in MongoDB but not in the app:** The app reads from the database using `MONGO_URL` and `DB_NAME` (backend env vars). If the panel is empty but Mongo has data, check that your **deployed backend** (e.g. on Render) has the same `MONGO_URL` and `DB_NAME` as the database you’re looking at in Mongo. If the app was pointing at a different database or cluster, fix the env vars and redeploy so the app uses the same DB where your bookings are.

## 1. If you have a backup file (JSON)

- In **Admin → Deleted** tab, use **Recover from backup file** and select your backup JSON.
- Or on the **Bookings** tab, when you see “No bookings in this view”, click **Recover from backup file** and choose the file.
- Backup files are the ones you get from **Deleted → Download backup (JSON)**. If you have that file (or any export that has `active` and `deleted` arrays), use it. All bookings in the file will be restored into your main list.

## 2. If you have no backup file

- **Contact your database host immediately** (e.g. **Render**, **MongoDB Atlas**).
- Ask for:
  - **Database backup restore**, or  
  - **Point-in-time restore** to a time when the data was still there.
- Many hosts keep automatic backups; they can often restore the database to a previous day.

## 3. From now on

- Regularly go to **Admin → Deleted** and click **Download backup (JSON)**. Keep that file somewhere safe (e.g. Google Drive, backup drive).
- That way you always have a copy to restore from using **Recover from backup file** if something goes wrong again.
