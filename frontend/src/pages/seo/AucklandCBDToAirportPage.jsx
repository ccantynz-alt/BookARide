import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Star, CheckCircle, Plane, Building, ArrowRight, Car } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AucklandCBDToAirportPage = () => {
  const routeSchema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": "Auckland CBD to Airport Transfer",
    "description": "Door-to-door shuttle service from Auckland CBD to Auckland Airport. Fixed pricing from $55, 25-35 minute journey.",
    "touristType": "Business and leisure travelers",
    "itinerary": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "Place",
            "name": "Auckland CBD",
            "address": "Auckland CBD, Auckland, New Zealand"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "Place",
            "name": "Auckland Airport",
            "address": "Auckland Airport, Auckland, New Zealand"
          }
        }
      ]
    },
    "offers": {
      "@type": "Offer",
      "price": "55",
      "priceCurrency": "NZD",
      "availability": "https://schema.org/InStock"
    },
    "provider": {
      "@type": "LocalBusiness",
      "name": "Book A Ride NZ",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "2847"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How much is a shuttle from Auckland CBD to the airport?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A shuttle from Auckland CBD to Auckland Airport costs from $55 with Book A Ride. This is a fixed price with no surge charges or hidden fees. The exact price depends on your specific pickup address in the CBD."
        }
      },
      {
        "@type": "Question",
        "name": "How long does it take to get from Auckland CBD to the airport?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The journey from Auckland CBD to Auckland Airport typically takes 25-35 minutes in normal traffic. During peak hours (7-9am, 4-6pm) it can take 40-50 minutes. We always factor in traffic when scheduling your pickup."
        }
      },
      {
        "@type": "Question",
        "name": "What time should I leave the CBD for my flight?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We recommend leaving Auckland CBD at least 2.5 hours before domestic flights and 3.5 hours before international flights. This accounts for travel time, check-in, and security. For early morning flights, traffic is lighter so 2 hours before domestic is usually sufficient."
        }
      },
      {
        "@type": "Question",
        "name": "Do you pick up from CBD hotels?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We pick up from all Auckland CBD hotels including SkyCity, Sofitel, Hilton, QT Auckland, Hotel DeBrett, M Social, and more. Your driver will meet you in the hotel lobby or at a convenient pickup point."
        }
      },
      {
        "@type": "Question",
        "name": "Is the CBD to airport shuttle available 24/7?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, our Auckland CBD to airport shuttle service operates 24 hours a day, 7 days a week. Whether you have a 5am departure or a midnight arrival, we'll be there."
        }
      }
    ]
  };

  const cbdAreas = [
    { name: 'Queen Street', time: '25 min', price: '$55' },
    { name: 'Britomart', time: '28 min', price: '$55' },
    { name: 'Viaduct Harbour', time: '30 min', price: '$58' },
    { name: 'Ponsonby', time: '30 min', price: '$60' },
    { name: 'Parnell', time: '28 min', price: '$58' },
    { name: 'Newmarket', time: '25 min', price: '$52' }
  ];

  const hotels = [
    'SkyCity Grand Hotel', 'SkyCity Hotel', 'Sofitel Auckland Viaduct Harbour',
    'Hilton Auckland', 'QT Auckland', 'Hotel DeBrett', 'M Social Auckland',
    'Cordis Auckland', 'Pullman Auckland', 'SO/ Auckland'
  ];

  return (
    <>
      <Helmet>
        <title>Auckland CBD to Airport Shuttle | From $55 | 25-35 mins | Book A Ride</title>
        <meta name="description" content="Auckland CBD to Airport shuttle from $55. Fixed pricing, 25-35 min journey, door-to-door service. Pickup from all CBD hotels. 24/7 availability. Book online now!" />
        <meta name="keywords" content="auckland cbd to airport, cbd to airport shuttle, auckland city to airport, queen street to airport, britomart to airport, cbd airport transfer, auckland cbd airport shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/auckland-cbd-to-airport" />
        
        <meta property="og:title" content="Auckland CBD to Airport Shuttle | From $55" />
        <meta property="og:description" content="CBD to Airport shuttle from $55. Fixed pricing, 25-35 mins, pickup from all hotels." />
        <meta property="og:url" content="https://bookaride.co.nz/auckland-cbd-to-airport" />
        
        <script type="application/ld+json">{JSON.stringify(routeSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Building className="w-4 h-4" />
                  <span>Auckland CBD</span>
                </div>
                <ArrowRight className="w-5 h-5" />
                <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                  <Plane className="w-4 h-4" />
                  <span>Airport</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Auckland CBD to Airport
              </h1>
              
              <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
                Fast, reliable airport shuttle from Auckland CBD. Fixed pricing from $55, 
                door-to-door service from your hotel or office.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="text-center">
                  <p className="text-3xl font-bold">$55</p>
                  <p className="text-blue-200 text-sm">From</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">25-35</p>
                  <p className="text-blue-200 text-sm">Minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">24/7</p>
                  <p className="text-blue-200 text-sm">Available</p>
                </div>
              </div>
              
              <Link to="/book">
                <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg">
                  Book CBD to Airport Shuttle
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CBD Areas */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">CBD Pickup Locations</h2>
            <p className="text-center text-gray-600 mb-12">We pick up from anywhere in Auckland CBD</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {cbdAreas.map((area, index) => (
                <div key={index} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-lg">{area.name}</h3>
                      <p className="text-gray-500">{area.time} to airport</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{area.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hotels */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">CBD Hotel Pickups</h2>
            <p className="text-center text-gray-600 mb-8">We pick up from all Auckland CBD hotels</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {hotels.map((hotel, index) => (
                <span key={index} className="bg-white px-4 py-2 rounded-full border text-sm">
                  {hotel}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Route Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose prose-lg">
              <h2>Auckland CBD to Airport: Everything You Need to Know</h2>
              <p>
                Getting from <strong>Auckland CBD to the airport</strong> is easy with Book A Ride. 
                Our shuttle service provides door-to-door transfers from anywhere in the central city 
                to Auckland Airport, with fixed pricing and no surprises.
              </p>
              
              <h3>The Route</h3>
              <p>
                The journey from Auckland CBD to Auckland Airport covers approximately 21 kilometers. 
                The most common route takes you through the city via the Southern Motorway (SH1) to 
                the airport. In normal traffic, this takes 25-35 minutes.
              </p>
              
              <h3>Traffic Considerations</h3>
              <p>
                Auckland CBD traffic can be heavy during peak hours. Morning rush (7-9am) and evening 
                rush (4-6pm) can add 15-20 minutes to your journey. Our drivers monitor traffic in 
                real-time and always leave buffer time to ensure you reach your flight.
              </p>
              
              <h3>Why Choose Our CBD to Airport Shuttle?</h3>
              <ul>
                <li><strong>Fixed pricing</strong> - Know exactly what you'll pay before booking</li>
                <li><strong>Door-to-door service</strong> - Picked up from your exact address</li>
                <li><strong>Professional drivers</strong> - Local experts who know the fastest routes</li>
                <li><strong>24/7 availability</strong> - Early morning or late night, we're there</li>
                <li><strong>Flight monitoring</strong> - We track your return flight for pickups</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Auckland CBD to Airport FAQs</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="bg-white border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-3">{faq.name}</h3>
                  <p className="text-gray-600">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-blue-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Book Your CBD to Airport Shuttle</h2>
            <p className="text-blue-200 mb-8">Fixed price from $55. Book online in 60 seconds.</p>
            <Link to="/book">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg">
                Book Now - From $55
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default AucklandCBDToAirportPage;
