import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Clock, Shield, Star, Phone, MapPin, ArrowRight, Users, Plane } from 'lucide-react';
import { Button } from '../../components/ui/button';

// Reusable SEO Landing Page Component for Auckland Suburbs
const SuburbAirportPage = ({ 
  suburb,
  suburbSlug,
  region = "Auckland",
  distanceToAirport = "25-35",
  driveTime = "30-45",
  nearbySuburbs = [],
  highlights = [],
  faqs = []
}) => {
  
  const defaultHighlights = [
    "Professional, reliable drivers",
    "Flight monitoring included",
    "Meet & greet service available",
    "Child seats on request",
    "24/7 booking availability"
  ];

  const defaultFaqs = [
    {
      q: `How much does an airport shuttle from ${suburb} cost?`,
      a: `We offer competitive minimum rates for ${suburb} to Auckland Airport transfers. Get an instant quote online - no hidden fees, just great value for a premium service.`
    },
    {
      q: `How early should I book my ${suburb} airport transfer?`,
      a: `We recommend booking at least 24 hours in advance to guarantee availability, especially during peak travel times. However, we do accommodate last-minute bookings when possible.`
    },
    {
      q: `Do you offer return transfers from Auckland Airport to ${suburb}?`,
      a: `Yes! Book a round trip and save. We monitor your return flight and adjust pickup times if there are delays - no stress, no extra charges.`
    },
    {
      q: `What's included in the ${suburb} airport shuttle service?`,
      a: `Door-to-door service, flight monitoring, meet & greet option, comfortable modern vehicles, and professional drivers who know ${region} inside out.`
    }
  ];

  const actualHighlights = highlights.length > 0 ? highlights : defaultHighlights;
  const actualFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  // Schema markup for SEO
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `BookaRide ${suburb} Airport Transfers`,
    "description": `Professional airport shuttle service from ${suburb} to Auckland Airport. Reliable, affordable, door-to-door transfers.`,
    "url": `https://bookaride.co.nz/airport-shuttle-${suburbSlug}`,
    "telephone": "+64 21 743 321",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": suburb,
      "addressRegion": "Auckland",
      "addressCountry": "NZ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "-36.8485",
      "longitude": "174.7633"
    },
    "areaServed": {
      "@type": "City",
      "name": suburb
    },
    "priceRange": "$$",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": actualFaqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <>
      <Helmet>
        <title>{suburb} Airport Shuttle | Auckland Airport Transfers | BookaRide</title>
        <meta name="description" content={`${suburb} to Auckland Airport shuttle service. Professional door-to-door transfers with flight monitoring. Great rates, reliable service. Book online now!`} />
        <meta name="keywords" content={`${suburb} airport shuttle, ${suburb} to Auckland Airport, airport transfer ${suburb}, ${suburb} taxi airport, Auckland Airport shuttle ${suburb}`} />
        <link rel="canonical" href={`https://bookaride.co.nz/airport-shuttle-${suburbSlug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${suburb} Airport Shuttle | BookaRide NZ`} />
        <meta property="og:description" content={`Professional airport transfers from ${suburb}. Door-to-door service, flight monitoring, great rates.`} />
        <meta property="og:url" content={`https://bookaride.co.nz/airport-shuttle-${suburbSlug}`} />
        <meta property="og:type" content="website" />
        
        {/* Schema */}
        <script type="application/ld+json">{JSON.stringify(schemaData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/airport-hero.jpg')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-28">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Plane className="w-4 h-4" />
                {suburb} Airport Transfers
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {suburb} to Auckland Airport
                <span className="text-gold"> Shuttle Service</span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Professional door-to-door airport transfers from {suburb}. 
                Great minimum rates, flight monitoring included, and drivers who know {region} like the back of their hand.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/book-now">
                  <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg w-full sm:w-auto">
                    Get Instant Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="tel:+64217433321">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto">
                    <Phone className="mr-2 w-5 h-5" />
                    Call Now
                  </Button>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>No Hidden Fees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  <span>5-Star Service</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Info Bar */}
        <section className="bg-gold text-black py-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-8 text-sm font-medium">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{distanceToAirport} km to Airport</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Approx. {driveTime} min drive</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Up to 11 Passengers</span>
              </div>
              <div className="flex items-center gap-2">
                <Plane className="w-4 h-4" />
                <span>Flight Monitoring Included</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 lg:py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why {suburb} Locals Choose BookaRide
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We're not just another shuttle service. We're your trusted airport transfer partner.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Always On Time</h3>
                <p className="text-gray-600">We monitor your flight and adjust for delays. No stress, no missed pickups.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Fixed Pricing</h3>
                <p className="text-gray-600">Great minimum rates with no surge pricing. What you're quoted is what you pay.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Expertise</h3>
                <p className="text-gray-600">Our drivers know {suburb} and all of {region}. The fastest routes, every time.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">All Group Sizes</h3>
                <p className="text-gray-600">From solo travelers to groups of 11. Sedans, SUVs, and vans available.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <Plane className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Door-to-Door</h3>
                <p className="text-gray-600">Picked up from your {suburb} address, dropped at the terminal door.</p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Easy Booking</h3>
                <p className="text-gray-600">Book online in 60 seconds. Instant confirmation, no waiting.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Highlights */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  {suburb} Airport Shuttle Service Includes
                </h2>
                <ul className="space-y-4">
                  {actualHighlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-lg text-gray-700">{highlight}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8">
                  <Link to="/book-now">
                    <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold">
                      Book Your {suburb} Transfer
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-slate-900 text-white p-8 rounded-2xl">
                <h3 className="text-2xl font-bold mb-6">Quick Facts</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-slate-700 pb-3">
                    <span className="text-gray-400">Distance to Airport</span>
                    <span className="font-semibold">{distanceToAirport} km</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-3">
                    <span className="text-gray-400">Travel Time</span>
                    <span className="font-semibold">{driveTime} minutes</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-3">
                    <span className="text-gray-400">Service</span>
                    <span className="font-semibold">24/7 Available</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-700 pb-3">
                    <span className="text-gray-400">Vehicles</span>
                    <span className="font-semibold">Sedan to 11-Seater</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pricing</span>
                    <span className="font-semibold text-gold">Great Minimum Rates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nearby Suburbs */}
        {nearbySuburbs.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                Also Serving Nearby Areas
              </h2>
              <div className="flex flex-wrap justify-center gap-4">
                {nearbySuburbs.map((nearby, idx) => (
                  <Link 
                    key={idx}
                    to={`/airport-shuttle-${nearby.slug}`}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-full hover:border-gold hover:shadow-md transition-all text-gray-700 hover:text-black"
                  >
                    {nearby.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
              {suburb} Airport Transfer FAQs
            </h2>
            
            <div className="space-y-6">
              {actualFaqs.map((faq, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-900 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Book Your {suburb} Airport Transfer?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Get an instant quote online or call us now. Great rates, professional service, no hassle.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Online Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+64217433321">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  <Phone className="mr-2 w-5 h-5" />
                  +64 21 743 321
                </Button>
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SuburbAirportPage;
