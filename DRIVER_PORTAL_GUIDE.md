# 🚗 Driver Portal - Complete Guide

## Overview

The Driver Portal allows your drivers to log in and view their assigned bookings. **The key feature is that drivers see 15% less than what customers paid, without any indication of the reduction.**

---

## 🔐 How It Works

### Pricing Logic:
- **Customer pays:** $100.00
- **Driver sees:** $85.00 (15% commission taken)
- **Driver display:** Shows as "$85.00 Payment" (no mention of reduction or original price)

### Security:
- Drivers can only see their own assigned bookings
- Cannot see customer's full payment amount
- Cannot see admin panel or other drivers' schedules
- Secure authentication with JWT tokens

---

## 📋 Setup Instructions

### Step 1: Add a Driver (Admin)
1. Log in to Admin Dashboard
2. Go to **Drivers** tab
3. Click **"Add Driver"**
4. Fill in driver details:
   - Name
   - Phone
   - Email *(this will be their login username)*
   - License Number
   - Status (Active/Inactive/On Leave)
   - Notes (optional)
5. Click **"Add Driver"**

### Step 2: Set Driver Password (Admin)
1. On the driver card, click the **Key icon** (🔑)
2. Enter a password (minimum 6 characters)
3. Click **"Set Password"**
4. Share the login credentials with the driver:
   - **Login URL:** `https://your-domain.com/driver/login`
   - **Email:** (the email you entered)
   - **Password:** (the password you just set)

### Step 3: Assign Driver to Bookings (Admin)
1. Go to **Bookings** tab
2. Click the **eye icon** on any booking
3. Scroll to **"Driver Assignment"** section
4. Select the driver from dropdown
5. Click **"Assign"**

---

## 👤 Driver Experience

### Driver Login:
1. Driver goes to: `/driver/login`
2. Enters their email and password
3. Clicks **"Login"**

### Driver Dashboard Shows:
- **Today's Jobs** count
- **Upcoming Jobs** count
- **Total This Week** count
- Date filter to view different days
- List of assigned bookings with:
  - Service type
  - Time
  - Customer name and phone
  - Pickup location
  - Drop-off location
  - **Payment amount** (85% of customer price)
  - Number of passengers
  - Special notes

### What Drivers See (Example):
```
AIRPORT TRANSFER
Time: 10:00 AM
Passengers: 2
Customer: John Smith
Phone: +64 21 123 4567

PICKUP: Auckland Airport, Ray Emery Drive...
DROP-OFF: Queen Street, Auckland CBD...

Payment: $85.00
```

### What Drivers DON'T See:
- Original customer price ($100.00)
- The 15% commission
- Other drivers' schedules
- Admin functions
- Customer email addresses
- Booking IDs

---

## 🔧 Technical Details

### API Endpoints:
```
POST   /api/driver/login                - Driver authentication
GET    /api/drivers/{id}/bookings       - Get driver's assigned bookings (with reduced prices)
POST   /api/drivers/set-password        - Set driver password (admin only)
```

### Price Calculation:
- Backend automatically calculates: `driver_price = customer_price * 0.85`
- Full pricing details removed from response
- Only `driver_price` field is returned

### Database:
- Driver password stored as bcrypt hash
- Driver bookings linked via `driver_id` field
- No price duplication - calculated on-the-fly

---

## 📱 Access URLs

### Driver Login:
- **Local:** `http://localhost:3000/driver/login`
- **Production:** `https://your-domain.com/driver/login`

### Admin Panel (to manage drivers):
- **Local:** `http://localhost:3000/admin/login`
- **Production:** `https://your-domain.com/admin/login`

---

## 🎯 Use Cases

### Scenario 1: New Driver
1. Admin adds driver with email: `john@example.com`
2. Admin sets password: `SecurePass123`
3. Admin tells John: "Go to bookaride.co.nz/driver/login"
4. John logs in and sees his schedule
5. Admin assigns bookings to John
6. John sees today's jobs with payment amounts

### Scenario 2: Driver Views Schedule
1. Driver logs in
2. Sees 3 bookings for today
3. Each shows:
   - Time: 9:00 AM, 1:00 PM, 5:00 PM
   - Routes and customer info
   - Payments: $85.00, $102.00, $76.50
4. Driver doesn't know the original prices
5. Driver completes jobs based on this information

### Scenario 3: Commission Example
- **Booking 1:** Customer paid $100.00 → Driver sees $85.00
- **Booking 2:** Customer paid $120.00 → Driver sees $102.00  
- **Booking 3:** Customer paid $90.00 → Driver sees $76.50

**Your Commission:**
- Total collected: $310.00
- Drivers paid: $263.50
- Your commission: $46.50 (15%)

---

## 🔒 Security Features

1. **Separate Authentication:**
   - Drivers use different login endpoint
   - Cannot access admin panel
   - JWT tokens with "driver" type

2. **Data Privacy:**
   - Drivers only see their own bookings
   - Customer emails hidden
   - Original prices removed from response

3. **Password Security:**
   - Passwords hashed with bcrypt
   - Minimum 6 character requirement
   - Only admin can set/reset passwords

4. **Access Control:**
   - Inactive drivers cannot log in
   - Drivers without password cannot log in
   - Status checked on every login

---

## 🛠️ Admin Management

### Managing Driver Access:
1. **Activate/Deactivate:**
   - Edit driver → Change status to "Inactive"
   - Driver will be blocked from logging in

2. **Reset Password:**
   - Click Key icon on driver card
   - Enter new password
   - Driver uses new password next login

3. **Remove Driver:**
   - Click trash icon
   - Confirm deletion
   - Driver can no longer log in

### Viewing Driver Stats:
- See how many jobs assigned today
- View total assignments
- Check driver's schedule from admin panel

---

## 📊 Reports & Insights

### For You (Admin):
- Full booking prices visible in admin panel
- Track total revenue
- See commission amounts
- Export bookings with full prices to CSV

### For Drivers:
- Only see their assigned payment amounts
- Can view their weekly schedule
- Filter by date to see upcoming jobs

---

## ❓ FAQs

**Q: Can drivers see they're getting 85% of the price?**  
A: No. They only see one price labeled as "Payment" with no indication of any reduction.

**Q: Can drivers see other drivers' schedules?**  
A: No. Each driver only sees their own assigned bookings.

**Q: What if I want to change the commission percentage?**  
A: Edit line in `/app/backend/server.py`:  
Change `driver_price = customer_price * 0.85` to desired percentage.  
Example for 20%: `driver_price = customer_price * 0.80`

**Q: Can drivers access the admin panel?**  
A: No. Completely separate authentication and interface.

**Q: How do I give a driver a raise?**  
A: You would need to change the percentage globally, or create a custom rate per driver (requires code modification).

**Q: Can drivers edit bookings?**  
A: No. Driver portal is read-only. They can only view their assigned jobs.

---

## 🎉 Benefits

✅ **For You:**
- Automatically calculate and retain 15% commission
- No manual price adjustments needed
- Secure payment information
- Easy driver management

✅ **For Drivers:**
- Simple login to see their schedule
- Clear job information
- Easy-to-use mobile-friendly interface
- No confusion about payments

---

## 📞 Support

If you need to adjust:
- Commission percentage
- Add custom rates per driver
- Change the interface
- Add more features

Let me know and I can make those modifications!

---

**Last Updated:** December 5, 2024  
**Version:** 1.0
