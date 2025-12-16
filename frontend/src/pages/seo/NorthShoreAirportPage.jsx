import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, ArrowRight, Check, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';
import GoogleReviewsWidget from '../../components/GoogleReviewsWidget';

const NorthShoreAirportPage = () => {
  const suburbs = [
    { name: 'Takapuna', price: 'Get Quote', link: '/takapuna-to-airport' },
    { name: 'Albany', price: 'Get Quote', link: '/albany-to-airport' },
    { name: 'Browns Bay', price: 'Get Quote', link: '/book-now' },
    { name: 'Devonport', price: 'Get Quote', link: '/book-now' },
    { name: 'Milford', price: 'Get Quote', link: '/book-now' },
    { name: 'Northcote', price: 'Get Quote', link: '/book-now' },
    { name: 'Birkenhead', price: 'Get Quote', link: '/book-now' },
    { name: 'Glenfield', price: 'Get Quote', link: '/book-now' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="North Shore to Auckland Airport Shuttle | Fixed Prices | BookaRide NZ"
        description="Airport transfers from all North Shore suburbs - Takapuna, Albany, Browns Bay, Devonport & more. Fixed prices, no surge. Get instant quote!"
        keywords="North Shore airport shuttle, North Shore to Auckland Airport, Takapuna airport transfer, Albany airport shuttle, Browns Bay airport taxi"
        canonical="/north-shore-airport-shuttle"
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
              <MapPin className="w-4 h-4" />
              All North Shore Suburbs
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              North Shore <span className="text-gold">Airport Shuttle</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Fixed-price transfers from every North Shore suburb to Auckland Airport
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
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Google Maps pricing</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Per-kilometer rates</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> No surge pricing</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Suburb Prices */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">North Shore Suburb Prices</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Approximate prices shown below. Enter your exact address for precise pricing - 
            every house has a different rate based on Google Maps distance.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {suburbs.map((suburb, idx) => (
              <Link key={idx} to={suburb.link}>
                <Card className="hover:shadow-lg hover:border-gold transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-gold transition-colors">{suburb.name}</h3>
                      <p className="text-sm text-gray-500">to Airport</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold">{suburb.price}</p>
                      <ChevronRight className="w-4 h-4 text-gray-400 inline group-hover:text-gold transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            * Prices are estimates. Get your exact price by entering your address.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Our North Shore Pricing Works</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Enter Your Address</h3>
                  <p className="text-sm text-gray-600">Type your exact North Shore pickup location</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <DollarSign className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Per-Kilometer Pricing</h3>
                  <p className="text-sm text-gray-600">Google Maps calculates exact distance</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Instant Quote</h3>
                  <p className="text-sm text-gray-600">See your fixed price immediately</p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-blue-800">
                  <strong>Why every address is different:</strong> A house on the northern end of Albany pays more than 
                  one on the southern end because it's further from the airport. Fair, transparent, accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Loved by North Shore Locals</h2>
          <div className="max-w-2xl mx-auto">
            <GoogleReviewsWidget />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your North Shore Airport Transfer</h2>
          <p className="text-gray-400 mb-8">Enter your address for an instant, accurate price</p>
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

export default NorthShoreAirportPage;
