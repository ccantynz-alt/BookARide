# BookaRideNZ.com Deployment Guide

## Overview

This site now supports **multiple domains** using a single codebase with domain-based configuration.

**Domains Supported:**
- ✅ bookaride.co.nz (primary)
- ✅ bookaridenz.com (clone)

---

## How It Works

The site automatically detects the domain and applies the correct configuration:

**Configuration File:** `/app/frontend/src/config/siteConfig.js`

```javascript
configs = {
  'bookaride.co.nz': { ... },
  'bookaridenz.com': { ... }
}
```

**Components Updated to Use Config:**
- ✅ `mock.js` - Company info (name, email, phone)
- ✅ `SEO.jsx` - Meta tags, site name, description
- ✅ `StructuredData.jsx` - Schema.org business info

---

## Deployment Options

### Option 1: Single Deployment (Recommended)

Deploy once, both domains work automatically:

**Requirements:**
1. Point **both domains** to the same deployment
2. Configure DNS for both:
   - `bookaride.co.nz` → Your server IP
   - `bookaridenz.com` → Same server IP

**Advantages:**
- ✅ Single deployment to manage
- ✅ Automatic domain detection
- ✅ Shared backend & database
- ✅ Updates apply to both sites instantly

**How to Add More Domains:**
Just update `/app/frontend/src/config/siteConfig.js` and add new domain config.

---

### Option 2: Separate Deployments

If you want completely separate deployments:

1. **Clone this project** to a new Emergent project
2. **Update config** to only include bookaridenz.com
3. **Deploy separately**

---

## DNS Configuration

### For bookaridenz.com:

**If using Cloudflare/Domain Registrar:**

1. Add A Record:
   ```
   Type: A
   Name: @
   Value: YOUR_SERVER_IP
   TTL: Auto
   ```

2. Add CNAME for www:
   ```
   Type: CNAME
   Name: www
   Value: bookaridenz.com
   TTL: Auto
   ```

3. (Optional) Add to Emergent custom domain settings

---

## Testing Multi-Domain Setup

### Local Testing:

**Test bookaride.co.nz config:**
```bash
# Edit /etc/hosts to point domain to localhost
echo "127.0.0.1 bookaride.co.nz" | sudo tee -a /etc/hosts
# Visit: http://bookaride.co.nz:3000
```

**Test bookaridenz.com config:**
```bash
echo "127.0.0.1 bookaridenz.com" | sudo tee -a /etc/hosts
# Visit: http://bookaridenz.com:3000
```

### Production Testing:

Once DNS is configured, visit both domains and verify:
- ✅ Correct email address in footer
- ✅ Correct phone number
- ✅ Correct site name in meta tags
- ✅ Booking form works on both
- ✅ Payments work on both

---

## Backend Configuration

Both domains share the **same backend API**.

**No backend changes needed!**

The backend doesn't need to know which domain is being used because:
- Same booking system
- Same database
- Same admin dashboard
- Same API keys

**Admin Dashboard:**
Access from either domain:
- https://bookaride.co.nz/admin/login
- https://bookaridenz.com/admin/login

Both go to the same admin panel showing all bookings.

---

## Environment Variables

**Frontend (.env):**
```bash
REACT_APP_BACKEND_URL=https://your-backend-url.com
# This stays the same for both domains!
```

**Backend (.env):**
No changes needed. Backend serves both domains.

---

## SEO Considerations

### Duplicate Content Warning

Having two domains with identical content can hurt SEO. Solutions:

**Option 1: Canonical Tags (Recommended)**
Already implemented! Each page has canonical URL pointing to primary domain.

**Option 2: 301 Redirect**
Redirect one domain to the other:
```nginx
# Redirect bookaridenz.com → bookaride.co.nz
server {
    server_name bookaridenz.com;
    return 301 https://bookaride.co.nz$request_uri;
}
```

**Option 3: Different Markets**
- bookaride.co.nz → Target New Zealand market
- bookaridenz.com → Target international market

Update descriptions/keywords accordingly in config.

---

## Sitemap Management

### Current Sitemap:
Located at `/sitemap.xml` - currently hardcoded to bookaride.co.nz

### For Multi-Domain:

**Option A: Separate Sitemaps**
Generate different sitemap for each domain in backend:
- `/sitemap.xml?domain=bookaride.co.nz`
- `/sitemap.xml?domain=bookaridenz.com`

**Option B: Combined Sitemap**
Single sitemap with all pages from both domains.

**Recommendation:** Keep single sitemap pointing to primary domain (bookaride.co.nz) and use canonical tags for the other.

---

## Analytics Setup

### Google Analytics:

**Option 1: Combined Tracking**
Use same GA property for both domains:
- See all traffic together
- Use filters to separate by domain

**Option 2: Separate Properties**
Create separate GA properties:
- bookaride.co.nz → GA Property 1
- bookaridenz.com → GA Property 2

Update `siteConfig.js` to include GA tracking IDs per domain.

---

## Troubleshooting

### Wrong domain showing:

**Issue:** Site shows bookaride.co.nz info when accessing bookaridenz.com

**Fix:**
1. Check `/etc/hosts` for overrides
2. Clear browser cache
3. Check `siteConfig.js` has correct domain config
4. Verify DNS is pointing to correct server

### Config not updating:

**Issue:** Changes to `siteConfig.js` not reflecting

**Fix:**
```bash
# Restart frontend
sudo supervisorctl restart frontend
# Clear browser cache
# Hard refresh (Ctrl+Shift+R)
```

---

## Adding More Domains

To add a third domain (e.g., airportshuttle.co.nz):

1. Edit `/app/frontend/src/config/siteConfig.js`
2. Add new domain config:
   ```javascript
   'airportshuttle.co.nz': {
     siteName: 'Airport Shuttle NZ',
     email: 'info@airportshuttle.co.nz',
     // ... other config
   }
   ```
3. Configure DNS to point to your server
4. Done! No other changes needed.

---

## Monitoring

### Check Which Config is Active:

Add this to browser console:
```javascript
// Shows current domain and config
console.log(window.location.hostname);
```

### Backend Logs:

All domains share same backend logs:
```bash
tail -f /var/log/supervisor/backend.out.log
```

---

## Current Status

✅ **Completed:**
- Configuration system created
- Components updated to use config
- Support for bookaride.co.nz
- Support for bookaridenz.com
- Auto-detection working

⏳ **Pending:**
- DNS configuration for bookaridenz.com (your action)
- Testing with live DNS
- Google Analytics setup (optional)

---

## Quick Reference

| Item | bookaride.co.nz | bookaridenz.com |
|------|-----------------|-----------------|
| **Email** | info@bookaride.co.nz | info@bookaridenz.com |
| **Phone** | +64 9 555 0123 | +64 9 555 0123 |
| **Backend** | Shared | Shared |
| **Database** | Shared | Shared |
| **Admin** | Shared | Shared |

---

**Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Ready for Deployment
