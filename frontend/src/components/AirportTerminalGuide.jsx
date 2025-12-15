import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Car, Coffee, ShoppingBag, Plane, Info, Navigation, Clock, Users } from 'lucide-react';

const AirportTerminalGuide = () => {
  const [selectedArea, setSelectedArea] = useState('arrivals');

  const areas = {
    arrivals: {
      title: 'Arrivals Hall',
      icon: Plane,
      color: 'blue',
      tips: [
        { icon: Navigation, text: 'Exit through Door 8 for shuttle pickup' },
        { icon: MapPin, text: 'Look for driver with your name sign' },
        { icon: Clock, text: 'Allow 15-20 mins to clear customs' },
        { icon: Users, text: 'Meeting point: Outside arrivals, Door 8' }
      ],
      description: 'After collecting your luggage and clearing customs, exit through the main arrivals hall. Your BookaRide driver will be waiting with a sign bearing your name.'
    },
    departures: {
      title: 'Departures',
      icon: Plane,
      color: 'green',
      tips: [
        { icon: Clock, text: 'Arrive 2-3 hours before international flights' },
        { icon: Navigation, text: 'Drop-off zone is directly outside departures' },
        { icon: Info, text: 'Check-in counters are on Level 1' },
        { icon: ShoppingBag, text: 'Duty-free shopping after security' }
      ],
      description: 'For departures, we\'ll drop you at the main entrance. International check-in is on the left, domestic on the right.'
    },
    pickup: {
      title: 'Pickup Zones',
      icon: Car,
      color: 'gold',
      tips: [
        { icon: MapPin, text: 'International: Door 8 (Ground Level)' },
        { icon: MapPin, text: 'Domestic: Door 4 (Ground Level)' },
        { icon: Clock, text: 'We monitor your flight - no rush!' },
        { icon: Info, text: 'Free 30-min wait time included' }
      ],
      description: 'Our drivers park in the designated pickup area and will meet you at the specified door. We track your flight, so even if you\'re delayed, we\'ll be there.'
    },
    amenities: {
      title: 'Airport Amenities',
      icon: Coffee,
      color: 'purple',
      tips: [
        { icon: Coffee, text: 'Cafes & restaurants on all levels' },
        { icon: ShoppingBag, text: 'Duty-free & retail shops available' },
        { icon: Info, text: 'Free WiFi throughout the terminal' },
        { icon: Users, text: 'Family rooms & prayer spaces available' }
      ],
      description: 'Auckland Airport has excellent facilities including cafes, shops, currency exchange, and rest areas. Free WiFi is available throughout.'
    }
  };

  const currentArea = areas[selectedArea];
  const IconComponent = currentArea.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-6 h-6 text-gold" />
        <h3 className="text-xl font-bold text-gray-800">Auckland Airport Guide</h3>
      </div>
      
      {/* Area Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(areas).map(([key, area]) => {
          const AreaIcon = area.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedArea(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedArea === key
                  ? 'bg-gold text-black shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <AreaIcon className="w-4 h-4" />
              {area.title}
            </button>
          );
        })}
      </div>
      
      {/* Selected Area Info */}
      <div className="bg-gray-50 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gold/20`}>
            <IconComponent className="w-6 h-6 text-gold" />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">{currentArea.title}</h4>
            <p className="text-sm text-gray-500">Auckland International Airport</p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">{currentArea.description}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentArea.tips.map((tip, index) => {
            const TipIcon = tip.icon;
            return (
              <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-100">
                <TipIcon className="w-5 h-5 text-gold flex-shrink-0" />
                <span className="text-sm text-gray-700">{tip.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Quick Contact */}
      <div className="mt-4 p-4 bg-gold/10 rounded-lg border border-gold/20">
        <p className="text-sm text-gray-700">
          <strong>📞 Can't find your driver?</strong> Call us at <a href="tel:+6421743321" className="text-gold font-semibold">021 743 321</a> and we'll guide you.
        </p>
      </div>
    </motion.div>
  );
};

export default AirportTerminalGuide;
