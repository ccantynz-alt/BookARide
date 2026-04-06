import React, { useState } from 'react';
import { Fuel, X } from 'lucide-react';

/**
 * Fuel Surcharge Notice — sits BELOW the header at top-[104px].
 * (InternationalBanner h-10 + Header ~64px = 104px)
 *
 * NZ diesel prices have surged ~85% in 28 days. This banner warns
 * customers that a temporary fuel surcharge may apply.
 *
 * Visibility requirements (per owner request 2026-04-07):
 * - Text must be CLEARLY readable (text-base, font-semibold, white on amber)
 * - Banner must be tall enough to fit one line on desktop without crowding
 * - Dismissible via the X button (state stored in component, resets on reload)
 *
 * DO NOT add a second fuel surcharge banner anywhere in the app.
 * If you need to change the fuel message, edit this file. There must be
 * exactly ONE fuel surcharge banner in the codebase.
 */
const FuelSurchargeBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <>
      {/* Fixed banner BELOW header (InternationalBanner 40px + Header ~64px = ~104px) */}
      <div className="fixed top-[104px] left-0 right-0 z-40 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white py-3 shadow-lg border-b border-amber-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 relative pr-10">
            <Fuel className="w-5 h-5 md:w-6 md:h-6 text-white flex-shrink-0 drop-shadow" strokeWidth={2.5} />
            <p className="text-center text-sm md:text-base font-semibold leading-tight">
              <span className="font-bold uppercase tracking-wide">Fuel Surcharge Notice</span>
              <span className="mx-2 hidden sm:inline opacity-60">|</span>
              <span className="hidden sm:inline">
                Diesel up 85% in 28 days &mdash; a temporary fuel surcharge applies to cover increased costs for our drivers.
              </span>
              <span className="sm:hidden block text-xs mt-1 font-medium opacity-95">
                Diesel up 85% in 28 days &mdash; surcharge applies
              </span>
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-amber-700/50 rounded-md transition-colors flex-shrink-0"
              aria-label="Dismiss fuel surcharge notice"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      {/* Spacer to push page content below the fixed banner */}
      <div className="h-14 md:h-12" aria-hidden="true" />
    </>
  );
};

export default FuelSurchargeBanner;
