# One booking form for all domains

The same booking form and backend are set up to work across these domains:

- **bookaride.co.nz** (main site)
- **airportshuttleservice.co.nz**
- **hibiscustoairport.co.nz**
- **aucklandshuttles.co.nz**
- **bookaridenz.com**

---

## What’s already done

1. **Backend CORS**  
   The API allows requests from all of the domains above (with and without `www`). No extra config needed unless you override `CORS_ORIGINS` in the backend env.

2. **Frontend API URL**  
   When the app runs on any of these domains, it uses the same backend (`https://bookaride-backend.onrender.com`). So the same build works on every domain.

---

## How to use it

### Option A: Deploy the same app to each domain (recommended)

1. Build the React app once (same repo, same build).
2. Point each domain (airportshuttleservice.co.nz, hibiscustoairport.co.nz, aucklandshuttles.co.nz, bookaridenz.com) to that build:
   - Same Vercel/Netlify project with multiple domains, or  
   - Same static host with each domain pointing to it.
3. Users on any domain get the same booking form and flow; all bookings go to the same backend and admin.

### Option B: Redirect “Book now” to the main site

On each other domain, make “Book now” (or equivalent) link to:

**https://bookaride.co.nz/book-now**

Then you only host the form on bookaride.co.nz; no need to deploy the app on the other domains. The backend and CORS are still set for the other domains if you later switch to Option A.

### Option C: Embed the form in an iframe

On airportshuttleservice.co.nz (or any partner site), you can embed:

```html
<iframe
  src="https://bookaride.co.nz/book-now"
  title="Book a ride"
  width="100%"
  height="800"
  style="border: 0;"
></iframe>
```

The form loads from bookaride.co.nz and uses the same backend; no CORS is needed for the iframe content.

---

## Backend env (optional)

To restrict or change which origins are allowed, set in the backend (e.g. on Render):

```env
CORS_ORIGINS=https://bookaride.co.nz,https://www.bookaride.co.nz,https://airportshuttleservice.co.nz,https://hibiscustoairport.co.nz,https://aucklandshuttles.co.nz,https://bookaridenz.com
```

If you don’t set `CORS_ORIGINS`, the backend uses the default list that includes all the domains above.
