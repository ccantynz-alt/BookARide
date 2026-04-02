import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2 } from 'lucide-react'
import api from '../../lib/api'

const SERVICE_TYPES = [
  { value: 'airport-transfer', label: 'Airport Transfer' },
  { value: 'private-transfer', label: 'Private Transfer' },
]

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
  { value: 'pay-on-pickup', label: 'Pay on Pickup' },
]

export default function CreateBookingModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    serviceType: 'airport-transfer',
    name: '',
    email: '',
    phone: '',
    pickupAddress: '',
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    flightNumber: '',
    notes: '',
    paymentMethod: 'card',
    vipAirportPickup: false,
    oversizedLuggage: false,
    bookReturn: false,
    returnDate: '',
    returnTime: '',
  })
  const [pricing, setPricing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [priceLoading, setPriceLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const getPrice = async () => {
    if (!form.pickupAddress || !form.dropoffAddress) return
    setPriceLoading(true)
    try {
      const res = await api.post('/calculate-price', {
        serviceType: form.serviceType,
        pickupAddress: form.pickupAddress,
        dropoffAddress: form.dropoffAddress,
        passengers: parseInt(form.passengers) || 1,
        vipAirportPickup: form.vipAirportPickup,
        oversizedLuggage: form.oversizedLuggage,
        bookReturn: form.bookReturn,
      })
      setPricing(res.data)
    } catch {
      setError('Could not calculate price')
    } finally {
      setPriceLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    if (!form.name || !form.email || !form.pickupAddress || !form.dropoffAddress || !form.date || !form.time) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    try {
      await api.post('/bookings', {
        ...form,
        passengers: form.passengers,
        pricing: pricing || { totalPrice: 0 },
        status: 'confirmed',
        skipNotifications: false,
      })
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Create Booking</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Service Type</label>
              <select
                value={form.serviceType}
                onChange={(e) => handleChange('serviceType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
              >
                {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer Name *" value={form.name} onChange={(v) => handleChange('name', v)} />
              <Field label="Email *" value={form.email} onChange={(v) => handleChange('email', v)} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => handleChange('phone', v)} />
              <Field label="Passengers" value={form.passengers} onChange={(v) => handleChange('passengers', v)} />
            </div>

            <Field label="Pickup Address *" value={form.pickupAddress} onChange={(v) => handleChange('pickupAddress', v)} full />
            <Field label="Drop-off Address *" value={form.dropoffAddress} onChange={(v) => handleChange('dropoffAddress', v)} full />

            <div className="grid grid-cols-2 gap-4">
              <Field label="Date *" value={form.date} onChange={(v) => handleChange('date', v)} type="date" />
              <Field label="Time *" value={form.time} onChange={(v) => handleChange('time', v)} />
              <Field label="Flight Number" value={form.flightNumber} onChange={(v) => handleChange('flightNumber', v)} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                >
                  {PAYMENT_METHODS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.vipAirportPickup} onChange={(e) => handleChange('vipAirportPickup', e.target.checked)} className="accent-gold" />
                VIP Pickup (+$15)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.oversizedLuggage} onChange={(e) => handleChange('oversizedLuggage', e.target.checked)} className="accent-gold" />
                Oversized Luggage (+$25)
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.bookReturn} onChange={(e) => handleChange('bookReturn', e.target.checked)} className="accent-gold" />
                Return Trip
              </label>
            </div>

            {form.bookReturn && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Return Date" value={form.returnDate} onChange={(v) => handleChange('returnDate', v)} type="date" />
                <Field label="Return Time" value={form.returnTime} onChange={(v) => handleChange('returnTime', v)} />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none resize-none"
              />
            </div>

            {/* Get Price */}
            <button
              onClick={getPrice}
              disabled={priceLoading || !form.pickupAddress || !form.dropoffAddress}
              className="w-full py-2 text-sm border border-gold text-gold rounded-lg hover:bg-gold/5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {priceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {priceLoading ? 'Calculating...' : 'Calculate Price'}
            </button>

            {pricing && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span>Distance</span><span>{pricing.distance} km</span></div>
                <div className="flex justify-between"><span>Base Price</span><span>${pricing.basePrice?.toFixed(2)}</span></div>
                {pricing.airportFee > 0 && <div className="flex justify-between"><span>VIP Pickup</span><span>${pricing.airportFee?.toFixed(2)}</span></div>}
                {pricing.oversizedLuggageFee > 0 && <div className="flex justify-between"><span>Oversized Luggage</span><span>${pricing.oversizedLuggageFee?.toFixed(2)}</span></div>}
                {pricing.passengerFee > 0 && <div className="flex justify-between"><span>Extra Passengers</span><span>${pricing.passengerFee?.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Processing Fee</span><span>${pricing.stripeFee?.toFixed(2)}</span></div>
                <hr className="border-gray-200" />
                <div className="flex justify-between font-bold text-gold"><span>Total</span><span>${pricing.totalPrice?.toFixed(2)} NZD</span></div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gold text-white rounded-lg hover:bg-gold-600 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Booking
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function Field({ label, value, onChange, type = 'text', full = false }) {
  return (
    <div className={full ? '' : ''}>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
      />
    </div>
  )
}
