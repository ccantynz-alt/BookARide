import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, Star, ArrowRight, Check, Car, Users, Plane } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';
import GoogleReviewsWidget from '../../components/GoogleReviewsWidget';

const AlbanyAirportPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No surge pricing, no surprises' },
    { icon: Clock, title: 'Flight Tracking', desc: 'We monitor delays automatically' },
    { icon: Shield, title: 'Licensed & Insured', desc: 'Professional, vetted drivers' },
    { icon: Users, title: 'Any Group Size', desc: 'Solo travelers to large groups' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Albany to Auckland Airport Transfer | From $80 | BookaRide NZ"
        description="Book your Albany to Auckland Airport shuttle. Fixed prices from ~$80-95, professional drivers, flight tracking included. Get instant quote online!"
        keywords="Albany airport transfer, Albany to Auckland Airport, North Shore airport shuttle, Albany taxi airport, Albany airport shuttle"
        canonical="/albany-to-airport"
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
              Albany, North Shore
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Albany to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              From approximately <span className="text-gold font-bold text-2xl">$80-95</span>
            </p>
            <p className="text-gray-400 mb-8">
              Fixed pricing based on your exact address • No surge pricing • Professional service
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

      {/* Albany specific info */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Albany Airport Transfer Service</h2>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                Traveling from Albany to Auckland Airport? BookaRide offers reliable, fixed-price airport transfers 
                from anywhere in Albany - including Albany Village, Rosedale, Pinehill, and surrounding areas.
              </p>
              <p>
                Our pricing is calculated using <strong>Google Maps</strong> to measure the exact distance from your 
                pickup address to the airport. This per-kilometer pricing means you get a fair, accurate price 
                based on your actual location - no estimates or surge pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How pricing works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Every Address Has a Different Price</h2>
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Enter Your Exact Address</h3>
                    <p className="text-gray-600">Type in your pickup location in Albany</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-gray-900">Google Maps Calculates Distance</h3>
                    <p className="text-gray-600">We measure the precise kilometers to Auckland Airport</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-gold text-black rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-gray-900">See Your Instant Price</h3>
                    <p className="text-gray-600">Get the exact fare - no surprises, no surge</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Trusted by Albany Locals</h2>
          <div className="max-w-2xl mx-auto">
            <GoogleReviewsWidget />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Albany Airport Transfer Now</h2>
          <p className="text-gray-400 mb-8">Enter your address and see your exact price instantly</p>
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

export default AlbanyAirportPage;
