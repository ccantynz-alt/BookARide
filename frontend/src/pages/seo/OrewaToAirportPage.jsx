import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Clock, Shield, Star, MapPin, Phone, Car, Plane, ArrowRight, Navigation } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const OrewaToAirportPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": "Orewa to Auckland Airport Shuttle",
    "description": "Private shuttle service from Orewa to Auckland Airport",
    "touristType": "Airport Transfer",
    "offers": {
      "@type": "Offer",
      "price": "95",
      "priceCurrency": "NZD"
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Orewa to Auckland Airport Shuttle | Get Instant Quote | Private Transfers | BookaRide</title>
        <meta name="description" content="Private shuttle from Orewa to Auckland Airport with instant online quotes. Door-to-door service, flight tracking, 24/7 availability. Book your Orewa airport transfer online instantly." />
        <meta name="keywords" content="orewa to auckland airport, orewa airport shuttle, orewa airport transfer, orewa to airport taxi" />
        <link rel="canonical" href="https://bookaride.co.nz/orewa-to-auckland-airport" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full text-sm mb-6">
              <MapPin className="w-4 h-4 mr-2" />
              Orewa → Auckland Airport
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Orewa to Auckland Airport <span className="text-gold">Shuttle</span>
            </h1>
            <p className="text-xl text-gray-200 mb-4">
              Private door-to-door transfers from Orewa Beach to Auckland Airport
            </p>
            <div className="flex items-center gap-6 mb-8 text-lg">
              <span className="flex items-center"><Navigation className="w-5 h-5 mr-2 text-gold" /> 45km</span>
              <span className="flex items-center"><Clock className="w-5 h-5 mr-2 text-gold" /> 40-50 min</span>
              <span className="flex items-center text-gold font-bold">Get Instant Quote</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8">
                  Book Now - $95
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+6421339030">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                  <Phone className="mr-2 w-5 h-5" />
                  021 339 030
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Route Info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                The Easiest Way from <span className="text-gold">Orewa to the Airport</span>
              </h2>
              <p className="text-gray-600 mb-6">
                Skip the stress of parking, expensive taxis, or unreliable public transport. 
                Our private Orewa to Auckland Airport shuttle gets you there relaxed and on time.
              </p>
              <ul className="space-y-4">
                {[
                  'Pickup from any Orewa address',
                  'Direct route - no other stops',
                  'Flight monitoring for delays',
                  'Free child seats on request',
                  'Luggage assistance included',
                  'Meet & greet available'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="bg-gray-50">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">Orewa Airport Transfer Pricing</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span>Orewa Beach to Airport</span>
                    <span className="text-2xl font-bold text-gold">$95</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span>Orewa Town Centre to Airport</span>
                    <span className="text-2xl font-bold text-gold">$95</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span>Return Trip (both ways)</span>
                    <span className="text-2xl font-bold text-gold">Instant Quote</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    * Prices include GST, no hidden fees
                  </p>
                </div>
                <Link to="/book-now" className="block mt-6">
                  <Button className="w-full bg-gold hover:bg-yellow-500 text-black font-bold">
                    Book Orewa Transfer
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Orewa Locals Choose BookaRide
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'On-Time Guarantee', desc: 'We monitor your flight and adjust pickup times automatically' },
              { icon: Car, title: 'Private Vehicle', desc: 'No sharing - just you and your group in a clean, comfortable vehicle' },
              { icon: Shield, title: 'Fixed Pricing', desc: 'Instant quote for Orewa. No surge pricing, ever.' },
              { icon: Star, title: '4.9★ Rated', desc: 'Trusted by hundreds of Orewa residents' },
            ].map((item, idx) => (
              <Card key={idx}>
                <CardContent className="p-6 text-center">
                  <item.icon className="w-12 h-12 mx-auto mb-4 text-gold" />
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Areas */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Also Serving Near Orewa</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {['Red Beach', 'Silverdale', 'Millwater', 'Hatfields Beach', 'Waiwera'].map((area, idx) => (
              <Link key={idx} to="/book-now" className="bg-gray-100 hover:bg-gold hover:text-black px-6 py-3 rounded-full transition-colors">
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Orewa Airport Transfer</h2>
          <p className="mb-8">Get Instant Quote • 40-50 minutes • Door-to-door service</p>
          <Link to="/book-now">
            <Button size="lg" className="bg-black hover:bg-gray-800 text-white font-bold">
              Book Now
              <Plane className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default OrewaToAirportPage;
