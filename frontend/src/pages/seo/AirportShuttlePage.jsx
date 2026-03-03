import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Link } from 'react-router-dom';
import { Plane, Clock, DollarSign, Shield, Star, Users, MapPin, Phone, CheckCircle, ArrowRight, Car, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AirportShuttlePage = () => {
  // Comprehensive Schema Markup for "airport shuttle"
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://bookaride.co.nz/#organization",
    "name": "Book A Ride NZ - Airport Shuttle Service",
    "alternateName": ["BookARide", "Book A Ride Auckland", "Auckland Airport Shuttle"],
    "description": "Auckland's #1 rated airport shuttle service. Professional door-to-door transfers to Auckland Airport with fixed pricing, 24/7 availability, and real-time tracking.",
    "url": "https://bookaride.co.nz",
    "telephone": "+64-27-XXX-XXXX",
    "email": "bookings@bookaride.co.nz",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Auckland",
      "addressRegion": "Auckland",
      "addressCountry": "NZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-36.8485",
      "longitude": "174.7633"
    },
    "areaServed": [
      { "@type": "City", "name": "Auckland" },
      { "@type": "Place", "name": "North Shore" },
      { "@type": "Place", "name": "Hibiscus Coast" },
      { "@type": "Place", "name": "Auckland CBD" }
    ],
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2847",
      "bestRating": "5"
    },
    "sameAs": [
      "https://www.facebook.com/bookaridenz",
      "https://www.instagram.com/bookaridenz"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Airport Shuttle",
    "name": "Auckland Airport Shuttle Service",
    "description": "Professional airport shuttle service in Auckland. Door-to-door transfers, fixed pricing, 24/7 availability.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Book A Ride NZ"
    },
    "areaServed": {
      "@type": "City",
      "name": "Auckland",
      "containedIn": "New Zealand"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Airport Shuttle Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Private Airport Transfer"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Shared Airport Shuttle"
          }
        }
      ]
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is an airport shuttle?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An airport shuttle is a transportation service that takes passengers between their home, hotel, or business and the airport. Book A Ride offers both private airport shuttles (dedicated vehicle for your group) and shared airport shuttles (cost-effective option where you share with other passengers going the same direction)."
        }
      },
      {
        "@type": "Question",
        "name": "How much does an airport shuttle cost in Auckland?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Auckland airport shuttle prices vary by distance. With Book A Ride, prices start from $35 for nearby suburbs. We offer fixed, transparent pricing with no surge charges or hidden fees. Get an instant quote on our website."
        }
      },
      {
        "@type": "Question",
        "name": "How do I book an airport shuttle?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Booking an airport shuttle with Book A Ride is easy: 1) Enter your pickup address and destination, 2) Select your date and time, 3) Choose the number of passengers, 4) Pay securely online. You'll receive instant confirmation and your driver's details before pickup."
        }
      },
      {
        "@type": "Question",
        "name": "Are airport shuttles reliable?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Book A Ride airport shuttles have a 99.8% on-time record. We monitor all flights for delays and adjust pickup times accordingly. Our professional drivers know the fastest routes and ensure you arrive at the airport with plenty of time."
        }
      },
      {
        "@type": "Question",
        "name": "What's the difference between an airport shuttle and a taxi?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Airport shuttles like Book A Ride offer fixed, pre-booked pricing with no meters or surge charges. You know exactly what you'll pay before booking. Taxis use meters and can have variable pricing. Shuttles also typically offer larger vehicles suitable for families and groups with luggage."
        }
      }
    ]
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bookaride.co.nz" },
      { "@type": "ListItem", "position": 2, "name": "Airport Shuttle", "item": "https://bookaride.co.nz/airport-shuttle" }
    ]
  };

  const features = [
    { icon: Clock, title: '24/7 Service', desc: 'Airport shuttles available any time, day or night' },
    { icon: DollarSign, title: 'Fixed Pricing', desc: 'No surge charges, no hidden fees' },
    { icon: Shield, title: 'Flight Monitoring', desc: 'We track your flight and adjust for delays' },
    { icon: Star, title: '4.9★ Rated', desc: 'Over 2,800+ five-star reviews' },
    { icon: Users, title: 'All Group Sizes', desc: 'From solo travelers to groups of 11' },
    { icon: MapPin, title: 'Door-to-Door', desc: 'Picked up and dropped off at your exact address' }
  ];

  const popularRoutes = [
    { from: 'Auckland CBD', price: 'From $55', time: '25-35 min', link: '/auckland-cbd-to-airport' },
    { from: 'North Shore', price: 'From $65', time: '35-45 min', link: '/auckland-airport-to-north-shore' },
    { from: 'Hibiscus Coast', price: 'From $95', time: '45-55 min', link: '/auckland-airport-to-hibiscus-coast' },
    { from: 'Orewa', price: 'From $99', time: '50-60 min', link: '/orewa-to-auckland-airport' },
    { from: 'Whangaparaoa', price: 'From $105', time: '55-65 min', link: '/whangaparaoa-airport-transfer' },
    { from: 'Takapuna', price: 'From $70', time: '35-45 min', link: '/auckland-airport-to-takapuna' }
  ];

  return (
    <>
      <Helmet>
        <title>Airport Shuttle Auckland | #1 Rated Service | Book A Ride NZ</title>
        <meta name="description" content="Auckland's best airport shuttle service. Door-to-door transfers, fixed pricing from $35, 24/7 availability, flight tracking. 4.9★ rated with 2800+ reviews. Book online now!" />
        <meta name="keywords" content="airport shuttle, airport shuttle auckland, auckland airport shuttle, airport transfer, airport taxi, shuttle to airport, airport pickup, airport dropoff, book airport shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/airport-shuttle" />
        
        <meta property="og:title" content="Airport Shuttle Auckland | #1 Rated Service | Book A Ride" />
        <meta property="og:description" content="Auckland's best airport shuttle. Fixed pricing, 24/7 service, flight tracking. Book your airport transfer online!" />
        <meta property="og:url" content="https://bookaride.co.nz/airport-shuttle" />
        <meta property="og:type" content="website" />
        
        <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">Auckland's #1 Rated Airport Shuttle</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Airport Shuttle
                <span className="text-yellow-500"> Auckland</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Professional door-to-door airport shuttle service. Fixed pricing, 24/7 availability, 
                flight tracking, and a 4.9★ rating from 2,800+ happy customers.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/book">
                  <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg">
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Airport Shuttle
                  </Button>
                </Link>
                <Link to="/book">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                    Get Instant Quote
                  </Button>
                </Link>
              </div>
              
              <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> No surge pricing</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Free cancellation</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Instant confirmation</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Airport Shuttle?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <feature.icon className="w-10 h-10 text-yellow-500 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Routes */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Popular Airport Shuttle Routes</h2>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Fixed prices for the most popular airport shuttle routes in Auckland. All prices include GST.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {popularRoutes.map((route, index) => (
                <Link key={index} to={route.link} className="block bg-white border rounded-xl p-6 hover:shadow-lg transition-all hover:border-yellow-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-gray-500 text-sm">From</p>
                      <h3 className="font-bold text-lg">{route.from}</h3>
                    </div>
                    <Plane className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{route.price}</p>
                      <p className="text-sm text-gray-500">{route.time}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* What is Airport Shuttle Section - SEO Content */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto prose prose-lg">
              <h2 className="text-3xl font-bold mb-6">What is an Airport Shuttle?</h2>
              <p>
                An <strong>airport shuttle</strong> is a transportation service designed specifically for taking passengers 
                to and from airports. Unlike regular taxis or rideshare services, airport shuttles specialize in airport 
                transfers and understand the unique requirements of air travel.
              </p>
              <p>
                Book A Ride offers Auckland's premier <strong>airport shuttle service</strong>, providing both private and 
                shared shuttle options to suit every budget and group size. Our airport shuttles operate 24/7, ensuring 
                you can catch even the earliest morning or latest night flights.
              </p>
              
              <h3 className="text-2xl font-bold mt-8 mb-4">Types of Airport Shuttle Services</h3>
              <ul>
                <li><strong>Private Airport Shuttle:</strong> A dedicated vehicle for you and your group. Direct route with no other stops.</li>
                <li><strong>Shared Airport Shuttle:</strong> Share the ride with other passengers heading the same direction. More affordable option.</li>
                <li><strong>Door-to-Door Shuttle:</strong> Picked up and dropped off at your exact address - no walking to bus stops or stations.</li>
              </ul>
              
              <h3 className="text-2xl font-bold mt-8 mb-4">Airport Shuttle vs Other Transport Options</h3>
              <p>
                Compared to taxis, Uber, or public transport, an <strong>airport shuttle</strong> offers several advantages:
              </p>
              <ul>
                <li><strong>Fixed Pricing:</strong> Know exactly what you'll pay before booking - no meter anxiety or surge pricing</li>
                <li><strong>Flight Tracking:</strong> We monitor your flight and adjust pickup time for delays - no waiting charges</li>
                <li><strong>Luggage Space:</strong> Vehicles designed for travelers with plenty of room for bags</li>
                <li><strong>Meet & Greet:</strong> Driver waiting for you at arrivals with your name sign</li>
                <li><strong>Child Seats:</strong> Available on request at no extra charge</li>
              </ul>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Airport Shuttle FAQs</h2>
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

        {/* CTA Section */}
        <section className="py-16 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Book Your Airport Shuttle?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Book A Ride for their airport transfers.
            </p>
            <Link to="/book">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg">
                Book Your Airport Shuttle Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default AirportShuttlePage;
