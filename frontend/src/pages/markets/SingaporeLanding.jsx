import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const SingaporeLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Airport Transfers for Singapore Visitors to New Zealand"
        description="Premium airport shuttle service for Singaporean visitors to New Zealand. Reliable Auckland & Hamilton airport transfers. SGD payments accepted. Book your NZ holiday transport now!"
        keywords="Singapore visitors New Zealand, NZ airport transfer Singapore, Auckland airport shuttle Singaporeans, New Zealand holiday transport, SGD payment airport transfer"
        canonical="/visitors/singapore"
        currentLang="en"
      />

      {/* Hero Section with Beautiful Singapore Image */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-red-800 via-red-700 to-gray-900 overflow-hidden">
        {/* Marina Bay Sands Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1920&q=80" 
            alt="Singapore Marina Bay Sands skyline" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 via-red-800/60 to-black/70" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇸🇬</span>
              <span className="text-white font-medium">Welcome Singapore Visitors!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Your NZ Adventure <span className="text-gold">Awaits</span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Seamless airport transfers across New Zealand. SGD payments accepted, 
              reliable service for your Kiwi holiday.
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
          <h2 className="text-3xl font-bold text-center mb-12">Why Singaporeans Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">SGD Payments Accepted</h3>
              <p className="text-gray-600">Pay in Singapore dollars with competitive exchange rates.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Flight Monitoring</h3>
              <p className="text-gray-600">We track your Singapore Airlines, Scoot, or Air NZ flight.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Reliable</h3>
              <p className="text-gray-600">Professional drivers, modern vehicles, fully insured.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Destinations</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Hobbiton', desc: 'Lord of the Rings filming location', price: 'Get a Quote' },
              { name: 'Rotorua', desc: 'Geothermal wonders & Maori culture', price: 'Get a Quote' },
              { name: 'Auckland CBD', desc: 'City centre hotels', price: 'Get Instant Quote NZD' },
            ].map((dest, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-xl hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{dest.name}</h3>
                <p className="text-gray-600 mb-4">{dest.desc}</p>
                <p className="text-gold font-bold">{dest.price}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Book?</h2>
          <p className="text-black/80 mb-8">Join thousands of Singaporean visitors who trust us.</p>
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

export default SingaporeLanding;
