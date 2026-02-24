# BookaRide Deployment Checklist

## Before Deploying
- [x] Backend running and healthy
- [x] Frontend running
- [x] All recent changes tested in Preview
- [x] CORS configured for bookaride.co.nz

## How to Deploy
1. Click the **"Deploy"** button in Emergent
2. Click **"Deploy Now"**
3. Wait 10-15 minutes for deployment to complete
4. You'll see a success message when done

## After Deploying - IMPORTANT!

### 1. Update Twilio Webhook URL
Go to: https://console.twilio.com/
- Phone Numbers → Manage → Active Numbers
- Click on: +12058393708
- Under "Messaging" section, set:
  - **A MESSAGE COMES IN**: `https://bookaride.co.nz/api/webhook/twilio/sms`
  - Method: **POST**
- Click Save

### 2. Verify Everything Works
Open https://bookaride.co.nz and test:

- [ ] Homepage loads
- [ ] Book Now page shows pricing
- [ ] WELCOME10 promo code works
- [ ] Admin login works (admin / Kongkong2025!@)
- [ ] Can view bookings in admin
- [ ] Can assign driver to booking
- [ ] Driver receives SMS notification

### 3. Test Driver SMS Confirmation
1. Assign a test job to a driver
2. Have driver reply "YES" to the SMS
3. Check admin dashboard - booking should show "Confirmed"

## If Something Breaks
1. Don't panic!
2. Use **Rollback** feature in Emergent to go back to previous version
3. Check the logs in admin dashboard
4. Contact support if needed

## Key URLs
- Production: https://bookaride.co.nz
- Admin Panel: https://bookaride.co.nz/admin/login
- Twilio Console: https://console.twilio.com

## Recent Changes Included in This Deployment
1. Fixed driver payout calculation (return trips split correctly)
2. Fixed pay-on-pickup (no Stripe fees deducted for cash)
3. Added Stripe fees to customer total (drivers get full amount)
4. Added WELCOME10 promo code (10% off)
5. Prices increased 11% to offset promo discount
6. Fixed booking sort order (today's bookings first)
7. Fixed backend SyntaxError (emoji issue)
