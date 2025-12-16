import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, ArrowRight, Check, Plane, Building } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';
import GoogleReviewsWidget from '../../components/GoogleReviewsWidget';

const AirportToCityPage = () => {
  const popularDestinations = [
    { name: 'Auckland CBD', price: '$65-75' },
    { name: 'Ponsonby', price: '$65-75' },
    { name: 'Newmarket', price: '$60-70' },
    { name: 'Parnell', price: '$60-70' },
    { name: 'Grey Lynn', price: '$65-75' },
    { name: 'Mt Eden', price: '$60-70' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Auckland Airport to City Centre Transfer | Get Instant Quote | BookaRide NZ"
        description="Fixed-price transfers from Auckland Airport to CBD, Ponsonby, Newmarket & more. Meet & greet available. Get instant quote with exact pricing!"
        keywords="Auckland Airport to city, airport to CBD transfer, Auckland Airport shuttle city, airport to Ponsonby, airport to Newmarket"
        canonical="/auckland-airport-to-city"
      />

      {/* Hero */}
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
              <Plane className="w-4 h-4" />
              Auckland Airport
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Airport to <span className="text-gold">Auckland City</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              From approximately <span className="text-gold font-bold text-2xl">$65-75</span> to CBD
            </p>
            <p className="text-gray-400 mb-8">
              Fixed pricing to your exact address • Meet & greet at arrivals • Flight tracking included
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                  Get Your Exact Price
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Meet & greet available</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> We track your flight</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Fixed price guarantee</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Popular City Destinations</h2>
          <p className="text-center text-gray-600 mb-8">
            Prices vary by exact address - get your precise quote online
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {popularDestinations.map((dest, idx) => (
              <Card key={idx} className="text-center">
                <CardContent className="p-6">
                  <Building className="w-8 h-8 text-gold mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900">{dest.name}</h3>
                  <p className="text-2xl font-bold text-gold mt-2">{dest.price}</p>
                  <p className="text-xs text-gray-500 mt-1">approx.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Meet & Greet */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-gold/10 to-yellow-50 rounded-2xl p-8 md:p-12">
              <div className="md:flex items-center gap-8">
                <div className="md:w-1/2 mb-6 md:mb-0">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet & Greet Service</h2>
                  <p className="text-gray-600 mb-4">
                    Just landed? Our driver will be waiting at the arrivals gate with a sign displaying your name. 
                    No searching for transport, no waiting in taxi queues.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" /> Driver waiting at arrivals
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" /> Personalized name sign
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" /> Help with luggage
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <Check className="w-5 h-5 text-green-500" /> Flight delay? We wait for you
                    </li>
                  </ul>
                </div>
                <div className="md:w-1/2">
                  <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                    <p className="text-gray-500 text-sm mb-2">Add Meet & Greet for just</p>
                    <p className="text-4xl font-bold text-gold">$15</p>
                    <p className="text-gray-600 mt-4 text-sm">
                      Select this option when booking online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How pricing works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Accurate, Fair Pricing</h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <p className="text-gray-600 text-center mb-6">
                We use <strong>Google Maps</strong> to calculate the exact distance from Auckland Airport to your dropoff address. 
                Our per-kilometer pricing means you pay fairly for the actual distance - no flat rates that overcharge short trips 
                or undercharge long ones.
              </p>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-blue-800">
                  <strong>Example:</strong> A hotel on Queen Street pays less than an apartment in Ponsonby 
                  because it's closer to the airport. Fair and transparent!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">What Travelers Say</h2>
          <div className="max-w-2xl mx-auto">
            <GoogleReviewsWidget />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Airport to City Transfer</h2>
          <p className="text-gray-400 mb-8">Enter your destination for an instant, exact price</p>
          <Link to="/book-now">
            <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
              Get Instant Quote
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AirportToCityPage;
