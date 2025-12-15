import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, TrendingDown, Shield, Clock, Star } from 'lucide-react';

const PriceComparison = ({ bookaridePrice, distance }) => {
  // Estimate competitor prices based on distance
  // These are approximate rates for Auckland
  const uberEstimate = Math.round(distance * 2.8 + 8); // Base fare + per km
  const taxiEstimate = Math.round(distance * 3.5 + 5); // Higher per km rate
  
  const savings = Math.max(uberEstimate - bookaridePrice, taxiEstimate - bookaridePrice, 0);
  const savingsPercent = Math.round((savings / Math.max(uberEstimate, taxiEstimate)) * 100);

  if (!bookaridePrice || bookaridePrice <= 0 || !distance) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200"
    >
      {/* Savings Header */}
      {savings > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            <TrendingDown className="w-4 h-4" />
            You Save ${savings}
          </div>
          <span className="text-green-700 text-sm">
            ({savingsPercent}% cheaper than rideshare)
          </span>
        </div>
      )}

      {/* Price Comparison Table */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* BookaRide */}
        <div className="bg-white rounded-lg p-3 border-2 border-gold shadow-sm">
          <div className="text-xs text-gray-500 mb-1">BookaRide</div>
          <div className="text-xl font-bold text-gold">${bookaridePrice}</div>
          <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-1">
            <Check className="w-3 h-3" />
            Fixed Price
          </div>
        </div>

        {/* Uber */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 opacity-75">
          <div className="text-xs text-gray-500 mb-1">Uber*</div>
          <div className="text-xl font-bold text-gray-400 line-through">${uberEstimate}</div>
          <div className="flex items-center justify-center gap-1 text-red-500 text-xs mt-1">
            <X className="w-3 h-3" />
            Surge Pricing
          </div>
        </div>

        {/* Taxi */}
        <div className="bg-white rounded-lg p-3 border border-gray-200 opacity-75">
          <div className="text-xs text-gray-500 mb-1">Taxi*</div>
          <div className="text-xl font-bold text-gray-400 line-through">${taxiEstimate}</div>
          <div className="flex items-center justify-center gap-1 text-red-500 text-xs mt-1">
            <X className="w-3 h-3" />
            Meter Rate
          </div>
        </div>
      </div>

      {/* Why BookaRide */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-gold" />
          <span>No Hidden Fees</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-gold" />
          <span>Always On Time</span>
        </div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-gold" />
          <span>Premium Service</span>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 text-center">
        *Estimates based on standard rates. Actual rideshare/taxi prices may vary due to surge pricing, traffic, and demand.
      </p>
    </motion.div>
  );
};

export default PriceComparison;
