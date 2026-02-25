import React from 'react';
import { Globe, Check } from 'lucide-react';

const InternationalBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gray-900 border-b border-gold/20 text-white py-2 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gold" />
            <span className="font-semibold">International Bookings Welcome</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs text-white/80">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-gold" />
              <span>6 Languages</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-gold" />
              <span>7 Currencies</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-gold" />
              <span>Worldwide Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternationalBanner;