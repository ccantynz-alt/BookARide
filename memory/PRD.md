# Book A Ride NZ - Product Requirements Document

## Original Problem Statement
Airport shuttle booking platform for New Zealand with features including:
- End-to-end booking flow for customers
- Admin dashboard for managing bookings
- Driver portal for viewing assigned jobs
- Stripe payment integration
- Google Calendar integration
- SMS and Email notifications via Twilio and Mailgun
- Multi-stop pickup support
- Flight tracking integration

## Core Features (Completed)
- ✅ Customer booking form with instant pricing
- ✅ Multiple pickup locations support
- ✅ Return trip booking with mandatory flight number validation
- ✅ Admin dashboard with booking management
- ✅ Booking archive system (manual and automatic)
- ✅ Driver portal with manual payout override
- ✅ Stripe payment integration
- ✅ Google Calendar sync
- ✅ SMS/Email notifications
- ✅ "Remember me" feature for returning customers
- ✅ Flight tracking integration
- ✅ Currency converter and price comparison

## Recent Bug Fixes (January 2026)

### Fixed: Price Estimator Not Updating with Multiple Addresses (P0)
**Date:** January 4, 2026
**Issue:** Price estimator didn't update when a second pickup address was added
**Root Cause:** `formData.pickupAddresses` was missing from the useEffect dependency array
**Fix:** Added `formData.pickupAddresses` to the dependency array in `/app/frontend/src/pages/BookNow.jsx` line 217
**Verification:** All 5 test scenarios passed - price correctly updates when addresses are added/removed

## Pending Issues

### P2: Silent Booking Failure Root Cause
- Original problem of booking data potentially being lost after confirmation
- Potential data atomicity issue in `create_booking` function
- Requires investigation of database transaction handling

## Upcoming Tasks
- P0: Deploy and verify production site (bookaride.co.nz)
- P1: Get user feedback on V2 email design
- P1: Connect Google Reviews widget

## Future/Backlog
- Refactor `server.py` (12k+ lines - technical debt)
- Refactor `AdminDashboard.jsx`
- Set up automated database backups
- WhatsApp AI Bot
- Klarna payment integration
- Subscription packages and corporate accounts
- Set up `bookawritenz.com`

## Key Files
- `/app/backend/server.py` - Main backend (monolithic, needs refactoring)
- `/app/frontend/src/pages/BookNow.jsx` - Customer booking form
- `/app/frontend/src/pages/AdminDashboard.jsx` - Admin interface
- `/app/frontend/src/pages/DriverPortal.jsx` - Driver portal
- `/app/HANDOVER_DOCUMENTATION.md` - Setup documentation

## Technical Notes
- Production data auto-sync is DISABLED to prevent local fixes from being overwritten
- Driver portal only shows final payout amounts (no calculation visibility)
- All admin dates standardized to DD/MM/YYYY format
- Frontend validation prevents past-dated bookings

## Admin Credentials
- Username: `admin`
- Password: `Kongkong2025!@`
