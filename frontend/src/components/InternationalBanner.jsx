import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Top-of-page fuel surcharge warning banner.
 * Fixed h-10 (40px) so it aligns perfectly with the Header at top-10.
 * Orange/amber gradient — visible but not jarring.
 */
const InternationalBanner = () => {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-10 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-md flex items-center">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm leading-none font-semibold text-center">
          <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          <span>
            <span className="hidden sm:inline">Fuel prices up </span>
            <span className="font-bold">89% in 29 days</span>
            <span className="hidden md:inline"> &mdash; a fuel surcharge may apply to new bookings</span>
            <span className="md:hidden"> &mdash; surcharge may apply</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default InternationalBanner;
