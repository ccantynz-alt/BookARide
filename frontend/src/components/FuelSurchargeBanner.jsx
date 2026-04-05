import React, { useState } from 'react';
import { Fuel, X } from 'lucide-react';

const FuelSurchargeBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      {/* Fixed banner below header (InternationalBanner ~40px + Header ~64px = ~104px) */}
      <div className="fixed top-[104px] left-0 right-0 z-40 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white py-2.5 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-sm relative pr-8">
            <Fuel className="w-5 h-5 text-white flex-shrink-0" />
            <p className="text-center">
              <span className="font-bold">Fuel Surcharge Notice</span>
              <span className="mx-2 hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Diesel has surged from $1.85/L to $3.43/L in just 28 days — an 85% increase.
                A temporary fuel surcharge applies to all bookings to cover increased costs for our drivers.
              </span>
              <span className="sm:hidden block text-xs mt-0.5 font-normal">
                Diesel up 85% ($1.85 to $3.43/L in 28 days). Temporary surcharge applied.
              </span>
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 hover:bg-amber-700 rounded transition-colors flex-shrink-0"
              aria-label="Dismiss fuel surcharge notice"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Spacer to push page content below the fixed banner */}
      <div className="h-11" aria-hidden="true" />
    </>
  );
};

export default FuelSurchargeBanner;
