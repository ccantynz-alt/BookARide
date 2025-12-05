import React from 'react';
import { Phone } from 'lucide-react';

const CallNowButton = () => {
  const phoneNumber = '+6421745327';
  const displayNumber = '+64 21 745 327';

  return (
    <a
      href={`tel:${phoneNumber}`}
      className="fixed bottom-24 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 group"
      aria-label="Call now"
    >
      <Phone className="w-5 h-5 animate-pulse" />
      <span className="hidden md:inline font-semibold">{displayNumber}</span>
      <span className="md:hidden font-semibold">Call</span>
    </a>
  );
};

export default CallNowButton;