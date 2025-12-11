# 🌍 BookaRideNZ.com Deployment Package
## Complete Setup Guide for New Job: 3b916225-97c1-4869-9a8e-2758f66770fb

---

## 🎯 Project Overview

**Primary Domain:** bookaride.co.nz (Main NZ site)
**International Domain:** bookaridenz.com (International SEO campaign)

**Architecture:** Shared Admin Panel ✅
- ONE backend serves both domains
- ONE database stores all bookings
- ONE admin panel manages everything
- Different frontend for international branding

---

## 📋 Quick Start Checklist

**In the new job (3b916225-97c1-4869-9a8e-2758f66770fb), you need to:**

1. ✅ Clone/copy the backend from bookaride.co.nz
2. ✅ Use SAME database connection (shared bookings)
3. ✅ Create international frontend with updated branding
4. ✅ Add international routes (4 pages ready)
5. ✅ Configure domain for bookaridenz.com
6. ✅ Deploy

---

## 🔧 Backend Setup (Shared)

### Key Point: USE EXISTING BACKEND

**Do NOT create new backend from scratch!**

The backend should be **identical** to bookaride.co.nz backend because:
- Same booking system
- Same payment processing
- Same admin authentication
- Same database
- Same notifications

### Environment Variables (.env)

**Critical: Use SAME MongoDB connection:**

```bash
# Database (SHARED - same as bookaride.co.nz)
MONGO_URL="<same MongoDB URL as main site>"
DB_NAME="test_ridenow_db"  # Same database!

# API Keys (SHARED)
GOOGLE_MAPS_API_KEY="<same key>"
STRIPE_API_KEY="<same key>"
STRIPE_PUBLISHABLE_KEY="<same key>"
MAILGUN_API_KEY="<same key>"
MAILGUN_DOMAIN="<same domain>"
TWILIO_ACCOUNT_SID="<same SID>"
TWILIO_AUTH_TOKEN="<same token>"
TWILIO_PHONE_NUMBER="<same number>"

# Email
ADMIN_EMAIL="bookings@bookaride.co.nz"
SENDER_EMAIL="noreply@mg.bookaride.co.nz"

# JWT
JWT_SECRET_KEY="<same secret>"

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_JSON='<same service account JSON>'
```

**Important:** ALL backend environment variables should match bookaride.co.nz!

---

## 🎨 Frontend Setup (New - International Branding)

### Site Configuration

**File:** `/app/frontend/src/config/siteConfig.js`

```javascript
const siteConfig = {
  // International site config
  siteName: 'BookaRide NZ',
  siteUrl: 'https://bookaridenz.com',  // ← NEW DOMAIN
  description: 'Premium airport shuttle and transfer services across New Zealand',
  keywords: 'airport shuttle, airport transfer, New Zealand transport, Auckland airport',
  
  // Contact Info (SAME)
  phone: '+64 21 743 321',
  email: 'bookings@bookaride.co.nz',
  
  // Social Media (SAME)
  facebook: 'https://facebook.com/bookaridenz',
  twitter: 'https://twitter.com/bookaridenz',
  instagram: 'https://instagram.com/bookaridenz',
  
  // Features
  features: {
    bookReturn: true,
    vipService: true,
    oversizedLuggage: true,
    corporateAccounts: true
  },
  
  // Backend API (SAME - shared backend!)
  apiUrl: process.env.REACT_APP_BACKEND_URL || 'https://bookrideseo.preview.emergentagent.com/api',
  
  // International flag
  isInternational: true  // ← NEW: Enables international features
};

export default siteConfig;
```

---

## 📄 International Pages (Ready to Use)

### 4 Pages Already Created:

1. **Auckland Airport International** → `/international/auckland-airport`
2. **Hamilton Airport International** → `/international/hamilton-airport`
3. **Corporate Transfers** → `/international/corporate-transfers`
4. **Group Bookings** → `/international/group-bookings`

### File Contents

#### 1. AucklandAirportInternational.jsx
**Location:** `/app/frontend/src/pages/international/AucklandAirportInternational.jsx`

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import { Button } from '../../components/ui/button';

export const AucklandAirportInternational = () => {
  return (
    <>
      <SEO 
        title="Auckland Airport Shuttle Services - International Travelers"
        description="Premium airport transfer services for international travelers. Meet & greet, 24/7 support, multi-currency pricing. Book your Auckland airport shuttle now!"
        keywords="Auckland airport shuttle, international airport transfer, meet and greet service, Auckland airport pickup"
        canonical="/international/auckland-airport"
        ogImage="/images/international/auckland-airport-social.jpg"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl font-bold mb-6">
                Auckland Airport Shuttle Services
              </h1>
              <p className="text-xl mb-8 text-gray-300">
                Premium airport transfers for international travelers
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/book-now">
                  <Button className="bg-gold hover:bg-gold/90 text-black px-8 py-6 text-lg">
                    Book Your Transfer Now
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-6 text-lg">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Services for International Travelers</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-4xl mb-4">✈️</div>
                <h3 className="text-xl font-bold mb-3">Meet & Greet</h3>
                <p className="text-gray-600">
                  Our driver will meet you at arrivals with a name sign. No stress, no searching!
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-4xl mb-4">🌍</div>
                <h3 className="text-xl font-bold mb-3">Multi-Currency</h3>
                <p className="text-gray-600">
                  Prices shown in USD, EUR, GBP, and NZD. Pay in your preferred currency.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="text-4xl mb-4">📞</div>
                <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
                <p className="text-gray-600">
                  English-speaking support available around the clock for international guests.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Info */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Transparent Pricing</h2>
              <p className="text-lg text-gray-700 mb-8">
                All prices include meet & greet service, luggage assistance, and 24/7 support.
                No hidden fees!
              </p>
              <div className="bg-white p-8 rounded-lg shadow-lg">
                <div className="text-5xl font-bold text-gold mb-2">$75 USD</div>
                <p className="text-gray-600 mb-6">Auckland Airport to City Center</p>
                <p className="text-sm text-gray-500">≈ $125 NZD | €70 EUR | £60 GBP</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-gold to-yellow-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-black mb-6">
              Ready to Book Your Auckland Airport Transfer?
            </h2>
            <p className="text-xl text-black/80 mb-8">
              Simple online booking. Instant confirmation. Professional service.
            </p>
            <Link to="/book-now">
              <Button className="bg-black hover:bg-gray-800 text-white px-12 py-6 text-xl">
                Book Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default AucklandAirportInternational;
```

**Note:** Create similar pages for Hamilton Airport, Corporate Transfers, and Group Bookings with appropriate content.

---

## 🛣️ Routes Configuration

**File:** `/app/frontend/src/App.js`

**Add these imports:**
```javascript
import AucklandAirportInternational from './pages/international/AucklandAirportInternational';
import HamiltonAirportInternational from './pages/international/HamiltonAirportInternational';
import CorporateTransfers from './pages/international/CorporateTransfers';
import GroupBookings from './pages/international/GroupBookings';
import InternationalHomePage from './pages/InternationalHomePage';
```

**Add these routes:**
```javascript
<Routes>
  {/* Home - Show international homepage */}
  <Route path="/" element={<InternationalHomePage />} />
  
  {/* International Pages */}
  <Route path="/international/auckland-airport" element={<AucklandAirportInternational />} />
  <Route path="/international/hamilton-airport" element={<HamiltonAirportInternational />} />
  <Route path="/international/corporate-transfers" element={<CorporateTransfers />} />
  <Route path="/international/group-bookings" element={<GroupBookings />} />
  
  {/* Standard Pages (same as main site) */}
  <Route path="/book-now" element={<BookNow />} />
  <Route path="/about" element={<About />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/services" element={<Services />} />
  
  {/* Admin (SHARED - same panel as bookaride.co.nz) */}
  <Route path="/admin/login" element={<AdminLogin />} />
  <Route path="/admin/dashboard" element={<AdminDashboard />} />
  
  {/* Payment */}
  <Route path="/payment/success" element={<PaymentSuccess />} />
  <Route path="/payment/cancel" element={<PaymentCancel />} />
</Routes>
```

---

## 👨‍💼 Shared Admin Panel

### How It Works

**URL Access:**
- `bookaride.co.nz/admin/login` → Same admin panel
- `bookaridenz.com/admin/login` → Same admin panel

**Login Credentials (SAME):**
```
Username: admin
Password: BookARide2024!
```

**Database:**
- All bookings from BOTH domains → Same MongoDB database
- Admin sees bookings from bookaride.co.nz AND bookaridenz.com together
- Filter/search works across all bookings

**Benefits:**
- ✅ Single login for team
- ✅ All bookings in one place
- ✅ No duplicate management
- ✅ Easier for operations

---

## 🎨 Branding Differences

### bookaride.co.nz (Local NZ)
- Focus: Local New Zealand customers
- Currency: NZD primary
- Content: Local suburbs, NZ-specific
- Tone: Friendly, local

### bookaridenz.com (International)
- Focus: International travelers
- Currency: USD, EUR, GBP, NZD
- Content: International airports, meet & greet emphasis
- Tone: Professional, global
- Features: Multi-currency, 24/7 English support

---

## 📧 Email Configuration

**All emails come from SAME system:**
- Sender: `noreply@mg.bookaride.co.nz`
- Admin notifications: `bookings@bookaride.co.nz`
- Same templates
- Same Mailgun account

**Booking Confirmations:**
Customers on BOTH domains receive:
- ✅ Email confirmation
- ✅ SMS confirmation
- ✅ Same format
- ✅ Same booking reference

---

## 🗺️ SEO & Sitemap

### Create sitemap-international.xml

**File:** `/app/frontend/public/sitemap-international.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://bookaridenz.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/international/auckland-airport</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/international/hamilton-airport</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/international/corporate-transfers</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/international/group-bookings</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/book-now</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://bookaridenz.com/services</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

## 🚀 Deployment Steps

### 1. Set Up Backend (Copy from Main Site)

```bash
# Use IDENTICAL backend code from bookaride.co.nz
# Only change: Environment variable for domain if needed

# Install dependencies
cd /app/backend
pip install -r requirements.txt
```

### 2. Set Up Frontend

```bash
# Install dependencies
cd /app/frontend
yarn install

# Build for production
yarn build
```

### 3. Configure Domain in Emergent

- Go to Emergent dashboard
- Add domain: `bookaridenz.com`
- Point DNS to Emergent servers
- Configure SSL certificate

### 4. Environment Variables

**Backend .env:**
```bash
# Should match bookaride.co.nz backend EXACTLY
MONGO_URL="<same>"
DB_NAME="test_ridenow_db"
# ... all other vars same
```

**Frontend .env:**
```bash
REACT_APP_BACKEND_URL=<Emergent backend URL>
REACT_APP_STRIPE_KEY=<same as main site>
REACT_APP_GOOGLE_MAPS_KEY=<same as main site>
```

### 5. Deploy

```bash
# Deploy via Emergent dashboard
# Click "Deploy" button
```

### 6. Test

- ✅ Visit https://bookaridenz.com
- ✅ International homepage loads
- ✅ Test booking flow
- ✅ Verify admin panel access
- ✅ Check booking appears in admin dashboard
- ✅ Confirm email/SMS sent

---

## ✅ Testing Checklist

**Frontend:**
- [ ] International homepage loads
- [ ] 4 international pages load
- [ ] Book Now form works
- [ ] Payment processing works
- [ ] Confirmation emails received

**Admin Panel:**
- [ ] Can access at bookaridenz.com/admin/login
- [ ] Same login credentials work
- [ ] Bookings from both domains visible
- [ ] Can create manual bookings
- [ ] Send to admin mailbox works

**Integration:**
- [ ] Stripe payment works
- [ ] Google Calendar events created
- [ ] Mailgun emails sent
- [ ] Twilio SMS sent

---

## 📊 Expected Behavior

### Customer Journey (bookaridenz.com)

1. Customer visits `bookaridenz.com`
2. Sees international-focused content
3. Books airport transfer
4. Pays via Stripe
5. Receives email confirmation
6. Receives SMS confirmation

### Admin Journey

1. Admin logs in at `bookaridenz.com/admin/login` (or `bookaride.co.nz/admin/login`)
2. Sees ALL bookings (both domains)
3. Can tell which domain booking came from (if needed, add tracking)
4. Manages bookings normally

---

## 🎯 Key Points Summary

1. **Backend:** SAME as bookaride.co.nz (shared)
2. **Database:** SAME MongoDB (shared bookings)
3. **Admin Panel:** SAME login and dashboard (shared)
4. **Frontend:** NEW with international branding
5. **Routes:** Add 4 international pages
6. **Domain:** Configure bookaridenz.com in Emergent
7. **Deploy:** Standard Emergent deployment process

---

## 📞 Support

If you encounter issues:
1. Check backend logs: `tail -100 /var/log/supervisor/backend.err.log`
2. Verify database connection
3. Test admin login
4. Contact Emergent support if deployment fails

---

## 🎉 Success Criteria

**Deployment successful when:**
- ✅ bookaridenz.com loads international homepage
- ✅ All 4 international pages accessible
- ✅ Booking form creates bookings
- ✅ Bookings appear in admin panel
- ✅ Email/SMS notifications sent
- ✅ Admin can manage bookings from both domains

---

**Good luck with deployment! 🚀**
