import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const USALanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Airport Transfers for American Visitors to New Zealand"
        description="Premium airport shuttle service for American tourists visiting New Zealand. USD payments accepted, reliable Auckland & Hamilton airport transfers. Book your NZ vacation transport now!"
        keywords="American visitors New Zealand, NZ airport transfer USA, Auckland airport shuttle Americans, New Zealand vacation transport, USD payment airport transfer"
        canonical="/visitors/usa"
        currentLang="en"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-red-900 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇺🇸</span>
              <span className="text-white font-medium">Welcome American Visitors!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your Kiwi Adventure <span className="text-gold">Starts Here</span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Seamless airport transfers across New Zealand. We make your long-haul journey 
              worth it with reliable, comfortable transportation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Transfer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Americans Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">USD Payments</h3>
              <p className="text-gray-600">Pay in US dollars - we handle the conversion for you.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flight Tracking</h3>
              <p className="text-gray-600">We monitor your United, American, or Air NZ flight delays.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Family Friendly</h3>
              <p className="text-gray-600">Spacious vehicles for families, luggage, and car seats available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Lord of the Rings Feature */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Visit Middle-earth!</h2>
            <p className="text-xl text-white/80 mb-8">
              We offer direct transfers to Hobbiton Movie Set - the most popular destination for American visitors.
            </p>
            <div className="bg-white/10 p-8 rounded-xl">
              <h3 className="text-2xl font-semibold mb-2">Auckland Airport → Hobbiton</h3>
              <p className="text-gold text-3xl font-bold mb-4">From $320 NZD</p>
              <p className="text-white/70">~2.5 hours scenic drive through NZ countryside</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Routes</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { from: 'Auckland Airport', to: 'Auckland CBD', price: 'From $65 NZD' },
              { from: 'Auckland Airport', to: 'Rotorua', price: 'From $280 NZD' },
              { from: 'Auckland Airport', to: 'Waitomo Caves', price: 'From $290 NZD' },
              { from: 'Auckland Airport', to: 'Bay of Islands', price: 'From $450 NZD' },
            ].map((route, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-gold" />
                  <span className="font-semibold">{route.from} → {route.to}</span>
                </div>
                <span className="font-bold text-gold">{route.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready for Your NZ Adventure?</h2>
          <p className="text-black/80 mb-8">Join thousands of American visitors who trust us.</p>
          <Link to="/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              Book Now →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default USALanding;
