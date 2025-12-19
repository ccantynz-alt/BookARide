import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, Star, ArrowRight, Check, Car, Users, Plane, Coffee, Wine } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import SEO from '../../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../../components/PageBreadcrumb';

const PonsonbyAirportPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No surge pricing ever' },
    { icon: Clock, title: 'Flight Tracking', desc: 'We monitor your flight' },
    { icon: Shield, title: 'Professional', desc: 'Licensed & insured drivers' },
    { icon: Users, title: 'Any Group Size', desc: '1-11 passengers' },
  ];

  const popularPickups = [
    'Ponsonby Road cafes & restaurants',
    'Three Lamps area',
    'Ponsonby Central',
    'Richmond Road',
    'Franklin Road',
    'Jervois Road',
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Ponsonby to Auckland Airport Shuttle | Private Transfer | BookaRide"
        description="Book your Ponsonby to Auckland Airport private transfer. Door-to-door service from Ponsonby Road, Three Lamps, Franklin Road. Get instant quote online!"
        keywords="Ponsonby airport transfer, Ponsonby to Auckland Airport, Ponsonby shuttle, Ponsonby Road airport taxi, Three Lamps airport transfer"
        canonical="/ponsonby-to-airport"
      />

      <PageBreadcrumb 
        items={[
          { label: 'Auckland CBD', href: '/auckland-cbd-airport' },
          { label: 'Ponsonby' }
        ]} 
      />

      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/30 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <MapPin className="w-4 h-4" />
              Ponsonby, Auckland CBD
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Ponsonby to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Private door-to-door transfers from Auckland's trendiest suburb
            </p>
            <p className="text-gray-400 mb-8">
              ~25 minutes to airport • Instant online quotes • Professional drivers
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                  Get Instant Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Free cancellation</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Flight tracking</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Meet & greet available</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Ponsonby Airport Transfer Service</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Need a reliable airport transfer from Ponsonby? BookaRide offers premium private shuttle services 
                from Auckland's most vibrant inner-city suburb directly to Auckland Airport. Whether you're heading 
                out from Ponsonby Road, Three Lamps, or Franklin Road, our professional drivers will pick you up 
                from your exact location.
              </p>
              <p>
                Ponsonby is known for its boutique shopping, trendy cafes, and excellent restaurants. After enjoying 
                everything this iconic Auckland suburb has to offer, let us take the stress out of getting to the airport. 
                Our fixed-price transfers mean no surprises, and our flight tracking ensures we're always on time.
              </p>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Popular Pickup Locations in Ponsonby</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {popularPickups.map((loc, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span>{loc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Ponsonby Airport Transfer?</h2>
          <p className="text-gray-400 mb-8">Get an instant quote in seconds</p>
          <Link to="/book-now">
            <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
              Get Instant Quote <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PonsonbyAirportPage;