import React from 'react';
import { Mail, RefreshCw, XCircle, Square, CheckSquare, Phone, Plane, ArrowRight, CreditCard, ChevronLeft, ChevronRight, AlertTriangle, Send, Pencil } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatDate, isToday, isTomorrow } from '../../utils/dateFormat';

const BookingsTable = ({
  bookings,
  loading,
  totalBookings,
  selectedBookings,
  onSelectBooking,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onViewDetails,
  onEditBooking,
  onResendConfirmation,
  onSendToAdmin,
  onDeleteBooking,
  onStatusUpdate,
  onSendPaymentLink,
  dateFrom,
  dateTo,
  searchTerm,
  statusFilter,
  onClearFilters,
  onOpenDeletedTab,
  onRestoreFromServer,
  restoringFromServerBackup,
  loadAllBookings,
  onLoadAll,
  currentPage = 1,
  bookingsPerPage = 50,
  onPageChange,
}) => {
  const totalPages = bookingsPerPage > 0 ? Math.ceil(totalBookings / bookingsPerPage) : 1;
  const safeSelected = selectedBookings instanceof Set ? selectedBookings : new Set();

  if (loading) {
    return (
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5">
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-slate-400 font-medium tracking-wide">Loading bookings</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    const hasFilters = dateFrom || dateTo || searchTerm || (statusFilter && statusFilter !== 'all');
    return (
      <div className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/5 p-16 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6">
          <ArrowRight className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-800 font-semibold text-xl">{totalBookings > 0 ? 'No results' : 'No bookings yet'}</p>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          {totalBookings > 0 ? 'Try adjusting your search or filters' : 'Bookings will appear here once customers start booking'}
        </p>
        {totalBookings > 0 && hasFilters && (
          <button onClick={onClearFilters} className="mt-6 text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-600 transition-colors">
            Clear all filters
          </button>
        )}
        {totalBookings === 0 && (
          <div className="mt-8 flex gap-3 justify-center">
            <button onClick={onOpenDeletedTab} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors underline underline-offset-4">Check deleted</button>
            <button onClick={onRestoreFromServer} disabled={restoringFromServerBackup} className="text-sm font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
              Restore from backup
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-lg shadow-black/5 overflow-hidden">
      {/* Bulk action bar */}
      {safeSelected.size > 0 && (
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
          <span className="text-sm font-medium">{safeSelected.size} selected</span>
          <div className="flex gap-3 items-center">
            <button onClick={onClearSelection} className="text-sm text-white/60 hover:text-white transition-colors">Deselect</button>
            <button onClick={onBulkDelete} className="text-sm font-medium bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg transition-colors">
              Delete selected
            </button>
          </div>
        </div>
      )}

      {/* Active filter warning — tells admin WHY bookings look missing */}
      {statusFilter && statusFilter !== 'all' && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              Filter active — showing <span className="uppercase">{statusFilter.replace('_', ' ')}</span> only. Other bookings are hidden.
            </span>
          </div>
          <button
            onClick={onClearFilters}
            className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Show all bookings
          </button>
        </div>
      )}
      {searchTerm && (
        <div className="bg-blue-50 border-b border-blue-200 px-5 py-2.5 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-blue-800">
            Search active — showing results for "{searchTerm}"
          </span>
          <button
            onClick={onClearFilters}
            className="text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-300 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="w-12 px-4 py-4">
                <button
                  onClick={() => safeSelected.size === bookings.length ? onClearSelection() : onSelectAll()}
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
                >
                  {safeSelected.size === bookings.length && bookings.length > 0
                    ? <CheckSquare className="w-4 h-4 text-slate-900" />
                    : <Square className="w-4 h-4 text-slate-300" />}
                </button>
              </th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Booking</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Customer</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest hidden xl:table-cell">Route</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Payment</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="text-left px-4 py-4 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => {
              const hasReturn = booking.returnDate && booking.returnTime;
              const today = isToday(booking.date);
              const tomorrow = isTomorrow(booking.date);
              const flightNum = booking.flightNumber || booking.flightArrivalNumber || booking.arrivalFlightNumber || booking.flightDepartureNumber || booking.departureFlightNumber || '';

              return (
                <tr
                  key={booking.id}
                  onClick={() => onViewDetails(booking)}
                  className={`group border-b border-slate-50 cursor-pointer transition-all duration-150
                    ${safeSelected.has(booking.id) ? 'bg-slate-50' : 'hover:bg-slate-50/60'}
                    ${hasReturn ? 'border-r-4 border-r-violet-400' : ''}
                  `}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectBooking(booking.id)}
                      className="p-1 rounded hover:bg-slate-100 transition-colors"
                    >
                      {safeSelected.has(booking.id)
                        ? <CheckSquare className="w-4 h-4 text-slate-900" />
                        : <Square className="w-4 h-4 text-slate-200 group-hover:text-slate-300" />}
                    </button>
                  </td>

                  {/* Booking */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {/* Time pill */}
                      <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 min-h-[40px] ${
                        today ? 'bg-slate-900' : tomorrow ? 'bg-amber-400' : 'bg-slate-200'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 tracking-tight">#{booking.referenceNumber || booking.id?.slice(0, 5)}</span>
                          {today && <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full tracking-wide">TODAY</span>}
                          {tomorrow && <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full tracking-wide">TOMORROW</span>}
                        </div>
                        <p className="text-[13px] text-slate-500 mt-0.5">
                          {formatDate(booking.date)} <span className="font-semibold text-slate-700">{booking.time}</span>
                        </p>
                        {flightNum && (
                          <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Plane className="w-3 h-3" />{flightNum}
                          </p>
                        )}
                        {hasReturn && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-200" title="Return pickup date and time">
                            <span className="text-sm leading-none">↩</span>
                            <span>Return {formatDate(booking.returnDate)} {booking.returnTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold text-slate-900 tracking-tight">{booking.name}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{booking.email}</p>
                    <a href={`tel:${booking.phone}`} onClick={(e) => e.stopPropagation()}
                       className="text-[12px] text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{booking.phone}
                    </a>
                  </td>

                  {/* Route */}
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <div className="max-w-[240px] space-y-1">
                      <p className="text-[12px] text-slate-600 truncate">{booking.pickupAddress}</p>
                      <div className="flex items-center gap-1.5">
                        <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <p className="text-[12px] text-slate-600 truncate">{booking.dropoffAddress}</p>
                      </div>
                      {booking.pricing?.distance && (
                        <p className="text-[11px] text-slate-300 font-medium">{booking.pricing.distance} km</p>
                      )}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="space-y-1.5">
                      <p className="text-[15px] font-bold text-slate-900 tabular-nums">${booking.pricing?.totalPrice?.toFixed(0) || booking.totalPrice || '0'}</p>
                      <span className={`inline-block text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                        booking.payment_status === 'cash' ? 'bg-amber-50 text-amber-700' :
                        booking.payment_status === 'pay-on-pickup' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {booking.payment_status === 'pay-on-pickup'
                          ? 'PAY ON PICKUP'
                          : (booking.payment_status || 'unpaid').toUpperCase()}
                      </span>
                      {booking.payment_status !== 'paid' && booking.payment_status !== 'cash' && booking.payment_status !== 'pay-on-pickup' && (
                        <button
                          onClick={() => onSendPaymentLink(booking.id, 'stripe')}
                          className="block text-[11px] text-slate-400 hover:text-slate-900 transition-colors font-medium"
                        >
                          {booking.payment_link_sent_at ? 'Resend link' : 'Send link'}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <Select value={booking.status} onValueChange={(val) => onStatusUpdate(booking.id, val)}>
                      <SelectTrigger className="h-7 w-[120px] text-[11px] border-0 bg-transparent shadow-none focus:ring-0 p-0">
                        <span className={`text-[11px] font-bold tracking-wider ${
                          booking.status === 'confirmed' ? 'text-emerald-600' :
                          booking.status === 'completed' ? 'text-blue-600' :
                          booking.status === 'cancelled' ? 'text-slate-400' :
                          booking.status === 'pending_approval' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                          {(booking.status || 'pending').replace('_', ' ').toUpperCase()}
                        </span>
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="pending_approval">Needs Approval</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Quick actions — icon + visible label so admins on
                      mobile/iPad can read what each button does without
                      relying on hover tooltips. */}
                  <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-start gap-1.5 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEditBooking(booking); }}
                        className="group flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all shadow-sm hover:shadow min-w-[64px]"
                        title="Edit booking details (address, date, passengers, etc.)"
                      >
                        <Pencil className="w-[18px] h-[18px] text-slate-400 group-hover:text-amber-600 transition-colors" />
                        <span className="text-[10px] font-semibold tracking-wide text-slate-500 group-hover:text-amber-600 transition-colors">Edit</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onResendConfirmation(booking.id); }}
                        className="group flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all shadow-sm hover:shadow min-w-[64px]"
                        title="Resend booking confirmation email to the customer"
                      >
                        <RefreshCw className="w-[18px] h-[18px] text-slate-400 group-hover:text-blue-600 transition-colors" />
                        <span className="text-[10px] font-semibold tracking-wide text-slate-500 group-hover:text-blue-600 transition-colors">Resend</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onSendToAdmin(booking.id); }}
                        className="group flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow min-w-[64px]"
                        title="Email these booking details to the admin inbox (bookings@bookaride.co.nz)"
                      >
                        <Send className="w-[18px] h-[18px] text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-[10px] font-semibold tracking-wide text-slate-500 group-hover:text-indigo-600 transition-colors">Email Admin</span>
                      </button>
                      {booking.payment_status !== 'paid' && booking.payment_status !== 'cash' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onSendPaymentLink(booking.id, 'stripe'); }}
                          className="group flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition-all shadow-sm hover:shadow min-w-[64px]"
                          title="Email a Stripe payment link to the customer"
                        >
                          <CreditCard className="w-[18px] h-[18px] text-slate-400 group-hover:text-emerald-600 transition-colors" />
                          <span className="text-[10px] font-semibold tracking-wide text-slate-500 group-hover:text-emerald-600 transition-colors">Pay Link</span>
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteBooking(booking.id, booking.name, false); }}
                        className="group flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all shadow-sm hover:shadow min-w-[64px]"
                        title="Cancel this booking silently — no email is sent to the customer"
                      >
                        <XCircle className="w-[18px] h-[18px] text-slate-400 group-hover:text-red-600 transition-colors" />
                        <span className="text-[10px] font-semibold tracking-wide text-slate-500 group-hover:text-red-600 transition-colors">Cancel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer with pagination */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <p className="text-[12px] text-slate-400 font-medium tracking-wide">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
          {totalBookings > bookings.length && ` of ${totalBookings}`}
        </p>
        <div className="flex items-center gap-3">
          {/* Pagination controls */}
          {!loadAllBookings && totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <span className="text-[12px] text-slate-500 font-medium px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          )}
          {/* Load all option */}
          {!loadAllBookings && totalBookings > bookings.length && onLoadAll && (
            <button
              onClick={onLoadAll}
              className="text-[12px] text-slate-500 hover:text-slate-800 font-medium underline underline-offset-4 transition-colors"
            >
              Load all bookings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(BookingsTable);
