import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Route, Clock, Fuel, TrendingUp } from 'lucide-react';

const LiveJourneyVisualizer = ({ pickupAddress, dropoffAddress, distance, duration }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Simulate journey waypoints based on addresses
  const getWaypoints = () => {
    const waypoints = [
      { name: 'Pickup', location: pickupAddress || 'Your Location', icon: MapPin, status: 'start' },
    ];
    
    // Add intermediate points based on common Auckland routes
    if (pickupAddress?.toLowerCase().includes('airport') || dropoffAddress?.toLowerCase().includes('airport')) {
      if (distance > 30) {
        waypoints.push({ name: 'Motorway Junction', location: 'SH1/SH20 Interchange', icon: Route, status: 'waypoint' });
      }
      if (distance > 50) {
        waypoints.push({ name: 'Rest Area', location: 'Bombay Services (optional)', icon: Fuel, status: 'waypoint' });
      }
    }
    
    waypoints.push({ name: 'Drop-off', location: dropoffAddress || 'Destination', icon: Navigation, status: 'end' });
    
    return waypoints;
  };

  const waypoints = getWaypoints();

  useEffect(() => {
    // Animate through waypoints
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % waypoints.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [waypoints.length]);

  if (!pickupAddress || !dropoffAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-200"
    >
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-indigo-600" />
        <span className="font-semibold text-gray-800">Your Journey</span>
      </div>
      
      {/* Journey Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
          <TrendingUp className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{distance ? `${Math.round(distance)} km` : '--'}</p>
          <p className="text-xs text-gray-500">Distance</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
          <Clock className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{duration || `${Math.round((distance || 30) * 1.2)} min`}</p>
          <p className="text-xs text-gray-500">Est. Time</p>
        </div>
        <div className="bg-white rounded-lg p-3 text-center border border-indigo-100">
          <Fuel className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-800">{distance ? `${(distance * 0.08).toFixed(1)}L` : '--'}</p>
          <p className="text-xs text-gray-500">Est. Fuel</p>
        </div>
      </div>
      
      {/* Route Visualization */}
      <div className="bg-white rounded-lg p-4 border border-indigo-100">
        <div className="relative">
          {waypoints.map((waypoint, index) => {
            const IconComponent = waypoint.icon;
            const isActive = index === currentStep;
            const isPast = index < currentStep;
            
            return (
              <div key={index} className="flex items-start gap-3 mb-4 last:mb-0">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive ? 'bg-indigo-600 text-white scale-110 shadow-lg' :
                    isPast ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  {index < waypoints.length - 1 && (
                    <div className={`w-0.5 h-8 transition-colors duration-300 ${
                      isPast ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                
                {/* Content */}
                <div className={`pt-2 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-70'}`}>
                  <p className={`font-semibold ${isActive ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {waypoint.name}
                  </p>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                    {waypoint.location}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        📍 Route visualization is approximate. Actual route may vary based on traffic.
      </p>
    </motion.div>
  );
};

export default LiveJourneyVisualizer;
