import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Link } from 'react-router-dom';
import { Plane, Clock, DollarSign, Shield, Star, Users, MapPin, CheckCircle, ArrowRight, Car, Briefcase, Baby, Luggage, Wifi } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AirportShuttleServicePage = () => {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Airport Shuttle Service",
    "name": "Book A Ride Airport Shuttle Service",
    "description": "Professional airport shuttle service in Auckland, New Zealand. Door-to-door transfers with fixed pricing, 24/7 availability, flight monitoring, and professional drivers.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Book A Ride NZ",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Auckland",
        "addressCountry": "NZ"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "2847"
      }
    },
    "areaServed": {
      "@type": "City",
      "name": "Auckland"
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": "https://bookaride.co.nz/book",
      "availableLanguage": ["English", "Chinese", "Korean", "Japanese"]
    },
    "termsOfService": "https://bookaride.co.nz/terms",
    "offers": {
      "@type": "Offer",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "NZD",
        "price": "35",
        "description": "Starting price for airport shuttle service"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What makes a good airport shuttle service?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A quality airport shuttle service offers: reliability (on-time pickups), professional drivers, clean vehicles, fixed transparent pricing, flight monitoring for delays, easy online booking, and excellent customer service. Book A Ride delivers on all these points with our 4.9-star rating."
        }
      },
      {
        "@type": "Question",
        "name": "How early should I book an airport shuttle service?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We recommend booking your airport shuttle service at least 24 hours in advance, especially for early morning flights. However, Book A Ride accepts bookings up to 2 hours before pickup for last-minute travel needs, subject to availability."
        }
      },
      {
        "@type": "Question",
        "name": "Does the airport shuttle service include meet and greet?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Our airport shuttle service includes complimentary meet and greet for all airport pickups. Your driver will be waiting in the arrivals area holding a sign with your name, ready to help with your luggage."
        }
      },
      {
        "@type": "Question",
        "name": "Can I book airport shuttle service for a group?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! Our airport shuttle service accommodates groups of all sizes. We have sedans for 1-3 passengers, SUVs for 4-6 passengers, and vans for up to 11 passengers. All vehicles have ample luggage space."
        }
      },
      {
        "@type": "Question",
        "name": "What happens if my flight is delayed?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our airport shuttle service includes free flight monitoring. We automatically track your flight and adjust your pickup time if there's a delay - no need to call us. There are no extra charges for flight delays."
        }
      }
    ]
  };

  const serviceFeatures = [
    { icon: Clock, title: '24/7 Availability', desc: 'Airport shuttle service available around the clock for all flight times' },
    { icon: DollarSign, title: 'Fixed Pricing', desc: 'Transparent pricing with no surge charges or hidden fees' },
    { icon: Shield, title: 'Flight Monitoring', desc: 'We track your flight and adjust for any delays automatically' },
    { icon: Star, title: 'Professional Drivers', desc: 'Vetted, experienced drivers with local knowledge' },
    { icon: Luggage, title: 'Luggage Assistance', desc: 'Help with your bags from door to door' },
    { icon: Baby, title: 'Child Seats', desc: 'Free child and booster seats available on request' },
    { icon: Wifi, title: 'Comfortable Vehicles', desc: 'Clean, modern vehicles with air conditioning' },
    { icon: MapPin, title: 'Door-to-Door', desc: 'Pickup and dropoff at your exact address' }
  ];

  const serviceAreas = [
    'Auckland CBD', 'North Shore', 'Hibiscus Coast', 'Orewa', 'Whangaparaoa', 
    'Albany', 'Takapuna', 'Devonport', 'East Auckland', 'South Auckland', 
    'West Auckland', 'Manukau', 'Papakura', 'Botany'
  ];

  return (
    <>
      <Helmet>
        <title>Airport Shuttle Service Auckland | Professional Transfers | Book A Ride</title>
        <meta name="description" content="Auckland's premier airport shuttle service. Professional drivers, fixed pricing from $35, 24/7 availability, flight monitoring, meet & greet. 4.9★ rated. Book online now!" />
        <meta name="keywords" content="airport shuttle service, airport shuttle service auckland, airport transfer service, professional airport shuttle, auckland airport transfer service, reliable airport shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/airport-shuttle-service" />
        
        <meta property="og:title" content="Airport Shuttle Service Auckland | Professional Transfers" />
        <meta property="og:description" content="Auckland's premier airport shuttle service. Professional drivers, fixed pricing, 24/7 availability. Book now!" />
        <meta property="og:url" content="https://bookaride.co.nz/airport-shuttle-service" />
        
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-yellow-500 via-yellow-600 to-orange-500 text-black py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-black/10 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">4.9★ Rated Airport Shuttle Service</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Airport Shuttle Service
              </h1>
              
              <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
                Auckland's most trusted airport shuttle service. Professional drivers, fixed pricing, 
                and a commitment to getting you to your flight on time, every time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/book">
                  <Button size="lg" className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-6 text-lg">
                    Book Shuttle Service
                  </Button>
                </Link>
                <a href="tel:+6427XXXXXXX">
                  <Button size="lg" variant="outline" className="border-black text-black hover:bg-black/10 px-8 py-6 text-lg">
                    Call Now
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Service Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Our Airport Shuttle Service Includes</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Everything you need for a stress-free airport transfer experience
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {serviceFeatures.map((feature, index) => (
                <div key={index} className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Airport Shuttle Service Areas</h2>
            <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
              Our airport shuttle service covers all Auckland suburbs and beyond
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {serviceAreas.map((area, index) => (
                <span key={index} className="bg-white px-4 py-2 rounded-full border shadow-sm hover:shadow-md transition-shadow">
                  {area}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Why Our Service */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">What Makes Our Airport Shuttle Service Different?</h2>
              <div className="prose prose-lg mx-auto">
                <p>
                  At Book A Ride, our <strong>airport shuttle service</strong> is built on one principle: 
                  making airport transfers as stress-free as possible. We understand that getting to the airport 
                  on time is crucial, which is why we've designed every aspect of our service around reliability.
                </p>
                <p>
                  Unlike other transport options, our airport shuttle service offers <strong>fixed pricing</strong> - 
                  you know exactly what you'll pay before you book. No surge pricing during peak hours, no meter 
                  anxiety, no surprises. Just honest, transparent pricing.
                </p>
                <p>
                  Our <strong>professional drivers</strong> are more than just drivers - they're local experts 
                  who know the fastest routes, understand Auckland traffic patterns, and are trained to provide 
                  exceptional customer service. Every driver is vetted, licensed, and committed to your safety.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Airport Shuttle Service FAQs</h2>
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
        <section className="py-16 bg-gradient-to-r from-yellow-500 to-orange-500 text-black">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Book Our Airport Shuttle Service Today</h2>
            <p className="mb-8 max-w-2xl mx-auto opacity-90">
              Experience Auckland's best airport shuttle service. Fixed prices, professional drivers, 24/7 availability.
            </p>
            <Link to="/book">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white font-bold px-8 py-6 text-lg">
                Book Airport Shuttle Service
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default AirportShuttleServicePage;
