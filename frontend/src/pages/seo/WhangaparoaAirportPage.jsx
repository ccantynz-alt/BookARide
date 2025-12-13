import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Clock, Shield, Star, MapPin, Phone, Car, Plane, ArrowRight, Navigation, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const WhangaparoaAirportPage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": "Whangaparaoa to Auckland Airport Shuttle",
    "description": "Private shuttle service from Whangaparaoa Peninsula to Auckland Airport",
    "offers": {
      "@type": "Offer",
      "price": "100",
      "priceCurrency": "NZD"
    }
  };

  const areas = [
    { name: 'Gulf Harbour', price: 105 },
    { name: 'Army Bay', price: 105 },
    { name: 'Stanmore Bay', price: 100 },
    { name: 'Manly', price: 100 },
    { name: 'Matakatia', price: 105 },
    { name: 'Arkles Bay', price: 100 },
    { name: 'Big Manly', price: 100 },
    { name: 'Tindalls Beach', price: 105 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Whangaparaoa Airport Shuttle | From $100 | Gulf Harbour, Stanmore Bay | BookaRide</title>
        <meta name="description" content="Whangaparaoa to Auckland Airport shuttle from $100. Serving Gulf Harbour, Stanmore Bay, Army Bay, Manly & all peninsula areas. Private door-to-door transfers 24/7." />
        <meta name="keywords" content="whangaparaoa airport shuttle, whangaparaoa airport transfer, gulf harbour airport shuttle, stanmore bay airport transfer, whangaparaoa to auckland airport" />
        <link rel="canonical" href="https://bookaride.co.nz/whangaparaoa-airport-transfer" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-900 via-teal-800 to-teal-900 text-white py-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center bg-white/20 px-4 py-2 rounded-full text-sm mb-6">
              <MapPin className="w-4 h-4 mr-2" />
              Whangaparaoa Peninsula → Auckland Airport
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Whangaparaoa <span className="text-gold">Airport Transfer</span>
            </h1>
            <p className="text-xl text-gray-200 mb-4">
              Private shuttles from every corner of the Whangaparaoa Peninsula
            </p>
            <div className="flex items-center gap-6 mb-8 text-lg">
              <span className="flex items-center"><Navigation className="w-5 h-5 mr-2 text-gold" /> 50km</span>
              <span className="flex items-center"><Clock className="w-5 h-5 mr-2 text-gold" /> 45-55 min</span>
              <span className="flex items-center text-gold font-bold">From $100</span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8">
                  Book Now - From $100
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

      {/* Areas Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Whangaparaoa Peninsula <span className="text-gold">Shuttle Prices</span>
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We cover every suburb on the Whangaparaoa Peninsula with fixed, transparent pricing
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {areas.map((area, idx) => (
              <Card key={idx} className="hover:border-gold hover:shadow-lg transition-all">
                <CardContent className="p-6 text-center">
                  <MapPin className="w-6 h-6 mx-auto mb-2 text-gold" />
                  <h3 className="font-bold mb-2">{area.name}</h3>
                  <p className="text-2xl font-bold text-gold">${area.price}</p>
                  <p className="text-sm text-gray-500">to airport</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Your Local Whangaparaoa <span className="text-gold">Airport Shuttle</span>
              </h2>
              <p className="text-gray-600 mb-6">
                We know the peninsula inside out. From Gulf Harbour Marina to Army Bay, 
                from Stanmore Bay to Shakespear Park - we&apos;ll pick you up wherever you are.
              </p>
              <ul className="space-y-4">
                {[
                  'Door-to-door from any Whangaparaoa address',
                  'Early morning flights? We\'re up at 3am',
                  'Flight tracking - we adjust for delays',
                  'Child seats available free',
                  'Large luggage? No problem',
                  'Pets welcome (in carriers)'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-teal-600 text-white">
                <CardContent className="p-6 text-center">
                  <Clock className="w-10 h-10 mx-auto mb-3" />
                  <h3 className="font-bold">24/7 Service</h3>
                  <p className="text-sm text-teal-100">Any time, any day</p>
                </CardContent>
              </Card>
              <Card className="bg-gold text-black">
                <CardContent className="p-6 text-center">
                  <Car className="w-10 h-10 mx-auto mb-3" />
                  <h3 className="font-bold">Private Only</h3>
                  <p className="text-sm">No sharing</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 text-white">
                <CardContent className="p-6 text-center">
                  <Shield className="w-10 h-10 mx-auto mb-3" />
                  <h3 className="font-bold">Fixed Price</h3>
                  <p className="text-sm text-gray-300">No surprises</p>
                </CardContent>
              </Card>
              <Card className="bg-green-600 text-white">
                <CardContent className="p-6 text-center">
                  <Star className="w-10 h-10 mx-auto mb-3 fill-current" />
                  <h3 className="font-bold">4.9★ Rating</h3>
                  <p className="text-sm text-green-100">Trusted service</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Whangaparaoa Airport Shuttle FAQs
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How long from Whangaparaoa to Auckland Airport?',
                a: 'Depending on which part of the peninsula you\'re in, it takes 45-60 minutes. Gulf Harbour and Army Bay are furthest (55-60 min), while Stanmore Bay is closer (45-50 min).'
              },
              {
                q: 'What time should I book for an early morning flight?',
                a: 'We recommend arriving at the airport 2 hours before domestic and 3 hours before international flights. We\'ll calculate the perfect pickup time based on your address.'
              },
              {
                q: 'Do you pick up from Gulf Harbour Marina?',
                a: 'Absolutely! We regularly pick up from Gulf Harbour Marina, the ferry terminal area, and all surrounding streets.'
              },
              {
                q: 'Can you take us to the airport and back?',
                a: 'Yes! Book a return trip and save. We\'ll drop you off for your departure and pick you up when you return.'
              }
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Whangaparaoa Transfer Today</h2>
          <p className="text-teal-100 mb-8">From $100 • Door-to-door • Flight tracking included</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
                Book Online Now
                <Plane className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:+6421339030">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                <Phone className="mr-2 w-5 h-5" />
                Call 021 339 030
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhangaparoaAirportPage;
