import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

const USALanding = () => {
  // Schema markup for American visitors
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": "New Zealand Airport Transfers for American Visitors",
    "description": "Premium airport shuttle service for American tourists visiting New Zealand. Door-to-door transfers from Auckland and Hamilton airports.",
    "touristType": "American Visitors",
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ",
      "telephone": "+64 21 743 321",
      "url": "https://bookaride.co.nz"
    },
    "itinerary": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "item": {
            "@type": "TouristAttraction",
            "name": "Hobbiton Movie Set",
            "description": "The Lord of the Rings filming location"
          }
        },
        {
          "@type": "ListItem",
          "position": 2,
          "item": {
            "@type": "TouristAttraction",
            "name": "Rotorua",
            "description": "Geothermal wonders and Maori culture"
          }
        }
      ]
    },
    "offers": {
      "@type": "Offer",
      "price": "65",
      "priceCurrency": "NZD",
      "availability": "https://schema.org/InStock"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I get from Auckland Airport to my hotel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "BookaRide offers private door-to-door airport transfers from Auckland Airport to any hotel in the Auckland region. Simply book online, and we'll be waiting for you when you arrive."
        }
      },
      {
        "@type": "Question",
        "name": "Can I pay in US dollars?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "While our prices are displayed in NZD, we accept all major credit cards and your bank will handle the currency conversion automatically. There are no hidden fees."
        }
      },
      {
        "@type": "Question",
        "name": "How far is Hobbiton from Auckland Airport?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Hobbiton Movie Set is approximately 2.5 hours drive from Auckland Airport. We offer direct transfers - get an instant quote on our booking page. Perfect for Lord of the Rings fans."
        }
      },
      {
        "@type": "Question",
        "name": "Do you offer child seats for family travel?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We provide free child seats and baby capsules upon request. Just mention it when you book, and we'll have everything ready for your arrival."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Airport Transfers for American Visitors to New Zealand | BookaRide</title>
        <meta name="description" content="Premium airport shuttle service for American tourists visiting New Zealand. USD payments accepted, reliable Auckland & Hamilton airport transfers. Book your NZ vacation transport now!" />
        <meta name="keywords" content="American visitors New Zealand, NZ airport transfer USA, Auckland airport shuttle Americans, New Zealand vacation transport, USD payment airport transfer" />
        <link rel="canonical" href="https://bookaride.co.nz/visitors/usa" />
        <meta property="og:title" content="Auckland Airport Transfers for American Visitors" />
        <meta property="og:description" content="Welcome to New Zealand! Start your Kiwi adventure with reliable, comfortable airport transfers." />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-red-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzR2LTRoLTJ2NGgtNHYyaDR2NGgydi00aDR2LTJoLTR6bTAtMzBWMGgtMnY0aC00djJoNHY0aDJWNmg0VjRoLTR6TTYgMzR2LTRINHY0SDB2Mmg0djRoMnYtNGg0di0ySDZ6TTYgNFYwSDR2NEgwdjJoNHY0aDJWNmg0VjRINnoiLz48L2c+PC9nPjwvc3ZnPg==')]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇺🇸</span>
              <span className="text-white font-medium">Welcome American Visitors!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your Kiwi Adventure <span className="text-gold">Starts Here</span>
            </h1>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              After your long trans-Pacific flight, let us handle the ground transport. 
              Sit back, relax, and enjoy the stunning New Zealand scenery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Transfer
                </Button>
              </Link>
              <a href="tel:+6421743321">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  Call +64 21 743 321
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges for Americans */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Major Credit Cards Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">Flight Tracking Included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">English-Speaking Drivers</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">No Tipping Required</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why Americans Choose BookaRide</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            We understand the needs of American travelers - from jet lag to luggage space to family-friendly service.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Easy Payment</h3>
                <p className="text-gray-600">All major credit cards accepted. Your bank handles the conversion - no surprises.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Flight Tracking</h3>
                <p className="text-gray-600">We monitor your United, American, or Air NZ flight. Delays? We adjust automatically.</p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Family Friendly</h3>
                <p className="text-gray-600">Spacious vehicles for families, lots of luggage space, and free child seats available.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Hobbiton Feature - The #1 destination for Americans */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="text-gold font-semibold mb-2 block">🎬 MOST POPULAR FOR AMERICANS</span>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Visit Middle-earth!</h2>
                <p className="text-gray-300 mb-6">
                  The Hobbiton Movie Set is the #1 attraction for American visitors to New Zealand. 
                  We offer direct transfers from Auckland Airport - skip the tour bus and travel in comfort.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span>Direct door-to-door transfer</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span>2.5 hours scenic drive through NZ countryside</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span>Flexible timing - go when YOU want</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold" />
                    <span>Private vehicle - just your group</span>
                  </li>
                </ul>
                <div className="bg-gold/20 p-4 rounded-lg inline-block">
                  <p className="text-gold text-sm font-semibold">Auckland Airport → Hobbiton</p>
                  <p className="text-3xl font-bold">Get a Quote</p>
                  <p className="text-sm text-gray-400">~$195 USD</p>
                </div>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-br from-green-800/30 to-green-900/30 rounded-2xl p-8 text-center">
                  <span className="text-8xl">🧙‍♂️</span>
                  <p className="text-2xl font-bold mt-4">The Shire awaits!</p>
                  <p className="text-gray-400">One does not simply walk to Mordor... but we can drive you to the Shire!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Popular Routes for American Visitors</h2>
          <p className="text-center text-gray-600 mb-12">Fixed prices, no surge pricing - get an instant quote</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { from: 'Auckland Airport', to: 'Auckland CBD', price: 'From $100', time: '25-35 min' },
              { from: 'Auckland Airport', to: 'North Shore', price: 'From $100', time: '35-50 min' },
              { from: 'Auckland Airport', to: 'Hobbiton', price: 'Get Quote', time: '2.5 hours' },
              { from: 'Auckland Airport', to: 'Rotorua', price: 'Get Quote', time: '3 hours' },
              { from: 'Auckland Airport', to: 'Waitomo Caves', price: 'Get Quote', time: '2.5 hours' },
              { from: 'Auckland Airport', to: 'Coromandel', price: 'Get Quote', time: '2.5 hours' },
            ].map((route, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <MapPin className="w-6 h-6 text-gold" />
                      <div>
                        <p className="font-semibold">{route.from} → {route.to}</p>
                        <p className="text-sm text-gray-500">{route.time}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold">{route.price}</p>
                      <p className="text-xs text-gray-500">NZD</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* NZ Travel Tips for Americans */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">🇳🇿 Quick Tips for Americans in NZ</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <span className="text-3xl mb-3 block">🚗</span>
                <h3 className="font-semibold mb-2">We Drive on the LEFT</h3>
                <p className="text-sm text-gray-600">That's why we recommend a shuttle - let us handle the driving!</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <span className="text-3xl mb-3 block">🔌</span>
                <h3 className="font-semibold mb-2">Different Power Plugs</h3>
                <p className="text-sm text-gray-600">NZ uses Type I plugs. Bring an adapter!</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6 text-center">
                <span className="text-3xl mb-3 block">💵</span>
                <h3 className="font-semibold mb-2">No Tipping Expected</h3>
                <p className="text-sm text-gray-600">Unlike the US, tipping isn't customary in NZ.</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6 text-center">
                <span className="text-3xl mb-3 block">📋</span>
                <h3 className="font-semibold mb-2">Visa Waiver</h3>
                <p className="text-sm text-gray-600">US citizens can stay up to 90 days visa-free.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready for Your NZ Adventure?</h2>
          <p className="text-black/80 mb-8 max-w-xl mx-auto">
            Join thousands of American visitors who trust BookaRide for their New Zealand transportation.
          </p>
          <Link to="/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              Book Your Transfer Now →
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default USALanding;
