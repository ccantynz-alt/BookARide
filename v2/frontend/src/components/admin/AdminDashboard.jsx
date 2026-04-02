import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CalendarCheck, Trash2, Archive, Users,
  LogOut, RefreshCw, Loader2, DollarSign, Clock, CheckCircle,
  XCircle, AlertCircle, Mail, Send, MoreHorizontal,
  Edit3, Plus
} from 'lucide-react'
import api from '../../lib/api'

const EditBookingModal = lazy(() => import('./EditBookingModal'))
const CreateBookingModal = lazy(() => import('./CreateBookingModal'))

const TABS = [
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'deleted', label: 'Deleted', icon: Trash2 },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'customers', label: 'Customers', icon: Users },
]

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const PAYMENT_COLORS = {
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-orange-100 text-orange-800',
}

function StatCard({ label, value, icon: Icon, color = 'text-gold' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color} opacity-50`} />
      </div>
    </div>
  )
}

function Badge({ children, className }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  )
}

function BookingRow({ booking, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const d = booking.data || booking
  const name = d.name || 'Customer'
  const ref = d.referenceNumber || d.id?.slice(0, 8)
  const status = d.status || 'pending'
  const payStatus = d.payment_status || 'unpaid'

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-mono font-bold text-gold">#{ref}</td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{name}</div>
        <div className="text-xs text-gray-500">{d.email}</div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{d.date}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{d.time}</td>
      <td className="px-4 py-3">
        <div className="text-xs text-gray-600 truncate max-w-[160px]" title={d.pickupAddress}>{d.pickupAddress}</div>
        <div className="text-xs text-gray-400 truncate max-w-[160px]" title={d.dropoffAddress}>&rarr; {d.dropoffAddress}</div>
      </td>
      <td className="px-4 py-3"><Badge className={STATUS_COLORS[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge></td>
      <td className="px-4 py-3"><Badge className={PAYMENT_COLORS[payStatus] || 'bg-gray-100 text-gray-800'}>{payStatus === 'paid' ? 'PAID' : payStatus}</Badge></td>
      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
        {d.totalPrice ? `$${Number(d.totalPrice).toFixed(2)}` : '-'}
      </td>
      <td className="px-4 py-3 relative">
        <button
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
          className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer min-w-[36px]"
        >
          <MoreHorizontal className="w-4 h-4 text-gray-500" />
        </button>
        {menuOpen && (
          <div className="absolute right-4 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 w-48">
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('edit', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <Edit3 className="w-4 h-4 text-gray-500" /> Edit
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('confirm', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <CheckCircle className="w-4 h-4 text-blue-500" /> Confirm
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('complete', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <CheckCircle className="w-4 h-4 text-green-500" /> Complete
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('cancel', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <XCircle className="w-4 h-4 text-red-500" /> Cancel
            </button>
            <hr className="my-1 border-gray-100" />
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('resend-confirmation', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <Mail className="w-4 h-4 text-gray-500" /> Resend Confirmation
            </button>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('resend-payment', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
              <Send className="w-4 h-4 text-gray-500" /> Resend Payment Link
            </button>
            <hr className="my-1 border-gray-100" />
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAction('delete', booking) }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function BookingsTable({ bookings, onAction, loading, emptyMessage = 'No bookings found' }) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading bookings...</p>
      </div>
    )
  }

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => {
            const d = b.data || b
            return <BookingRow key={d.id || d.referenceNumber} booking={b} onAction={onAction} />
          })}
        </tbody>
      </table>
    </div>
  )
}

function CustomersTable({ customers, loading }) {
  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" /></div>
  }
  if (!customers || customers.length === 0) {
    return <div className="text-center py-12 text-gray-400">No customers found</div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Booking</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.email} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{c.name || '-'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.phone || '-'}</td>
              <td className="px-4 py-3 text-sm font-semibold">{c.total_bookings}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gold">${c.total_spent?.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{c.last_booking || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('bookings')
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [deletedBookings, setDeletedBookings] = useState([])
  const [archivedBookings, setArchivedBookings] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [editBooking, setEditBooking] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/bookings'),
      ])
      setStats(statsRes.data)
      setBookings(bookingsRes.data.bookings || [])
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/admin/login')
        return
      }
      showToast('Failed to load dashboard', 'error')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      navigate('/admin/login')
      return
    }
    loadDashboard()
  }, [loadDashboard, navigate])

  const loadTab = async (tab) => {
    setActiveTab(tab)
    try {
      if (tab === 'deleted' && deletedBookings.length === 0) {
        const res = await api.get('/admin/deleted-bookings')
        setDeletedBookings(res.data.bookings || [])
      } else if (tab === 'archive' && archivedBookings.length === 0) {
        const res = await api.get('/admin/archived-bookings')
        setArchivedBookings(res.data.bookings || [])
      } else if (tab === 'customers' && customers.length === 0) {
        const res = await api.get('/admin/customers')
        setCustomers(res.data.customers || [])
      }
    } catch {
      showToast(`Failed to load ${tab}`, 'error')
    }
  }

  const handleAction = async (action, booking) => {
    const d = booking.data || booking
    const id = d.id
    if (!id) return

    if (action === 'edit') {
      setEditBooking(booking)
      return
    }

    setActionLoading(true)
    try {
      if (action === 'confirm') {
        await api.post(`/admin/bookings/${id}/status`, { status: 'confirmed' })
        showToast('Booking confirmed')
      } else if (action === 'complete') {
        await api.post(`/admin/bookings/${id}/status`, { status: 'completed' })
        showToast('Booking completed')
      } else if (action === 'cancel') {
        await api.post(`/admin/bookings/${id}/status`, { status: 'cancelled' })
        showToast('Booking cancelled')
      } else if (action === 'delete') {
        await api.delete(`/bookings/${id}`)
        showToast('Booking deleted')
      } else if (action === 'resend-confirmation') {
        await api.post(`/admin/bookings/${id}/resend-confirmation`)
        showToast('Confirmation email sent')
      } else if (action === 'resend-payment') {
        await api.post(`/admin/bookings/${id}/resend-payment-link`)
        showToast('Payment link sent')
      } else if (action === 'restore') {
        await api.post(`/bookings/${id}/restore`)
        showToast('Booking restored')
      }
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Action failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    navigate('/admin/login')
  }

  const sortedBookings = [...bookings].sort((a, b) => {
    const da = (a.data || a).date || ''
    const db_ = (b.data || b).date || ''
    return db_.localeCompare(da)
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-gold" />
            <h1 className="font-bold text-gray-900">BookARide <span className="text-gold">Admin</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-sm text-gray-500">{localStorage.getItem('admin_user')}</span>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer" title="Logout">
              <LogOut className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard label="Total Bookings" value={stats.total_bookings} icon={CalendarCheck} color="text-gold" />
            <StatCard label="Today" value={stats.todays_bookings} icon={Clock} color="text-blue-600" />
            <StatCard label="Pending" value={stats.pending} icon={AlertCircle} color="text-yellow-600" />
            <StatCard label="Confirmed" value={stats.confirmed} icon={CheckCircle} color="text-blue-600" />
            <StatCard label="Completed" value={stats.completed} icon={CheckCircle} color="text-green-600" />
            <StatCard label="Revenue" value={`$${stats.total_revenue?.toLocaleString()}`} icon={DollarSign} color="text-gold" />
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 flex overflow-x-auto items-center">
            <button
              onClick={() => setShowCreate(true)}
              className="ml-auto mr-3 px-3 py-1.5 text-sm bg-gold text-white rounded-lg hover:bg-gold-600 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> New Booking
            </button>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => loadTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  activeTab === id
                    ? 'border-gold text-gold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'bookings' && (
              <BookingsTable
                bookings={sortedBookings}
                onAction={handleAction}
                loading={loading}
                emptyMessage="No active bookings"
              />
            )}

            {activeTab === 'deleted' && (
              <BookingsTable
                bookings={deletedBookings}
                onAction={(action, b) => handleAction('restore', b)}
                loading={false}
                emptyMessage="No deleted bookings"
              />
            )}

            {activeTab === 'archive' && (
              <BookingsTable
                bookings={archivedBookings}
                onAction={() => {}}
                loading={false}
                emptyMessage="No archived bookings"
              />
            )}

            {activeTab === 'customers' && (
              <CustomersTable customers={customers} loading={false} />
            )}

          </div>
        </div>
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
        {editBooking && (
          <EditBookingModal
            booking={editBooking}
            onClose={() => setEditBooking(null)}
            onSaved={loadDashboard}
          />
        )}
        {showCreate && (
          <CreateBookingModal
            onClose={() => setShowCreate(false)}
            onCreated={loadDashboard}
          />
        )}
      </Suspense>
    </div>
  )
}
