import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { 
  Plane, Clock, MapPin, Users, Shield, Star, CheckCircle, 
  Phone, Car, Globe, CreditCard, Calendar, ArrowRight 
} from 'lucide-react';

const AucklandAirportShuttle = () => {
  const features = [
    { icon: Clock, title: '24/7 Service', desc: 'Available every flight, every day' },
    { icon: Shield, title: 'Licensed & Insured', desc: 'Fully licensed NZ transport' },
    { icon: Users, title: 'All Group Sizes', desc: 'From solo travelers to large groups' },
    { icon: CreditCard, title: 'Fixed Pricing', desc: 'No surge pricing or hidden fees' },
    { icon: Car, title: 'Modern Fleet', desc: 'Comfortable, air-conditioned vehicles' },
    { icon: Globe, title: 'Multilingual', desc: 'Service in multiple languages' }
  ];

  const serviceAreas = [
    { name: 'Auckland CBD', time: '25-30 min', price: 'Get Instant Quote' },
    { name: 'North Shore', time: '35-45 min', price: 'Get Instant Quote' },
    { name: 'South Auckland', time: '15-20 min', price: 'Get Instant Quote' },
    { name: 'West Auckland', time: '30-40 min', price: 'Get Instant Quote' },
    { name: 'East Auckland', time: '25-35 min', price: 'Get Instant Quote' },
    { name: 'Hibiscus Coast', time: '50-60 min', price: 'Get Instant Quote' }
  ];

  const faqs = [
    {
      q: 'How do I book an Auckland Airport shuttle?',
      a: 'You can book online through our website 24/7, or call us directly. We recommend booking at least 24 hours in advance for guaranteed availability.'
    },
    {
      q: 'How much does an Auckland Airport shuttle cost?',
      a: 'Prices start from $65 for South Auckland and vary based on distance. We offer fixed pricing with no hidden fees or surge pricing.'
    },
    {
      q: 'Do you offer private airport transfers?',
      a: 'Yes! We offer both shared shuttles and private transfers. Private transfers give you a dedicated vehicle with no other stops.'
    },
    {
      q: 'What if my flight is delayed?',
      a: 'We monitor all flights in real-time and adjust pickup times automatically. There\'s no extra charge for flight delays.'
    },
    {
      q: 'Can you accommodate large groups?',
      a: 'Absolutely! We have vehicles for all group sizes, from solo travelers to groups of 11+. Contact us for group bookings.'
    },
    {
      q: 'Do you provide child seats?',
      a: 'Yes, we provide child seats and booster seats free of charge. Please request them when booking.'
    }
  ];

  // FAQ Schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': faq.a
      }
    }))
  };

  // Local Business Schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    'name': 'BookaRide NZ - Auckland Airport Shuttle',
    'description': 'Auckland\'s premier airport shuttle service. Door-to-door transfers to and from Auckland Airport. Available 24/7.',
    'url': 'https://bookaride.co.nz/auckland-airport-shuttle',
    'telephone': '+64 21 743 321',
    'email': 'bookings@bookaride.co.nz',
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': 'Auckland',
      'addressRegion': 'Auckland',
      'addressCountry': 'NZ'
    },
    'geo': {
      '@type': 'GeoCoordinates',
      'latitude': -36.8509,
      'longitude': 174.7645
    },
    'areaServed': [
      { '@type': 'City', 'name': 'Auckland' },
      { '@type': 'City', 'name': 'North Shore' },
      { '@type': 'City', 'name': 'Manukau' },
      { '@type': 'City', 'name': 'Waitakere' }
    ],
    'priceRange': '$65-$200',
    'openingHoursSpecification': {
      '@type': 'OpeningHoursSpecification',
      'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      'opens': '00:00',
      'closes': '23:59'
    },
    'aggregateRating': {
      '@type': 'AggregateRating',
      'ratingValue': '4.9',
      'reviewCount': '2500'
    }
  };

  // Service Schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Airport Shuttle Service',
    'provider': {
      '@type': 'LocalBusiness',
      'name': 'BookaRide NZ'
    },
    'areaServed': {
      '@type': 'City',
      'name': 'Auckland'
    },
    'hasOfferCatalog': {
      '@type': 'OfferCatalog',
      'name': 'Auckland Airport Shuttle Services',
      'itemListElement': [
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Private Airport Transfer'
          }
        },
        {
          '@type': 'Offer',
          'itemOffered': {
            '@type': 'Service',
            'name': 'Shared Airport Shuttle'
          }
        }
      ]
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Auckland Airport Shuttle | Book Online | Door-to-Door Transfers | BookaRide</title>
        <meta name="description" content="Auckland's #1 airport shuttle service. Door-to-door transfers to/from Auckland Airport. Fixed pricing, 24/7 service, professional drivers. Book online now!" />
        <meta name="keywords" content="auckland airport shuttle, auckland airport transfer, auckland airport taxi, airport shuttle auckland, auckland airport to city, book auckland airport shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/auckland-airport-shuttle" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Auckland Airport Shuttle | Book Online | BookaRide" />
        <meta property="og:description" content="Auckland's premier airport shuttle. Door-to-door service, fixed pricing, 24/7 availability. Book your Auckland Airport transfer now!" />
        <meta property="og:url" content="https://bookaride.co.nz/auckland-airport-shuttle" />
        <meta property="og:type" content="website" />
        
        {/* Schema Markup */}
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(localBusinessSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-gray-900/80 to-black/90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2 fill-gold" />
              Auckland's #1 Rated Airport Shuttle Service
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Auckland Airport <span className="text-gold">Shuttle</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Door-to-door airport transfers across Auckland. Fixed pricing, professional drivers, 
              available 24/7. The smarter way to get to Auckland Airport.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-bold px-8 py-6 text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Now
                </Button>
              </Link>
              <a href="tel:+6421743321">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  <Phone className="w-5 h-5 mr-2" />
                  Call: 021 743 321
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white py-8 border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium">5,000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold fill-gold" />
              <span className="font-medium">4.9/5 Average Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              <span className="font-medium">24/7 Service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose BookaRide for Auckland Airport Transfers?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We make getting to and from Auckland Airport easy, affordable, and stress-free.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <feature.icon className="w-10 h-10 text-gold mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Auckland Airport Shuttle Service Areas
            </h2>
            <p className="text-gray-600">
              We cover all of Auckland with door-to-door airport transfer service.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceAreas.map((area, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{area.name}</h3>
                      <p className="text-gray-500 text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> {area.time}
                      </p>
                    </div>
                    <span className="text-gold font-bold">{area.price}</span>
                  </div>
                  <Link to="/book-now" className="text-gold hover:underline flex items-center text-sm font-medium">
                    Book Now <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/suburbs">
              <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
                View All Service Areas
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How to Book Your Auckland Airport Shuttle</h2>
            <p className="text-gray-400">Simple, fast, and hassle-free booking process</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Enter Details', desc: 'Pickup location, date, time, and passenger count' },
              { step: '2', title: 'Get Quote', desc: 'Instant fixed price - no hidden fees' },
              { step: '3', title: 'Book Online', desc: 'Secure payment or pay on arrival' },
              { step: '4', title: 'We Pick You Up', desc: 'Professional driver at your door' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 rounded-full bg-gold text-black font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Everything you need to know about Auckland Airport shuttles
            </p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Ready to Book Your Auckland Airport Shuttle?
          </h2>
          <p className="text-black/80 mb-8 text-lg">
            Join thousands of satisfied customers. Book your airport transfer today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book-now">
              <Button size="lg" className="bg-black hover:bg-gray-900 text-white font-bold px-8">
                Book Online Now
              </Button>
            </Link>
            <a href="tel:+6421743321">
              <Button size="lg" variant="outline" className="border-black text-black hover:bg-black hover:text-white px-8">
                Call: 021 743 321
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AucklandAirportShuttle;
