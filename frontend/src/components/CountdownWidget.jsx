import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, MapPin, Car } from 'lucide-react';

const CountdownWidget = ({ bookingDate, bookingTime, pickupLocation }) => {
  const [timeLeft, setTimeLeft] = useState({});
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!bookingDate || !bookingTime) return;

    const calculateTimeLeft = () => {
      // Parse the booking date and time
      const [year, month, day] = bookingDate.split('-').map(Number);
      const [hours, minutes] = bookingTime.split(':').map(Number);
      
      const bookingDateTime = new Date(year, month - 1, day, hours, minutes);
      const now = new Date();
      const difference = bookingDateTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        return {};
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutesLeft = Math.floor((difference / 1000 / 60) % 60);
      const secondsLeft = Math.floor((difference / 1000) % 60);

      return { days, hours: hoursLeft, minutes: minutesLeft, seconds: secondsLeft };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingDate, bookingTime]);

  if (!bookingDate || !bookingTime) return null;

  if (isExpired) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-green-700">Your ride is NOW! 🎉</p>
            <p className="text-sm text-green-600">Your driver should be arriving</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const TimeBox = ({ value, label }) => (
    <div className="bg-white rounded-lg p-3 border border-orange-100 text-center min-w-[60px]">
      <p className="text-2xl font-bold text-orange-600">{String(value).padStart(2, '0')}</p>
      <p className="text-[10px] text-gray-500 uppercase">{label}</p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-orange-600" />
        <span className="font-semibold text-gray-800">Countdown to Your Ride</span>
      </div>
      
      <div className="flex justify-center gap-2 mb-4">
        {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="Days" />}
        <TimeBox value={timeLeft.hours} label="Hours" />
        <TimeBox value={timeLeft.minutes} label="Mins" />
        <TimeBox value={timeLeft.seconds} label="Secs" />
      </div>
      
      <div className="bg-white rounded-lg p-3 border border-orange-100">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>{bookingDate} at {bookingTime}</span>
        </div>
        {pickupLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <MapPin className="w-4 h-4 text-orange-500" />
            <span className="truncate">{pickupLocation}</span>
          </div>
        )}
      </div>
      
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        ✨ We're excited to see you! Your driver will contact you before pickup.
      </p>
    </motion.div>
  );
};

export default CountdownWidget;
