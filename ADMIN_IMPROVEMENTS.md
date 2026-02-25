# Admin panel improvements (overnight pass)

Summary of changes made to lighten the admin dashboard, add self-healing, and harden against bugs.

## Tabs removed (lighter UI)
- **Analytics** – Tab and content removed. Removes dependency on `AnalyticsTab` and charting from the initial load.
- **Drivers** – Tab and content removed. Driver list is no longer a dedicated tab; driver assignment still works from the booking details modal (drivers are still loaded in the background for assign-driver).

## Self-healing
- **fetchBookings**
  - **Retry**: On 5xx or network/408 errors, automatically retries once after 1.5s (no retry on 401).
  - **Safe data**: Response is normalized to an array before state update and cache; avoids non-array data causing crashes.
- **Cache fallback**: On failure (after retry), continues to try loading from `localStorage` cached bookings and shows “Loaded cached bookings (offline mode)” when possible.
- **Deferred drivers load**: `fetchDrivers()` runs 600ms after initial load so the bookings list paints first; driver assignment still works when the user opens a booking.

## Safer state and data handling
- **Bookings/list state**: All list state (bookings, filteredBookings, deletedBookings, drivers, archive results, orphan payments) is set only from arrays (`Array.isArray(...) ? ... : []`).
- **Stats**: Stats derived from `bookings` use a safe `bookList` and `(stats.totalRevenue ?? 0).toFixed(2)` so missing revenue doesn’t throw.
- **filterBookings**: Uses `Array.isArray(bookings) ? bookings : []` and guards filter callbacks with `b &&` where needed.
- **exportToCSV**: Uses `Array.isArray(filteredBookings) ? filteredBookings : []` before mapping.
- **searchAllBookings**: Uses `Array.isArray(response.data?.results) ? ... : []` before filtering.

## Bug hardening
- **Revenue/counts**: `totalRevenue` and confirmed/completed counts use nullish coalescing so undefined never causes `.toFixed()` or maths to throw.
- **Cache read**: Cache fallback uses `Array.isArray(cached) && cached.length > 0` before using cached data.
- **append flow**: When appending bookings, previous state is guarded with `Array.isArray(prev) ? prev : []`.

## Existing behaviour kept
- Bookings tab, Shuttle, Deleted, Archive, Customers, Applications, Marketing, Import tabs unchanged (except Analytics and Drivers removed).
- Assign driver, recover missing payments, create/edit booking, Xero, reminders, and the rest of the booking workflow are unchanged.
- Root error boundary and lazy-loaded admin route (from the earlier white-screen fix) are still in place.

## Optional next steps
- Re-enable Analytics or Drivers as a separate route or lazy-loaded tab later if needed.
- Further trim panels (e.g. hide “Today’s operations” or “Urgent notifications” behind a setting) if you want an even lighter default view.
