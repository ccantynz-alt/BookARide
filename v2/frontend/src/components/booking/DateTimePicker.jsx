import { cn } from '../../lib/cn'
import { Calendar, Clock } from 'lucide-react'

// Generate time slots from 00:00 to 23:30 in 30-min intervals
const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

export default function DateTimePicker({
  dateLabel = 'Pickup Date',
  timeLabel = 'Pickup Time',
  date,
  time,
  onDateChange,
  onTimeChange,
  minDate,
}) {
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{dateLabel}</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            min={minDate || today}
            className={cn(
              'w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm',
              'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold',
              'transition-colors',
              !date && 'text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{timeLabel}</label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          <select
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className={cn(
              'w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm appearance-none',
              'focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold',
              'transition-colors bg-white',
              !time && 'text-gray-400'
            )}
          >
            <option value="">Select time</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
