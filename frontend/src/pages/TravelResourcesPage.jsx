import React from 'react';
import AirportTerminalGuide from '../components/AirportTerminalGuide';
import NZTravelTips from '../components/NZTravelTips';
import { Plane, MapPin, Lightbulb } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const TravelResourcesPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
              <Lightbulb className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-sm">TRAVEL RESOURCES</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Your <span className="text-gold">NZ Travel</span> Guide
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Everything you need to know for a smooth arrival in New Zealand. 
              Airport guides, local tips, and travel advice from the locals.
            </p>

            <Link to="/book-now">
              <Button className="bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-6 text-lg">
                Book Your Airport Transfer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            
            {/* Airport Terminal Guide */}
            <div>
              <AirportTerminalGuide />
            </div>
            
            {/* NZ Travel Tips */}
            <div>
              <NZTravelTips />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-12">
            Popular Services
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Link to="/book-now" className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gold hover:shadow-lg transition-all text-center">
              <Plane className="w-10 h-10 text-gold mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Airport Transfers</h3>
              <p className="text-sm text-gray-600">Door-to-door service from Auckland Airport</p>
            </Link>
            
            <Link to="/hobbiton-transfers" className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gold hover:shadow-lg transition-all text-center">
              <MapPin className="w-10 h-10 text-gold mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Hobbiton Tours</h3>
              <p className="text-sm text-gray-600">Visit the famous movie set in style</p>
            </Link>
            
            <Link to="/flight-tracker" className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gold hover:shadow-lg transition-all text-center">
              <Plane className="w-10 h-10 text-gold mx-auto mb-4" />
              <h3 className="font-semibold text-gray-800 mb-2">Track Your Flight</h3>
              <p className="text-sm text-gray-600">Real-time flight monitoring</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to Explore New Zealand?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book your airport transfer now and start your Kiwi adventure stress-free.
          </p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-6 text-lg">
              Get Instant Quote
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default TravelResourcesPage;
