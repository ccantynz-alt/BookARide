// Facebook Content Calendar and Templates for BookaRide

export const facebookPosts = {
  // Testimonial Posts
  testimonials: [
    {
      type: 'testimonial',
      template: `⭐⭐⭐⭐⭐ CUSTOMER REVIEW ⭐⭐⭐⭐⭐

"{REVIEW_TEXT}"

- {CUSTOMER_NAME}, {LOCATION}

🚐 Thank you for choosing BookaRide!

Book your airport transfer: bookaride.co.nz
📞 021 743 321

#AucklandAirport #AirportShuttle #CustomerReview #BookaRide`,
      tips: 'Use real reviews. Ask permission to use customer names. Add a photo of the happy customer if available.'
    }
  ],

  // Promotional Posts
  promotional: [
    {
      type: 'promo',
      template: `🎉 SPECIAL OFFER! 🎉

{OFFER_DETAILS}

✈️ Auckland Airport Transfers
🚐 Private door-to-door service
👨‍👩‍👧‍👦 Perfect for families & groups

Book now: bookaride.co.nz
📞 021 743 321

#Auckland #AirportTransfer #SpecialOffer #BookaRide`,
      tips: 'Use sparingly. Best for holidays, school holidays, or special events.'
    },
    {
      type: 'earlybird',
      template: `🌅 EARLY BIRD? WE'VE GOT YOU COVERED!

Got a 5am flight? No worries!

✅ We pick up as early as 3am
✅ Flight tracking included
✅ Door-to-door service
✅ No surge pricing ever

While Uber drivers are sleeping, we're getting you to your flight on time! ✈️

Book your early morning transfer: bookaride.co.nz

#EarlyFlight #AucklandAirport #AirportShuttle`,
      tips: 'Great for targeting business travelers and holiday-goers.'
    }
  ],

  // Educational/Value Posts
  educational: [
    {
      type: 'tip',
      template: `💡 TRAVEL TIP: {TIP_TITLE}

{TIP_CONTENT}

Need a reliable airport transfer?
👉 bookaride.co.nz

#TravelTip #Auckland #AirportTravel`,
      tips: 'Provide genuine value. Topics: packing tips, airport navigation, NZ travel advice.'
    },
    {
      type: 'comparison',
      template: `🤔 SHUTTLE vs UBER vs TAXI - Which is best for Auckland Airport?

🚐 SHUTTLE
✅ Fixed price
✅ Pre-booked guarantee  
✅ Flight tracking

📱 UBER
⚠️ Surge pricing
⚠️ Limited early morning
✅ On-demand

🚕 TAXI
⚠️ Metered (varies with traffic)
✅ No booking needed
⚠️ Queue wait time

Our verdict? For airport transfers, you can't beat a pre-booked shuttle.

👉 bookaride.co.nz

#AucklandAirport #TravelTips #AirportTransfer`,
      tips: 'Be honest and fair. Builds trust by acknowledging competitor strengths.'
    }
  ],

  // Local/Community Posts
  local: [
    {
      type: 'location',
      template: `📍 SERVICING {LOCATION}!

Did you know we offer door-to-door airport transfers from {LOCATION}?

🚐 Private shuttle (no sharing!)
💰 From ${PRICE}
⏱️ {DURATION} to Auckland Airport
✈️ Flight tracking included

Book online: bookaride.co.nz/book

#{LOCATION_HASHTAG} #AucklandAirport #AirportShuttle`,
      tips: 'Rotate through different suburbs. Great for local reach.'
    },
    {
      type: 'event',
      template: `🎪 {EVENT_NAME} THIS WEEKEND!

Heading to {EVENT_NAME}? Skip the parking hassle!

🚐 Door-to-door transfers available
👨‍👩‍👧‍👦 Groups welcome
💰 Fixed pricing

Book your ride: bookaride.co.nz

#{EVENT_HASHTAG} #Auckland #Transport`,
      tips: 'Tie into local events, concerts, sports games.'
    }
  ],

  // Seasonal Posts
  seasonal: [
    {
      type: 'holiday',
      template: `🎄 HOLIDAY TRAVEL SORTED!

Travelling for Christmas/New Year?

✅ Book your airport transfer now
✅ Avoid the rush
✅ Guaranteed pickup
✅ No surge pricing

🎁 Gift idea: Book a transfer for someone!

bookaride.co.nz

#ChristmasTravel #NewZealand #AucklandAirport #HolidaySeason`,
      tips: 'Post 2-3 weeks before major holidays.'
    },
    {
      type: 'cruise',
      template: `🚢 CRUISE SEASON IS HERE!

Arriving or departing on a cruise ship?

We offer transfers to/from:
📍 Queens Wharf cruise terminal
📍 Auckland Airport
📍 Hotels & attractions

🚐 Private transfers for your group
👜 Plenty of luggage space

Book: bookaride.co.nz/cruise-transfers

#CruiseShip #Auckland #ShoreExcursion #CruiseTransfer`,
      tips: 'Post during cruise season (Oct-Apr). Tag cruise lines if appropriate.'
    }
  ]
};

// Weekly Content Calendar Template
export const weeklyCalendar = {
  monday: {
    type: 'educational',
    theme: 'Travel Tip Monday',
    example: 'Share a useful travel tip'
  },
  tuesday: {
    type: 'testimonial', 
    theme: 'Testimonial Tuesday',
    example: 'Share a customer review'
  },
  wednesday: {
    type: 'local',
    theme: 'Where We Go Wednesday', 
    example: 'Feature a suburb or route'
  },
  thursday: {
    type: 'promotional',
    theme: 'Throwback Thursday OR Promo',
    example: 'Share a deal or company story'
  },
  friday: {
    type: 'fun',
    theme: 'Friday Feels',
    example: 'Behind the scenes, team photo, weekend vibes'
  },
  saturday: {
    type: 'seasonal',
    theme: 'Weekend Ready',
    example: 'Event tie-ins, weekend travel content'
  },
  sunday: {
    type: 'rest',
    theme: 'Optional/Light',
    example: 'Scenic NZ photo, inspirational travel quote'
  }
};

// Facebook Ad Copy Templates
export const adTemplates = {
  awareness: {
    headline: 'Auckland Airport Transfers Made Easy',
    primaryText: `Skip the taxi queue. Forget surge pricing.

BookaRide offers private door-to-door airport transfers from just $55.

✅ Fixed prices (no surprises)
✅ Flight tracking included
✅ Child seats available

Book online in 2 minutes.`,
    callToAction: 'Book Now',
    targetAudience: 'Auckland residents, 25-65, interested in travel'
  },
  retargeting: {
    headline: 'Still Need an Airport Transfer?',
    primaryText: `We noticed you were looking for an airport shuttle.

Book with BookaRide and get:
🚐 Private transfer (no sharing)
✈️ We track your flight
💰 Fixed price from $55

Don't leave it to chance - book now!`,
    callToAction: 'Book Now',
    targetAudience: 'Website visitors who didn\'t complete booking'
  },
  tourist: {
    headline: 'Visiting Auckland? Airport Transfer Sorted!',
    primaryText: `Welcome to New Zealand! 🇳🇿

Make your first (or last) impression of Auckland a good one with a comfortable airport transfer.

🚐 Private door-to-door service
🗣️ Friendly local drivers
💰 Fixed pricing in NZD

Book before you fly!`,
    callToAction: 'Get Quote',
    targetAudience: 'People travelling TO Auckland, located in AU/US/UK/Asia'
  },
  family: {
    headline: 'Family Airport Transfers with Child Seats',
    primaryText: `Travelling with kids? We make it easy.

👶 Free child seats (just request when booking)
🚐 Spacious vehicles for prams & luggage
⏰ We track your flight - no stress if delayed

Door-to-door service to any Auckland address.`,
    callToAction: 'Book Now',
    targetAudience: 'Parents 25-45, family travel interests'
  }
};

export default { facebookPosts, weeklyCalendar, adTemplates };