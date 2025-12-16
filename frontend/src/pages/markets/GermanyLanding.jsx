import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, MapPin, Clock, Shield, Star, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import SEO from '../../components/SEO';

const GermanyLanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Flughafentransfers für deutsche Besucher in Neuseeland | NZ Airport Transfers for German Visitors"
        description="Premium Flughafentransfer-Service für deutsche Touristen in Neuseeland. Zuverlässige Auckland & Hamilton Flughafentransfers. EUR-Zahlungen akzeptiert. Premium airport shuttle for German tourists visiting New Zealand."
        keywords="Deutsche Besucher Neuseeland, NZ Flughafentransfer Deutschland, Auckland Flughafen Shuttle, Neuseeland Urlaub Transport, German visitors NZ"
        canonical="/visitors/germany"
        currentLang="de"
      />

      {/* Hero Section with Beautiful Germany Image */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-black via-red-800 to-yellow-500 overflow-hidden">
        {/* Brandenburg Gate Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=1920&q=80" 
            alt="Berlin Brandenburg Gate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-red-900/50 to-yellow-900/60" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
              <span className="text-2xl">🇩🇪</span>
              <span className="text-white font-medium">Willkommen deutsche Besucher!</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ihr NZ-Abenteuer <span className="text-gold">beginnt hier</span>
            </h1>
            <p className="text-xl text-white/80 mb-4">
              Your New Zealand Adventure Starts Here
            </p>
            <p className="text-lg text-white/70 mb-8">
              Zuverlässiger Flughafentransfer-Service in ganz Neuseeland
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Jetzt buchen Book Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Warum uns wählen?</h2>
          <p className="text-center text-gray-600 mb-12">Why German Visitors Choose Us</p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pünktlichkeit</h3>
              <p className="text-sm text-gray-600">Punctuality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sicherheit</h3>
              <p className="text-sm text-gray-600">Safety</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Qualität</h3>
              <p className="text-sm text-gray-600">Quality</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-lg font-semibold mb-2">EUR-Zahlung</h3>
              <p className="text-sm text-gray-600">EUR Payment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Beliebte Ziele</h2>
          <p className="text-center text-gray-600 mb-12">Popular Destinations</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'Hobbiton', desc: 'Herr der Ringe Filmset', price: 'Angebot anfordern' },
              { name: 'Rotorua', desc: 'Geothermische Wunder', price: 'Angebot anfordern' },
              { name: 'Auckland CBD', desc: 'Stadtzentrum Hotels', price: 'Ab $95 NZD' },
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
          <h2 className="text-3xl font-bold text-black mb-2">Bereit zu buchen?</h2>
          <p className="text-xl text-black/80 mb-8">Ready to Book?</p>
          <Link to="/book-now">
            <Button className="bg-black hover:bg-gray-900 text-white font-semibold px-8 py-6 text-lg">
              Jetzt buchen →
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default GermanyLanding;
