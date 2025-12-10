import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const AustraliaLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Airport Transfers for Australian Visitors to New Zealand"
        description="Premium airport shuttle service for Australians visiting New Zealand. Easy AUD payments, reliable Auckland & Hamilton airport transfers. Book your NZ holiday transport now!"
        keywords="Australian visitors New Zealand, NZ airport transfer from Australia, Auckland airport shuttle Australians, New Zealand holiday transport, AUD payment airport transfer"
        canonical="/visitors/australia"
        currentLang="en"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-gray-900 via-black to-gray-800 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.2),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇦🇺</span>
              <span className="text-gold font-medium">Welcome Australian Visitors!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your New Zealand Adventure <span className="text-gold">Starts Here</span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Seamless airport transfers across New Zealand. We understand Aussie travellers – 
              reliable service, fair dinkum prices, and easy AUD payments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Transfer
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Australians Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AUD Payments Accepted</h3>
              <p className="text-gray-600">Pay in Australian dollars with no hidden conversion fees. We make it easy for you.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flight Monitoring</h3>
              <p className="text-gray-600">We track your Qantas, Virgin, or Jetstar flight. Delayed? We'll be there when you land.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Group Friendly</h3>
              <p className="text-gray-600">Travelling with mates? We accommodate groups of all sizes with our spacious vehicles.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Routes for Aussie Visitors</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { from: 'Auckland Airport', to: 'Auckland CBD', price: 'From $65 NZD', time: '~35 mins' },
              { from: 'Auckland Airport', to: 'Queenstown Hotels', price: 'From $85 NZD', time: '~45 mins' },
              { from: 'Auckland Airport', to: 'Rotorua', price: 'From $280 NZD', time: '~3 hours' },
              { from: 'Auckland Airport', to: 'Hobbiton', price: 'From $320 NZD', time: '~2.5 hours' },
            ].map((route, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold">{route.from} → {route.to}</p>
                    <p className="text-sm text-gray-500">{route.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gold">{route.price}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black font-semibold">
                Get Your Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Fellow Aussies Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Sarah M.', location: 'Sydney', text: 'Brilliant service! Driver was waiting for us even though our flight was delayed. Made our NZ trip start perfectly.' },
              { name: 'James T.', location: 'Melbourne', text: 'Used them for our whole South Island trip. Professional, punctual, and the prices were very reasonable.' },
              { name: 'Emma & Family', location: 'Brisbane', text: 'Travelling with kids is stressful enough. These guys made the airport transfer so easy. Highly recommend!' },
            ].map((review, idx) => (
              <div key={idx} className="bg-white/10 p-6 rounded-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-gold text-gold" />)}
                </div>
                <p className="text-white/90 mb-4">"{review.text}"</p>
                <p className="font-semibold">{review.name}</p>
                <p className="text-sm text-white/60">{review.location}, Australia</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Book Your NZ Transfer?</h2>
          <p className="text-black/80 mb-8 max-w-2xl mx-auto">
            Join thousands of Australian visitors who trust us for their New Zealand airport transfers.
          </p>
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

export default AustraliaLanding;
