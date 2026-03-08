import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock, Shield, CreditCard, Users, Globe, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AucklandAirportInternational = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Auckland Airport Transfers - International Service | Book A Ride NZ</title>
        <meta name="description" content="Professional Auckland Airport transfer service for international travelers. Multi-currency booking, meet & greet service, 24/7 support. Book your New Zealand airport shuttle online." />
        <meta name="keywords" content="Auckland airport transfer, international airport shuttle, New Zealand airport service, AKL airport transfers, Auckland international arrivals" />
        <link rel="canonical" href="https://bookaridenz.com/international/auckland-airport" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Auckland Airport Transfers
              <span className="block text-gold mt-2">International Service</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Welcome to New Zealand! Professional airport transfer service for international travelers arriving at Auckland Airport (AKL). Multi-currency booking, meet & greet service, and 24/7 support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-8 py-6">
                  Book Your Transfer Now
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black text-lg px-8 py-6">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* International Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why International Travelers Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Globe className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Multi-Currency Booking</h3>
              <p className="text-gray-600">Book in your preferred currency. We accept major international payment methods including Visa, Mastercard, and digital wallets.</p>
            </div>
            <div className="text-center p-6">
              <Users className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Meet & Greet Service</h3>
              <p className="text-gray-600">Your driver will meet you at arrivals with a name board, help with luggage, and ensure smooth transfer to your destination.</p>
            </div>
            <div className="text-center p-6">
              <Clock className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
              <p className="text-gray-600">Flight delayed? No problem. We track your flight and adjust pickup time automatically. Customer support available around the clock.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Airport Information */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6">Auckland International Airport (AKL)</h2>
              <p className="text-gray-700 mb-4">
                Auckland Airport is New Zealand's largest and busiest airport, serving as the primary gateway for international travelers. Located 21km south of Auckland city center, the airport handles millions of international passengers annually.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-gold mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Licensed, insured, and professional drivers</p>
                </div>
                <div className="flex items-start">
                  <CreditCard className="w-5 h-5 text-gold mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Secure online payment in multiple currencies</p>
                </div>
                <div className="flex items-start">
                  <Star className="w-5 h-5 text-gold mt-1 mr-3 flex-shrink-0" />
                  <p className="text-gray-700">Rated excellent by international travelers</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6">Popular Destinations from Auckland Airport</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-lg mb-2">Auckland City Center</h4>
                  <p className="text-gray-600 text-sm mb-2">Distance: ~21 km | Time: 25-35 minutes</p>
                  <p className="text-gold font-semibold">Instant Quote</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-lg mb-2">North Shore (Takapuna)</h4>
                  <p className="text-gray-600 text-sm mb-2">Distance: ~35 km | Time: 35-45 minutes</p>
                  <p className="text-gold font-semibold">Instant Quote</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-lg mb-2">Airport Hotels</h4>
                  <p className="text-gray-600 text-sm mb-2">Distance: 2-5 km | Time: 5-10 minutes</p>
                  <p className="text-gold font-semibold">Get instant quote</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our International Services</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Airport Shuttle Service</h3>
              <p className="text-gray-600 mb-4">Shared shuttle service to major destinations. Economical option for solo travelers and small groups.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Per-kilometer pricing starting from distance-based</li>
                <li>✓ Competitive rates</li>
                <li>✓ Comfortable shared ride</li>
                <li>✓ Meet & greet included</li>
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-3">Private Transfer Service</h3>
              <p className="text-gray-600 mb-4">Exclusive private vehicle for your group. Direct transfer to your destination with no stops.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Per-kilometer pricing starting from distance-based</li>
                <li>✓ Competitive rates</li>
                <li>✓ Private vehicle, no sharing</li>
                <li>✓ Direct to destination</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Process */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Simple 3-Step Booking Process</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gold text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3">Enter Your Details</h3>
              <p className="text-gray-600">Provide your flight details, pickup location, and destination. We'll calculate the price instantly.</p>
            </div>
            <div className="text-center">
              <div className="bg-gold text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3">Make Secure Payment</h3>
              <p className="text-gray-600">Pay online using your preferred method. All major credit cards and digital wallets accepted.</p>
            </div>
            <div className="text-center">
              <div className="bg-gold text-black w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3">Meet Your Driver</h3>
              <p className="text-gray-600">Your driver will be waiting at arrivals with a name board. Relax and enjoy your ride!</p>
            </div>
          </div>
          <div className="text-center mt-12">
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-12 py-6">
                Book Auckland Airport Transfer
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Do I need to book in advance?</h3>
              <p className="text-gray-600">While walk-ins are accepted subject to availability, we strongly recommend booking online in advance to guarantee your transfer, especially during peak travel seasons.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">What if my flight is delayed?</h3>
              <p className="text-gray-600">We track all incoming flights automatically. If your flight is delayed, your pickup time will be adjusted accordingly at no extra charge.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Can I pay in my home currency?</h3>
              <p className="text-gray-600">Our online booking system accepts multiple currencies and payment methods including Visa, Mastercard, American Express, and major digital wallets.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">How will I find my driver?</h3>
              <p className="text-gray-600">Your driver will meet you in the arrivals hall holding a sign with your name. You'll receive their contact details via email and SMS before your arrival.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Is there a luggage limit?</h3>
              <p className="text-gray-600">Standard service includes 2 large suitcases and 1 carry-on per passenger. Additional luggage can be accommodated - please mention this when booking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Auckland Airport Transfer?</h2>
          <p className="text-xl text-gray-300 mb-8">Join thousands of international travelers who trust us for reliable, professional airport transfers in New Zealand.</p>
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

export default AucklandAirportInternational;
