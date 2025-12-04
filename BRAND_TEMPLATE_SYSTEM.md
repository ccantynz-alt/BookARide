# Brand Template System - Multi-Brand Configuration Guide

This guide shows you how to quickly customize the shuttle booking platform for new brands.

---

## 🎯 Overview

This codebase is now a **reusable template** that can be customized for multiple shuttle brands. Each brand can have:
- Unique branding (name, logo, colors, messaging)
- Same powerful features (booking, payments, confirmations)
- Shared or separate backend infrastructure

---

## 📝 Quick Customization Checklist

### **Step 1: Brand Identity** (5 mins)
Define your new brand:
- [ ] Brand name
- [ ] Domain name
- [ ] Tagline/positioning
- [ ] Target market
- [ ] Email address
- [ ] Phone number
- [ ] Color scheme (optional)

### **Step 2: Find & Replace** (10 mins)
Use these search/replace patterns:

#### **Pattern 1: Company Name**
```
Find: "Book A Ride NZ" OR "BookaRide"
Replace with: "[Your Brand Name]"
Files: mock.js, SEO.jsx, StructuredData.jsx
```

#### **Pattern 2: Domain**
```
Find: bookaride.co.nz
Replace with: [yourdomain.co.nz]
Files: SEO.jsx, sitemap.xml, robots.txt, StructuredData.jsx, index.html
```

#### **Pattern 3: Email**
```
Find: info@bookaride.co.nz
Replace with: info@[yourdomain.co.nz]
Files: mock.js, server.py (4 locations), StructuredData.jsx
```

#### **Pattern 4: Tagline**
```
Find: "Airport Shuttles & Private Transfers Across New Zealand"
Replace with: "[Your Tagline]"
Files: mock.js
```

### **Step 3: Update Messaging** (15 mins)
Customize these key sections:
- [ ] Hero title and subtitle (`/app/frontend/src/pages/Home.jsx` lines 45-51)
- [ ] "Why Choose Us" heading (`/app/frontend/src/pages/Home.jsx` line 132)
- [ ] SEO meta descriptions (all page-level SEO components)
- [ ] About page content (`/app/frontend/src/pages/About.jsx`)

### **Step 4: Replace Assets** (5 mins)
- [ ] Logo: `/app/frontend/public/logo.png`
- [ ] Favicon: `/app/frontend/public/favicon.ico` (optional)
- [ ] Vehicle images: `/app/frontend/public/images/` (optional)

### **Step 5: Environment Variables** (5 mins)
Update `.env` files:
- [ ] `REACT_APP_BACKEND_URL` → new production URL
- [ ] Decide: shared or separate API keys?

---

## 🗂️ Master File Reference

### **Files That Need Customization**

#### **Core Brand Files** (Must change for each brand)
1. `/app/frontend/src/mock.js`
   - Line 109-114: Company info (name, tagline, phone, email)
   
2. `/app/frontend/src/components/SEO.jsx`
   - Line 12-16: Site name, default description, keywords, URL
   
3. `/app/frontend/src/pages/Home.jsx`
   - Line 45-51: Hero section (title, subtitle, description)
   - Line 132: "Why Choose Us" heading
   - Line 72: Trust badge values (optional)
   
4. `/app/frontend/public/index.html`
   - Line 7: Meta description
   - Line 21: Page title
   - Line 22: Meta keywords
   
5. `/app/frontend/public/sitemap.xml`
   - All `<loc>` tags: Change domain
   
6. `/app/frontend/public/robots.txt`
   - Line 6: Sitemap URL
   
7. `/app/frontend/src/components/StructuredData.jsx`
   - Line 9-15: Business name, image, URL, phone, email
   - Line 50: Description

8. `/app/backend/server.py`
   - Line 526: Calendar auth email
   - Line 548: Token refresh email
   - Line 704: OAuth email (2 places)
   - Line 714: Log message email

#### **Optional Customization Files**
9. `/app/frontend/src/pages/About.jsx` - Company story
10. `/app/frontend/src/pages/Services.jsx` - Service descriptions
11. `/app/frontend/src/mock.js` - Testimonials (line 34-56)
12. `/app/frontend/src/mock.js` - Fleet descriptions (line 81-106)

---

## 🎨 Brand Positioning Templates

### **Template A: Premium/Luxury**
**Example:** BookaRide.co.nz
- **Title:** "Premium Airport Shuttles With Instant Online Booking"
- **Description:** "Auckland's most modern airport shuttle service..."
- **Keywords:** premium, professional, VIP, luxury, executive
- **Pricing:** $2.50-$3.50/km (standard to premium)
- **Features:** Emphasize VIP service, modern tech, comfort

### **Template B: Budget/Value**
**Example:** AirportShuttleService.co.nz
- **Title:** "Affordable Airport Shuttles - Best Value in Auckland"
- **Description:** "Reliable airport transfers at unbeatable prices..."
- **Keywords:** affordable, cheap, budget, best value, economical
- **Pricing:** $2.00-$2.50/km (budget-friendly)
- **Features:** Emphasize affordability, reliability, no-frills

### **Template C: Local/Community**
**Example:** HibiscusToAirport.co.nz
- **Title:** "Your Local Hibiscus Coast Airport Shuttle"
- **Description:** "Serving our Hibiscus Coast community with..."
- **Keywords:** local, community, Orewa, Whangaparaoa, neighborhood
- **Pricing:** $2.25-$2.75/km (local rates)
- **Features:** Emphasize local knowledge, community, personal service

---

## 🛠️ Advanced Customization

### **Colors & Theme**
Current theme: Black (#000000) + Gold (#D4AF37)

To change colors globally:
1. Update `tailwind.config.js`:
   ```javascript
   colors: {
     gold: '#YOUR_COLOR',  // Primary accent color
   }
   ```
2. Search for `bg-gold`, `text-gold`, `border-gold` in all files
3. Replace with your brand color classes

### **Pricing Tiers**
Current pricing logic in `/app/backend/server.py` (lines 308-324):
- < 75km: $2.50/km
- 75-100km: $2.70/km
- 100-300km: $3.50/km
- > 300km: $2.50/km
- Minimum: $100

To adjust for different brands:
```python
# Budget brand example
if distance_km >= 100 and distance_km <= 300:
    base_price = distance_km * 3.00  # Lower than premium
elif distance_km >= 75 and distance_km < 100:
    base_price = distance_km * 2.40
else:
    base_price = distance_km * 2.00
```

### **Remove Features**
To simplify for budget brands:
- Remove VIP service: Delete checkbox in BookNow.jsx (lines 381-398)
- Remove oversized luggage: Delete checkbox (lines 400-411)
- Remove Hobbiton page: Delete route in App.js and nav link
- Remove Cruise page: Delete route in App.js and nav link

---

## 📋 Brand Comparison Matrix

| Feature | Premium (BookaRide) | Value (AirportShuttle) | Local (Hibiscus) |
|---------|-------------------|----------------------|-----------------|
| **Pricing** | $2.50-$3.50/km | $2.00-$2.50/km | $2.25-$2.75/km |
| **VIP Service** | ✅ Highlighted | ✅ Available | ⚠️ Optional |
| **Oversized Luggage** | ✅ $25 | ✅ $25 | ✅ $20 |
| **Hobbiton Tours** | ✅ Featured | ✅ Available | ❌ Not offered |
| **Cruise Transfers** | ✅ Featured | ✅ Available | ⚠️ Limited |
| **Target Market** | Business travelers, tourists | Budget-conscious families | Local residents |
| **Messaging Tone** | Professional, modern | Straightforward, reliable | Friendly, community |
| **Brand Colors** | Black + Gold | Blue + Green | Coastal Blue |

---

## 🚀 Deployment Strategies

### **Strategy 1: Separate Deployments**
- Each brand = separate Emergent project
- Pros: Complete isolation, easy to manage
- Cons: 3x hosting costs, updates needed 3x
- **Best for:** Brands with very different features/pricing

### **Strategy 2: Multi-Tenant Architecture**
- Single codebase serves all brands
- Brand determined by domain/subdomain
- Pros: Single update for all, shared infrastructure
- Cons: More complex initial setup
- **Best for:** Multiple similar brands, white-label

### **Strategy 3: Hybrid**
- Shared backend API for all brands
- Separate frontend deployments
- Pros: Consolidated booking management
- Cons: Medium complexity
- **Best for:** Most multi-brand operations ← **RECOMMENDED**

---

## 💾 Database Strategies

### **Option 1: Shared Database**
All brands use same MongoDB instance with brand field:
```javascript
{
  bookingId: "...",
  brand: "bookaride", // or "airportshuttle" or "hibiscus"
  ...
}
```
**Pros:** Consolidated reporting, single admin dashboard
**Cons:** Need brand filtering in all queries

### **Option 2: Separate Databases**
Each brand has own MongoDB database:
**Pros:** Complete data isolation
**Cons:** Need separate admin dashboards or complex filtering

### **Option 3: Separate Collections**
Same database, different collections per brand:
- `bookaride_bookings`
- `airportshuttle_bookings`
- `hibiscus_bookings`

**Pros:** Balance of isolation and consolidation
**Cons:** More collections to manage

---

## 📱 API Keys Strategy

### **Shared Keys (Simpler)**
Use same API keys across all brands:
- Stripe: Single merchant account
- SendGrid: One email account
- Twilio: One SMS account
- Google: Same API key

**Pros:** Easier setup, consolidated billing
**Cons:** Can't track revenue per brand easily

### **Separate Keys (Recommended)**
Each brand uses own API keys:
- Stripe: Separate merchant accounts per brand
- SendGrid: Different sender emails
- Twilio: Different phone numbers
- Google: Separate projects

**Pros:** Clear revenue tracking, isolated issues
**Cons:** More setup, multiple logins

---

## 🎓 Quick Start Templates

### **New Brand in 30 Minutes**

```bash
# 1. Search and replace (5 mins)
# Use your code editor's find/replace:
# - "Book A Ride NZ" → "Your Brand Name"
# - "bookaride.co.nz" → "yourdomain.co.nz"
# - "info@bookaride.co.nz" → "info@yourdomain.co.nz"

# 2. Update hero (5 mins)
# Edit /app/frontend/src/pages/Home.jsx lines 45-51

# 3. Replace logo (2 mins)
# Replace /app/frontend/public/logo.png

# 4. Update SEO (10 mins)
# Edit SEO.jsx with new descriptions and keywords

# 5. Update sitemap (3 mins)
# Edit sitemap.xml with new domain

# 6. Test locally (5 mins)
# sudo supervisorctl restart frontend backend
# Check http://localhost:3000
```

---

## 📞 Support Checklist

When supporting multiple brands, ensure:
- [ ] Each brand has its own Google Analytics property
- [ ] Separate Google Search Console properties
- [ ] Brand-specific email templates
- [ ] Different booking confirmation styles per brand
- [ ] Admin dashboard can filter by brand
- [ ] Reporting shows per-brand metrics

---

**Template Version:** 1.0
**Last Updated:** January 2025
**Brands Using This Template:** 3 (BookaRide, AirportShuttleService, HibiscusToAirport)
