import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock, Shield, CreditCard, Users, Plane, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';

const HamiltonAirportInternational = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Hamilton Airport Transfers - International Service | Book A Ride NZ</title>
        <meta name="description" content="Professional Hamilton Airport transfer service for international travelers. Multi-currency booking, 24/7 support, meet & greet service. Book your Waikato airport shuttle online." />
        <meta name="keywords" content="Hamilton airport transfer, international airport shuttle Waikato, New Zealand airport service, HLZ airport transfers, Hamilton international arrivals" />
        <link rel="canonical" href="https://bookaridenz.com/international/hamilton-airport" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Hamilton Airport Transfers
              <span className="block text-gold mt-2">Gateway to the Waikato Region</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Welcome to the Waikato! Professional airport transfer service for international travelers arriving at Hamilton Airport (HLZ). Multi-currency booking, reliable service, and local expertise.
            </p>
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-8 py-6">
                Book Your Transfer Now
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Hamilton Airport Service</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Local Expertise</h3>
              <p className="text-gray-600">Our drivers know the Waikato region intimately. Direct routes to Hamilton CBD, Cambridge, Matamata, and beyond.</p>
            </div>
            <div className="text-center p-6">
              <Plane className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Flight Tracking</h3>
              <p className="text-gray-600">We monitor all incoming flights. Delays or early arrivals - your pickup time adjusts automatically.</p>
            </div>
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Safe & Reliable</h3>
              <p className="text-gray-600">Licensed operators, insured vehicles, and professional drivers ensure your safety and comfort.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Airport Info */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Hamilton Airport (HLZ)</h2>
              <p className="text-gray-700 mb-4">
                Hamilton Airport serves the Waikato region, New Zealand's agricultural heartland. Located just 15km south of Hamilton city center, it's the perfect gateway to explore the region including Hobbiton, Waitomo Caves, and Raglan beaches.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-gold mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Pay in your currency - multiple payment methods accepted</p>
                </div>
                <div className="flex items-start">
                  <Users className="w-5 h-5 text-gold mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Meet & greet service at arrivals</p>
                </div>
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-gold mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">24/7 customer support for international travelers</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">Popular Destinations</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-lg mb-2">Hamilton City Center</h4>
                  <p className="text-gray-600 text-sm mb-2">Distance: ~15 km | Time: 15-20 minutes</p>
                  <p className="text-gold font-semibold">Instant Quote</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-lg mb-2">Cambridge</h4>
                  <p className="text-gray-600 text-sm mb-2">Distance: ~25 km | Time: 25-30 minutes</p>
                  <p className="text-gold font-semibold">Instant Quote</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-lg mb-2">Matamata (Hobbiton)</h4>
                  <p className="text-gray-600 text-sm mb-2">Distance: ~45 km | Time: 40-50 minutes</p>
                  <p className="text-gold font-semibold">Instant Quote</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Airport Shuttle</h3>
              <p className="text-gray-600 mb-4">Shared shuttle service to Hamilton and surrounding areas. Economical and reliable.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Per-kilometer pricing from distance-based</li>
                <li>✓ Competitive rates</li>
                <li>✓ Meet & greet included</li>
                <li>✓ Luggage assistance</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Private Transfer</h3>
              <p className="text-gray-600 mb-4">Exclusive vehicle for your group. Direct transfer with no stops.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Per-kilometer pricing from distance-based</li>
                <li>✓ Competitive rates</li>
                <li>✓ Private vehicle</li>
                <li>✓ Direct to destination</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Attractions */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Explore the Waikato Region</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Hobbiton Movie Set</h3>
              <p className="text-gray-600">Visit the iconic Hobbiton from Lord of the Rings and The Hobbit films. We provide transfers to Matamata.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Waitomo Caves</h3>
              <p className="text-gray-600">Experience the magical glowworm caves. Book your transfer to this world-famous attraction.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-3">Raglan Beaches</h3>
              <p className="text-gray-600">Perfect surf beaches on the west coast. We provide reliable transfers to Raglan and surrounding areas.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-green-900 to-green-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Hamilton Airport Transfer</h2>
          <p className="text-xl text-gray-300 mb-8">Reliable, professional service for international travelers exploring the Waikato.</p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-12 py-6">
              Book Now - Instant Confirmation
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HamiltonAirportInternational;
