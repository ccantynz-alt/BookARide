import React from 'react';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallNowButton = () => {
  return (
    <Link
      to="/book-now"
      className="fixed bottom-24 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-gold hover:bg-gold/90 text-black rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 group"
      aria-label="Book now"
    >
      <Calendar className="w-5 h-5" />
      <span className="hidden md:inline font-semibold">Book Now</span>
      <span className="md:hidden font-semibold">Book</span>
    </Link>
  );
};

export default CallNowButton;
