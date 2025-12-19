import React, { useState } from 'react';
import FlightTracker from '../components/FlightTracker';
import { Plane, Clock, Bell, MapPin } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import PageBreadcrumb from '../components/PageBreadcrumb';
import SEO from '../components/SEO';
import { FAQSchema } from '../components/SchemaMarkup';

const FlightTrackerPage = () => {
  const [flightNumber, setFlightNumber] = useState('');
  const [showTracker, setShowTracker] = useState(false);

  const handleTrack = () => {
    if (flightNumber.length >= 3) {
      setShowTracker(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <PageBreadcrumb items={[{ label: 'Flight Tracker' }]} />
      
      {/* Hero Section with Air New Zealand Plane */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        {/* Stunning Aircraft Background */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1529074963764-98f45c47344b?auto=format&fit=crop&w=1920&q=80" 
            alt="Commercial aircraft taking off" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/60 to-gray-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
              <Plane className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-sm">REAL-TIME FLIGHT TRACKING</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Track Your <span className="text-gold">Flight</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8">
              Enter your flight number and we'll show you real-time status updates. 
              When you book with us, we automatically monitor your flight and adjust pickup times if needed.
            </p>

            {/* Flight Search */}
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Enter flight number (e.g., NZ123, EK448)"
                  value={flightNumber}
                  onChange={(e) => {
                    setFlightNumber(e.target.value.toUpperCase());
                    setShowTracker(false);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                  className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400 text-lg py-6"
                />
                <Button 
                  onClick={handleTrack}
                  disabled={flightNumber.length < 3}
                  className="bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-6"
                >
                  Track
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flight Tracker Results */}
      {showTracker && flightNumber.length >= 3 && (
        <section className="py-12 bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <FlightTracker 
                flightNumber={flightNumber}
                showInline={true}
              />
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Why We Track Your Flight
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700 hover:border-gold/50 transition-colors">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Real-Time Updates</h3>
              <p className="text-gray-400">
                We monitor your flight status continuously and adjust your pickup time automatically if your flight is delayed.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700 hover:border-gold/50 transition-colors">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Driver Notifications</h3>
              <p className="text-gray-400">
                Your driver is automatically notified of any changes, so they're always ready when you land.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700 hover:border-gold/50 transition-colors">
              <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Meet & Greet</h3>
              <p className="text-gray-400">
                No waiting around. Your driver will be at the arrivals area with a sign bearing your name.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Book Your Airport Transfer?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get an instant quote and enjoy stress-free travel with flight tracking included.
          </p>
          <a href="/book-now">
            <Button className="bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-6 text-lg">
              Book Your Ride Now
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
};

export default FlightTrackerPage;
