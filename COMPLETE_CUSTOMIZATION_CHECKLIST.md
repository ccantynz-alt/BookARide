# Complete Site Customization Checklist
## From BookaRide to Your New Brand

Use this checklist to systematically customize the shuttle booking platform for a new brand.

---

## 📋 Pre-Customization Planning

### **Brand Definition**
- [ ] Brand name: ___________________
- [ ] Domain name: ___________________
- [ ] Email address: ___________________
- [ ] Phone number: ___________________
- [ ] Tagline: ___________________
- [ ] Target market: ___________________
- [ ] Positioning: □ Premium  □ Budget  □ Local/Community  □ Other

### **Resources Needed**
- [ ] Logo file (PNG, transparent background recommended)
- [ ] Favicon (ICO or PNG, 32x32px minimum)
- [ ] Brand colors (hex codes)
- [ ] Vehicle photos (optional)
- [ ] Company description/story
- [ ] Testimonials (optional)

---

## 🔧 Core Customization (Required)

### **1. Company Information** ⏱️ 3 mins

**File:** `/app/frontend/src/mock.js`

- [ ] Line 109: Update `name` from "Book A Ride NZ" to your brand name
- [ ] Line 110: Update `tagline` to your positioning statement
- [ ] Line 111: Update `phone` number
- [ ] Line 112: Update `email` address
- [ ] Line 113: Update `address` (city/region)

**Verification:** Check footer on any page - info should be updated

---

### **2. SEO Configuration** ⏱️ 5 mins

**File:** `/app/frontend/src/components/SEO.jsx`

- [ ] Line 12: Update `siteName` to your brand name
- [ ] Line 13: Update `defaultDescription` with your value proposition
- [ ] Line 14: Update `defaultKeywords` with relevant terms
- [ ] Line 15: Update `siteUrl` to your domain

**Verification:** View page source, check `<title>` and meta tags

---

### **3. Homepage Hero Section** ⏱️ 5 mins

**File:** `/app/frontend/src/pages/Home.jsx`

- [ ] Line 45-47: Update hero title (2 lines)
- [ ] Line 49-51: Update hero description
- [ ] Line 72: Update trust badge values (optional)
- [ ] Line 132: Update "Why Choose Us" heading to remove "BookaRide" reference

**Verification:** Visit homepage, check hero looks correct

---

### **4. HTML Meta Tags** ⏱️ 3 mins

**File:** `/app/frontend/public/index.html`

- [ ] Line 7: Update meta description
- [ ] Line 21: Update page title
- [ ] Line 22: Update meta keywords

**Verification:** View page source of homepage

---

### **5. Sitemap Update** ⏱️ 2 mins

**File:** `/app/frontend/public/sitemap.xml`

- [ ] Replace ALL instances of `https://bookaride.co.nz` with your domain (7 locations)
- [ ] Update `<lastmod>` dates to today's date

**Verification:** Visit `/sitemap.xml` in browser

---

### **6. Robots.txt** ⏱️ 1 min

**File:** `/app/frontend/public/robots.txt`

- [ ] Line 6: Update Sitemap URL to your domain

**Verification:** Visit `/robots.txt` in browser

---

### **7. Structured Data** ⏱️ 3 mins

**File:** `/app/frontend/src/components/StructuredData.jsx`

- [ ] Line 9: Update business `name`
- [ ] Line 10: Update `image` URL to your domain
- [ ] Line 11: Update business `url` to your domain
- [ ] Line 12: Update `telephone` number
- [ ] Line 13: Update `email` address
- [ ] Line 50: Update business `description`

**Verification:** View page source, search for "application/ld+json"

---

### **8. Backend Email References** ⏱️ 3 mins

**File:** `/app/backend/server.py`

- [ ] Line 526: Update calendar auth email
- [ ] Line 548: Update token refresh email
- [ ] Line 704: Update OAuth email storage (appears twice)
- [ ] Line 714: Update log message email

**Verification:** Check backend logs after restart

---

### **9. Logo Replacement** ⏱️ 2 mins

**File:** `/app/frontend/public/logo.png`

- [ ] Replace with your brand logo
- [ ] Recommended size: 200-400px wide, transparent background
- [ ] Filename must stay as `logo.png`

**Verification:** Check header on all pages

---

### **10. Page-Level SEO** ⏱️ 10 mins

Update SEO component on each page:

#### Homepage (`/app/frontend/src/pages/Home.jsx`)
- [ ] Line 20-28: Update title, description, keywords

#### Services (`/app/frontend/src/pages/Services.jsx`)
- [ ] Update SEO component with brand-specific messaging

#### About (`/app/frontend/src/pages/About.jsx`)
- [ ] Update SEO component

#### Hobbiton (`/app/frontend/src/pages/HobbitonTransfers.jsx`)
- [ ] Update SEO component (or remove if not offering)

#### Cruise (`/app/frontend/src/pages/CruiseTransfers.jsx`)
- [ ] Update SEO component (or remove if not offering)

**Verification:** Check meta tags on each page

---

## 🎨 Content Customization (Recommended)

### **11. About Page Content** ⏱️ 15 mins

**File:** `/app/frontend/src/pages/About.jsx`

- [ ] Lines 40-50: Update company story/history
- [ ] Lines 127-135: Update statistics (customers, ratings, etc.)
- [ ] Lines 154-163: Update mission statement
- [ ] Lines 162-166: Update vision statement

**Verification:** Visit `/about` page

---

### **12. Testimonials** ⏱️ 10 mins

**File:** `/app/frontend/src/mock.js`

- [ ] Lines 34-40: Update testimonial 1 (name, role, content)
- [ ] Lines 42-48: Update testimonial 2
- [ ] Lines 50-56: Update testimonial 3

**Verification:** Check homepage testimonials section

---

### **13. Service Descriptions** ⏱️ 10 mins

**File:** `/app/frontend/src/mock.js`

- [ ] Lines 4-10: Auckland Airport Shuttle description
- [ ] Lines 12-17: Hamilton Airport Shuttle description  
- [ ] Lines 19-24: Whangarei Airport Shuttle description
- [ ] Lines 26-31: Private Auckland Transfers description

**Verification:** Check services section on homepage

---

### **14. Fleet Information** ⏱️ 5 mins

**File:** `/app/frontend/src/mock.js`

- [ ] Lines 82-87: Standard Sedan specs
- [ ] Lines 89-94: Premium Sedan specs
- [ ] Lines 96-100: SUV specs
- [ ] Lines 102-106: Van specs

**Verification:** Check services page fleet section

---

## 🚀 Environment & Deployment

### **15. Environment Variables** ⏱️ 5 mins

**File:** `/app/frontend/.env`

- [ ] Update `REACT_APP_BACKEND_URL` to your production URL
- [ ] Verify `REACT_APP_GOOGLE_MAPS_API_KEY` (use separate key or shared)

**File:** `/app/backend/.env`

- [ ] Verify `MONGO_URL` (separate database or shared)
- [ ] Verify API keys (separate accounts or shared):
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `SENDGRID_API_KEY`
  - [ ] `TWILIO_ACCOUNT_SID`
  - [ ] `TWILIO_AUTH_TOKEN`
  - [ ] `GOOGLE_MAPS_API_KEY`
  - [ ] `GOOGLE_CLIENT_ID`
  - [ ] `GOOGLE_CLIENT_SECRET`

**Verification:** Services start without errors

---

### **16. Test Locally** ⏱️ 10 mins

- [ ] Restart services: `sudo supervisorctl restart frontend backend`
- [ ] Check homepage loads: `http://localhost:3000`
- [ ] Verify branding on header/footer
- [ ] Check all navigation links work
- [ ] Verify "Book Now" form displays correctly
- [ ] Check sitemap: `/sitemap.xml`
- [ ] Check robots.txt: `/robots.txt`
- [ ] View page source and verify meta tags

---

### **17. Deployment Preparation** ⏱️ 5 mins

- [ ] All files saved and committed
- [ ] Logo file uploaded
- [ ] Environment variables set for production
- [ ] Database configured (separate or shared)
- [ ] API keys verified

---

## 🎯 Optional Enhancements

### **18. Color Theme** ⏱️ 30 mins

If changing from gold/black theme:

- [ ] Update `tailwind.config.js` color definitions
- [ ] Search/replace `bg-gold`, `text-gold`, `border-gold` throughout codebase
- [ ] Update hover states
- [ ] Test all pages for consistency

---

### **19. Remove Features** ⏱️ Variable

For simpler/budget brands, consider removing:

- [ ] VIP Airport Service option (BookNow.jsx)
- [ ] Oversized Luggage option (BookNow.jsx)
- [ ] Hobbiton Transfers page (remove route + nav link)
- [ ] Cruise Transfers page (remove route + nav link)
- [ ] "Why Choose Us" section (Home.jsx)

---

### **20. Pricing Adjustments** ⏱️ 10 mins

**File:** `/app/backend/server.py` (lines 308-324)

- [ ] Adjust per-kilometer rates
- [ ] Update minimum booking fee
- [ ] Modify passenger fees
- [ ] Adjust VIP service price
- [ ] Adjust oversized luggage price

---

### **21. Vehicle Images** ⏱️ 15 mins

Replace placeholder images:

- [ ] `/app/frontend/public/shuttle-van.jpg` - Main vehicle
- [ ] `/app/frontend/public/images/vehicle.png` - Additional
- [ ] Add more vehicle photos to public/images/

**Update references in:**
- [ ] Home.jsx background images
- [ ] Services.jsx background images
- [ ] About.jsx background images

---

## ✅ Post-Customization Verification

### **Final Checks**
- [ ] All pages load without errors
- [ ] No "BookaRide" references remain (search entire codebase)
- [ ] No "bookaride.co.nz" references remain
- [ ] Logo displays correctly in header
- [ ] Contact information correct in footer
- [ ] Email address correct throughout
- [ ] Phone number correct throughout
- [ ] Sitemap has new domain
- [ ] Robots.txt has new domain
- [ ] Meta tags have brand name
- [ ] Structured data has brand info

### **Browser Testing**
- [ ] Chrome: Homepage, Services, Book Now
- [ ] Firefox: Homepage, Services, Book Now
- [ ] Safari/Mobile: Homepage, Services, Book Now
- [ ] Check console for errors (F12)

### **SEO Verification**
- [ ] View source → Check `<title>` tags
- [ ] View source → Check meta descriptions
- [ ] View source → Check Open Graph tags
- [ ] Test sitemap URL in browser
- [ ] Test robots.txt URL in browser

---

## 📊 Time Estimates

| Task Category | Estimated Time |
|--------------|---------------|
| Core Customization (1-10) | 30-40 minutes |
| Content Customization (11-14) | 40-50 minutes |
| Environment & Deployment (15-17) | 20 minutes |
| Optional Enhancements (18-21) | 1-2 hours |
| **TOTAL (Required Only)** | **50-60 minutes** |
| **TOTAL (With Optional)** | **2-3 hours** |

---

## 🆘 Common Issues & Solutions

### **Issue: Logo not appearing**
- Check file exists at `/app/frontend/public/logo.png`
- Check file permissions
- Hard refresh browser (Ctrl+Shift+R)

### **Issue: Old brand name still showing**
- Search entire codebase for old name
- Check compiled build (might need to rebuild)
- Clear browser cache

### **Issue: Services won't restart**
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
- Check frontend logs: `tail -f /var/log/supervisor/frontend.err.log`
- Verify no syntax errors in modified files

### **Issue: Meta tags not updating**
- React Helmet updates on client side only
- View rendered source, not initial HTML
- Check SEO component is imported on page

---

## 📝 Customization Log

Use this to track your changes:

**Brand Name:** ___________________
**Date Started:** ___________________
**Date Completed:** ___________________

**Files Modified:**
- [ ] mock.js
- [ ] SEO.jsx
- [ ] Home.jsx
- [ ] index.html
- [ ] sitemap.xml
- [ ] robots.txt
- [ ] StructuredData.jsx
- [ ] server.py
- [ ] About.jsx (optional)
- [ ] Logo replaced
- [ ] .env files updated

**Issues Encountered:**
______________________________
______________________________
______________________________

**Notes for Next Brand:**
______________________________
______________________________
______________________________

---

**Checklist Version:** 1.0
**Template Version:** BookaRide → Multi-Brand System
**Last Updated:** January 2025
