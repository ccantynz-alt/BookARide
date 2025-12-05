import React from 'react';
import { Globe, Check } from 'lucide-react';

const InternationalBanner = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span className="font-semibold">International Bookings Welcome</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>6 Languages</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>7 Currencies</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Worldwide Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternationalBanner;