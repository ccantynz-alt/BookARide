import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const UKLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Airport Transfers for British Visitors to New Zealand"
        description="Premium airport shuttle service for British visitors to New Zealand. GBP payments accepted, reliable Auckland & Hamilton airport transfers. Book your NZ holiday transport now!"
        keywords="British visitors New Zealand, NZ airport transfer UK, Auckland airport shuttle British, New Zealand holiday transport UK, GBP payment airport transfer"
        canonical="/visitors/uk"
        currentLang="en"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-900 via-red-800 to-blue-900 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇬🇧</span>
              <span className="text-white font-medium">Welcome British Visitors!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your Kiwi Adventure <span className="text-gold">Awaits</span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Seamless airport transfers across New Zealand. After that long flight, 
              let us handle the driving.
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
          <h2 className="text-3xl font-bold text-center mb-12">Why Brits Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">GBP Payments</h3>
              <p className="text-gray-600">Pay in pounds with competitive exchange rates.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flight Monitoring</h3>
              <p className="text-gray-600">We track your BA, Air NZ, or Emirates flight delays.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Proper Service</h3>
              <p className="text-gray-600">Professional, punctual, and polite – just how you like it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Fellow Brits Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'James H.', location: 'London', text: 'Brilliant service after a 24-hour journey. Driver was waiting even though we were delayed. Top marks!' },
              { name: 'Sarah W.', location: 'Manchester', text: 'Used them for our entire North Island trip. Reliable, friendly, and great value for money.' },
              { name: 'The Smiths', location: 'Edinburgh', text: 'Traveling with elderly parents, they were so helpful. Would definitely recommend.' },
            ].map((review, idx) => (
              <div key={idx} className="bg-white/10 p-6 rounded-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-gold text-gold" />)}
                </div>
                <p className="text-white/90 mb-4">"{review.text}"</p>
                <p className="font-semibold">{review.name}</p>
                <p className="text-sm text-white/60">{review.location}, UK</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Book?</h2>
          <p className="text-black/80 mb-8">Join thousands of British visitors who trust us.</p>
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

export default UKLanding;
