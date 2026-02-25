import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, Star, ArrowRight, Check, Car, Users, Plane } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';
import GoogleReviewsWidget from '../../components/GoogleReviewsWidget';

const TakapunaAirportPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No surge pricing, no surprises' },
    { icon: Clock, title: 'Flight Tracking', desc: 'We monitor delays automatically' },
    { icon: Shield, title: 'Licensed & Insured', desc: 'Professional, vetted drivers' },
    { icon: Users, title: 'Any Group Size', desc: 'Solo travelers to large groups' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Takapuna to Auckland Airport Transfer | Get Instant Quote | BookaRide NZ"
        description="Book your Takapuna to Auckland Airport shuttle. Instant online quotes, professional drivers, flight tracking included. Get instant quote online!"
        keywords="Takapuna airport transfer, Takapuna to Auckland Airport, North Shore airport shuttle, Takapuna taxi airport"
        canonical="/takapuna-to-airport"
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
              Takapuna, North Shore
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Takapuna to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Get your <span className="text-gold font-bold text-2xl">Instant Quote</span> online
            </p>
            <p className="text-gray-400 mb-8">
              Live pricing calculator • No hidden fees • Professional service
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                  Get Exact Price
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

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How Our Pricing Works</h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Google Maps Precision</h3>
                  <p className="text-gray-600">
                    We use Google Maps to calculate the <strong>exact distance</strong> from your pickup address to the airport. 
                    This means every address in Takapuna has a slightly different price - it's calculated <strong>per kilometer</strong>, 
                    so you only pay for the actual distance traveled.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-gray-600">Enter your exact address on our booking form to see your <strong className="text-gold">precise price instantly</strong></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
          <div className="max-w-2xl mx-auto">
            <GoogleReviewsWidget />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Takapuna Airport Transfer?</h2>
          <p className="text-gray-400 mb-8">Get your exact price in seconds - just enter your address</p>
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

export default TakapunaAirportPage;
