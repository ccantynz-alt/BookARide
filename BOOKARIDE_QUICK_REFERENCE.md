# BookaRide Quick Reference Card

## 1. GET THESE API KEYS FIRST

| Service | Get From |
|---------|----------|
| Google Maps | console.cloud.google.com (Enable Distance Matrix + Places API) |
| Stripe | dashboard.stripe.com/apikeys |
| Twilio | console.twilio.com |
| Mailgun | app.mailgun.com (optional; can use Google Workspace SMTP instead) |
| AviationStack | aviationstack.com (free tier) |
| OpenAI | Use Emergent LLM Key (built-in) |

---

## 2. BACKEND .env FILE

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=bookaride
JWT_SECRET_KEY=your-secret-key
PUBLIC_DOMAIN=https://yourdomain.com
GOOGLE_MAPS_API_KEY=xxx
STRIPE_API_KEY=sk_xxx
STRIPE_PUBLISHABLE_KEY=pk_xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+64xxx
# Email: either Mailgun or Google Workspace SMTP (see GOOGLE_WORKSPACE_EMAIL_SETUP.md)
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mg.yourdomain.com
# Or use Google Workspace:
# SMTP_USER=bookings@yourdomain.com
# SMTP_PASS=your-app-password
# NOREPLY_EMAIL=bookings@yourdomain.com
AVIATIONSTACK_API_KEY=xxx
EMERGENT_LLM_KEY=xxx
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 3. FRONTEND .env FILE

```env
REACT_APP_BACKEND_URL=https://yourdomain.com
REACT_APP_GOOGLE_MAPS_API_KEY=xxx
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_xxx
```

---

## 4. KEY API ENDPOINTS

```
POST /api/calculate-price    - Get trip price
POST /api/bookings           - Create booking
GET  /api/bookings           - List bookings (admin)
DELETE /api/bookings/{id}    - Soft-delete booking
POST /api/bookings/restore/{id} - Restore deleted booking
GET  /api/bookings/deleted   - List deleted bookings
PATCH /api/drivers/{id}/assign?booking_id=xxx - Assign driver
POST /api/admin/login        - Admin login
GET  /api/flight/track?flight_number=NZ123 - Track flight
```

---

## 5. PRICING FORMULA

```
First 10km:  $5.00/km
11-25km:     $4.00/km  
25km+:       $3.50/km
Minimum:     $100.00
Return trip: 2x price
```

---

## 6. DATABASE COLLECTIONS

```
bookings          - All bookings
deleted_bookings  - Soft-deleted (recoverable)
drivers           - Driver accounts
admin_users       - Admin accounts
seo_pages         - Dynamic landing pages
```

---

## 7. ADMIN DASHBOARD TABS

1. **Bookings** - Manage all bookings
2. **Deleted** - Recover deleted bookings (NEW!)
3. **Analytics** - Revenue & stats
4. **Customers** - Customer database
5. **Drivers** - Driver management
6. **Applications** - Driver applications
7. **Marketing** - SEO & Facebook

---

## 8. PAGES TO BUILD

**Public:** Home, BookNow, Services, Hobbiton, Cruise, FlightTracker, TravelGuide, International, About, Contact

**Admin:** Login, Dashboard, SEO, DriverPortal

**All pages need:** SEO meta tags, Breadcrumbs, Mobile responsive

---

## 9. KEY FEATURES

- [x] Real-time price calculator
- [x] Multiple pickup addresses
- [x] Return trip booking
- [x] Stripe/PayPal/Cash payments
- [x] Email + SMS confirmations
- [x] Day-before reminders
- [x] Flight tracking
- [x] Driver assignment with notifications
- [x] Soft-delete with recovery
- [x] AI chatbot
- [x] iCloud contact sync
- [x] Google Calendar sync

---

## 10. TEST COMMANDS

```bash
# Restart services
sudo supervisorctl restart backend frontend

# Check logs
tail -f /var/log/supervisor/backend.err.log

# Test pricing
curl -X POST "https://yourdomain.com/api/calculate-price" \
  -H "Content-Type: application/json" \
  -d '{"pickupAddress":"Auckland CBD","dropoffAddress":"Auckland Airport"}'

# Create admin
curl -X POST "https://yourdomain.com/api/admin/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword"}'
```

---

**Full documentation:** See BOOKARIDE_COMPLETE_HANDBOOK.md
