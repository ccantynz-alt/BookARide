import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Clock } from 'lucide-react';

const SocialProofCounter = ({ variant = 'default' }) => {
  const [bookingsToday, setBookingsToday] = useState(12);
  const [viewingNow, setViewingNow] = useState(3);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Randomly increment bookings
      if (Math.random() > 0.7) {
        setBookingsToday(prev => prev + 1);
      }
      // Fluctuate viewers
      setViewingNow(Math.floor(Math.random() * 5) + 2);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1 text-green-600">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {viewingNow} viewing now
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-600">
          {bookingsToday} booked today
        </span>
      </div>
    );
  }

  if (variant === 'urgency') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-orange-800">
            High demand for this route!
          </p>
          <p className="text-xs text-orange-600">
            {viewingNow} people viewing • {bookingsToday} booked today
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-gray-900 text-white rounded-xl p-4">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gold">{bookingsToday}</div>
          <div className="text-xs text-gray-400">Booked today</div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-2xl font-bold text-green-400">{viewingNow}</span>
          </div>
          <div className="text-xs text-gray-400">Viewing now</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gold">127+</div>
          <div className="text-xs text-gray-400">Happy customers</div>
        </div>
      </div>
    </div>
  );
};

export default SocialProofCounter;
