import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, Bus, Calendar, DollarSign, MapPin, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';

const GroupBookings = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Group Airport Transfers NZ | Tours & Events Transport</title>
        <meta name="description" content="Group airport transfer services in New Zealand. Perfect for tours, conferences, weddings, and corporate events. Vehicles for 8-50+ passengers." />
        <meta name="keywords" content="group airport transfers, tour transport NZ, conference shuttle, wedding transport, event transport Auckland" />
        <link rel="canonical" href="https://bookaridenz.com/international/group-bookings" />
      </Helmet>

      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Group Airport Transfers
              <span className="block text-gold mt-2">Tours, Events & Large Groups</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Transporting groups of 8 to 50+ passengers. Perfect for tour groups, conferences, weddings, sports teams, and corporate events.
            </p>
            <Link to="/contact">
              <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-8 py-6">
                Request Group Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Perfect for Every Group</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Users className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Tour Groups</h3>
              <p className="text-gray-600">International tour operators and travel agents. Reliable transfers for your clients throughout New Zealand.</p>
            </div>
            <div className="text-center p-6">
              <Calendar className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Conferences & Events</h3>
              <p className="text-gray-600">Shuttle services for conferences, conventions, and corporate events. Multiple pickups and drop-offs coordinated.</p>
            </div>
            <div className="text-center p-6">
              <Bus className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Sports & School Groups</h3>
              <p className="text-gray-600">Teams, school groups, and educational tours. Safe, reliable transport with experienced drivers.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Vehicle Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Minivan (8-11 Passengers)</h3>
              <p className="text-gray-600 mb-4">Perfect for small groups, families, or executive teams.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ 8-11 passenger capacity</li>
                <li>✓ Air conditioning</li>
                <li>✓ Luggage space</li>
                <li>✓ From $3.50/km</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-gold">
              <div className="bg-gold text-black text-xs font-bold px-2 py-1 rounded inline-block mb-3">POPULAR</div>
              <h3 className="text-xl font-semibold mb-4">Mini Coach (12-24 Passengers)</h3>
              <p className="text-gray-600 mb-4">Ideal for medium-sized groups and tour parties.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ 12-24 passenger capacity</li>
                <li>✓ Climate control</li>
                <li>✓ Underfloor luggage storage</li>
                <li>✓ Request custom quote</li>
              </ul>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Full Coach (25-50+ Passengers)</h3>
              <p className="text-gray-600 mb-4">Large groups, conferences, and major events.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ 25-50+ passenger capacity</li>
                <li>✓ Premium comfort</li>
                <li>✓ Large luggage capacity</li>
                <li>✓ Request custom quote</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Group Booking Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <DollarSign className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Volume Discounts</h3>
                <p className="text-gray-600">Special rates for large groups and multiple bookings. Contact us for custom pricing.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Multiple Stops</h3>
                <p className="text-gray-600">Pick up from multiple locations or drop off at various destinations within your itinerary.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Calendar className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Advance Booking</h3>
                <p className="text-gray-600">Book weeks or months in advance. Guaranteed availability for your group.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Dedicated Coordinator</h3>
                <p className="text-gray-600">Assigned coordinator for your group booking. Direct contact for all changes and updates.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">How Group Bookings Work</h2>
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gold text-black w-10 h-10 rounded-full flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-semibold">Contact Us</h3>
              </div>
              <p className="text-gray-600 ml-14">Provide your group size, dates, pickup/dropoff locations, and any special requirements.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gold text-black w-10 h-10 rounded-full flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-semibold">Receive Custom Quote</h3>
              </div>
              <p className="text-gray-600 ml-14">We'll prepare a detailed quote based on your needs, including vehicle options and pricing.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="bg-gold text-black w-10 h-10 rounded-full flex items-center justify-center font-bold">3</div>
                <h3 className="text-xl font-semibold">Confirm Booking</h3>
              </div>
              <p className="text-gray-600 ml-14">Once approved, we'll confirm your booking and assign vehicles and drivers for your group.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Group Transfer?</h2>
          <p className="text-xl text-gray-300 mb-8">Get a custom quote for your group. No obligation, fast response.</p>
          <Link to="/contact">
            <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-12 py-6">
              Request Group Quote Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default GroupBookings;