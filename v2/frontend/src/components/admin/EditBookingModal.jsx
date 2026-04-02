import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Loader2 } from 'lucide-react'
import api from '../../lib/api'

const STATUS_OPTIONS = ['pending', 'confirmed', 'completed', 'cancelled']
const PAYMENT_OPTIONS = ['unpaid', 'paid', 'pay-on-pickup', 'cash', 'bank-transfer']

export default function EditBookingModal({ booking, onClose, onSaved }) {
  const d = booking?.data || booking
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (d) {
      setForm({
        name: d.name || '',
        email: d.email || '',
        phone: d.phone || '',
        date: d.date || '',
        time: d.time || '',
        pickupAddress: d.pickupAddress || '',
        dropoffAddress: d.dropoffAddress || '',
        passengers: d.passengers || '1',
        status: d.status || 'pending',
        payment_status: d.payment_status || 'unpaid',
        notes: d.notes || '',
        flightNumber: d.flightNumber || d.departureFlightNumber || '',
        assignedDriver: d.assignedDriver || '',
      })
    }
  }, [d])

  if (!booking) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setError('')
    setLoading(true)
    try {
      await api.patch(`/bookings/${d.id}`, form)
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update booking')
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
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">Edit Booking #{d.referenceNumber || d.id?.slice(0, 8)}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" value={form.name} onChange={(v) => handleChange('name', v)} />
              <Field label="Email" value={form.email} onChange={(v) => handleChange('email', v)} type="email" />
              <Field label="Phone" value={form.phone} onChange={(v) => handleChange('phone', v)} />
              <Field label="Passengers" value={form.passengers} onChange={(v) => handleChange('passengers', v)} />
              <Field label="Date" value={form.date} onChange={(v) => handleChange('date', v)} type="date" />
              <Field label="Time" value={form.time} onChange={(v) => handleChange('time', v)} />
              <Field label="Flight Number" value={form.flightNumber} onChange={(v) => handleChange('flightNumber', v)} />
              <Field label="Assigned Driver" value={form.assignedDriver} onChange={(v) => handleChange('assignedDriver', v)} />
            </div>

            <Field label="Pickup Address" value={form.pickupAddress} onChange={(v) => handleChange('pickupAddress', v)} full />
            <Field label="Drop-off Address" value={form.dropoffAddress} onChange={(v) => handleChange('dropoffAddress', v)} full />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Payment</label>
                <select
                  value={form.payment_status}
                  onChange={(e) => handleChange('payment_status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none"
                >
                  {PAYMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold/30 focus:border-gold outline-none resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm bg-gold text-white rounded-lg hover:bg-gold-600 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

function Field({ label, value, onChange, type = 'text', full = false }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
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
