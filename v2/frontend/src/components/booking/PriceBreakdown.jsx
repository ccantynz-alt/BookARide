import { motion } from 'framer-motion'
import { DollarSign, CreditCard } from 'lucide-react'

export default function PriceBreakdown({ pricing, bookReturn }) {
  if (!pricing) return null

  const rows = [
    { label: `Base fare (${pricing.distance.toFixed(1)} km)`, amount: pricing.basePrice },
    pricing.airportFee > 0 && { label: 'VIP Airport Pickup', amount: pricing.airportFee },
    pricing.oversizedLuggageFee > 0 && { label: 'Oversized Luggage', amount: pricing.oversizedLuggageFee },
    pricing.passengerFee > 0 && { label: 'Extra passengers', amount: pricing.passengerFee },
  ].filter(Boolean)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-xl p-5 border border-gray-200"
    >
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-gold" />
        Price Breakdown {bookReturn && '(Return Trip)'}
      </h3>

      <div className="space-y-2 mb-3">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{row.label}</span>
            <span className="text-gray-700">${row.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="text-gray-700">${pricing.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5" /> Card processing
          </span>
          <span className="text-gray-700">${pricing.stripeFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
          <span className="text-gray-900">Total</span>
          <span className="text-gold">${pricing.totalPrice.toFixed(2)} NZD</span>
        </div>
      </div>
    </motion.div>
  )
}
