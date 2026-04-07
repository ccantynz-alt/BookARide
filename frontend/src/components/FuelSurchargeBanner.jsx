import React, { useState } from 'react';
import { Fuel, X } from 'lucide-react';

/**
 * Fuel Surcharge Notice — sits BELOW the header at top-[96px].
 *
 * Header height = py-4 (16px) + h-16 logo (64px) + py-4 (16px) = 96px.
 * So the banner starts at top-[96px], FLUSH with the bottom of the header.
 *
 * NZ diesel prices have surged ~85% in 28 days. This banner warns
 * customers that a temporary fuel surcharge may apply.
 *
 * Visibility requirements (per owner request 2026-04-07):
 * - Text must be CLEARLY readable — text-base on mobile, text-lg on desktop
 * - Bright amber/orange gradient with white text and a thick border-bottom
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
      {/* Fixed banner immediately below the 96px Header */}
      <div className="fixed top-[96px] left-0 right-0 z-40 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white py-3.5 shadow-lg border-b-2 border-amber-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-3 relative pr-10">
            <Fuel className="w-6 h-6 md:w-7 md:h-7 text-white flex-shrink-0 drop-shadow" strokeWidth={2.5} />
            <p className="text-center text-base md:text-lg font-bold leading-tight">
              <span className="uppercase tracking-wide">Fuel Surcharge Notice</span>
              <span className="mx-2 hidden sm:inline opacity-70">|</span>
              <span className="hidden sm:inline font-semibold">
                Diesel up 85% in 28 days &mdash; a temporary fuel surcharge applies to cover increased costs for our drivers.
              </span>
              <span className="sm:hidden block text-xs mt-1 font-medium opacity-95">
                Diesel up 85% in 28 days &mdash; surcharge applies
              </span>
            </p>
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 hover:bg-amber-700/60 rounded-md transition-colors flex-shrink-0"
              aria-label="Dismiss fuel surcharge notice"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      {/* Spacer to push page content below the fixed banner.
          Banner height = py-3.5 (28px) + text + border = ~60-65px on desktop,
          ~75px on mobile (text wraps to 2 lines). */}
      <div className="h-[60px] md:h-[58px]" aria-hidden="true" />
    </>
  );
};

export default FuelSurchargeBanner;
