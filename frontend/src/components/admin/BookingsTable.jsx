import React from 'react';
import { Eye, Edit2, Mail, RefreshCw, Trash2, Archive, XCircle, CheckCircle, Clock, Square, CheckSquare, ChevronDown, ChevronRight, MapPin, Phone } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const isToday = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  const [y, m, d] = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')];
  return dateStr === `${y}-${m}-${d}`;
};

const isTomorrow = (dateStr) => {
  if (!dateStr) return false;
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const [y, m, d] = [tmr.getFullYear(), String(tmr.getMonth() + 1).padStart(2, '0'), String(tmr.getDate()).padStart(2, '0')];
  return dateStr === `${y}-${m}-${d}`;
};

const statusColors = {
  pending_approval: 'bg-red-100 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const paymentBadge = (status) => {
  if (status === 'paid') return { cls: 'bg-emerald-100 text-emerald-700', label: 'PAID' };
  if (status === 'cash') return { cls: 'bg-amber-100 text-amber-700', label: 'CASH' };
  return { cls: 'bg-red-100 text-red-700', label: 'UNPAID' };
};

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
  onSendEmail,
  onResendConfirmation,
  onArchiveBooking,
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
}) => {
  const safeSelected = selectedBookings instanceof Set ? selectedBookings : new Set();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-slate-500 font-medium">Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    const hasFilters = dateFrom || dateTo || searchTerm || (statusFilter && statusFilter !== 'all');
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-600 font-semibold text-lg mb-2">
          {totalBookings > 0 ? 'No bookings match your filters' : 'No bookings yet'}
        </p>
        {totalBookings > 0 && hasFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="mt-3">Clear all filters</Button>
        )}
        {totalBookings === 0 && (
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" size="sm" onClick={onOpenDeletedTab}>Check Deleted Tab</Button>
            <Button size="sm" onClick={onRestoreFromServer} disabled={restoringFromServerBackup} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Restore from Backup
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Bulk action bar */}
      {safeSelected.size > 0 && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-indigo-800">{safeSelected.size} selected</span>
            <button onClick={onClearSelection} className="text-xs text-indigo-600 hover:text-indigo-800 underline">Clear</button>
          </div>
          <Button variant="destructive" size="sm" onClick={onBulkDelete}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete Selected
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-10 px-3 py-3">
                <button
                  onClick={() => safeSelected.size === bookings.length ? onClearSelection() : onSelectAll()}
                  className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                >
                  {safeSelected.size === bookings.length && bookings.length > 0
                    ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                    : <Square className="w-4 h-4 text-slate-400" />}
                </button>
              </th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Route</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Driver</th>
              <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const hasReturn = booking.returnDate && booking.returnTime;
              const isUnassigned = !booking.driver_id && !booking.driver_name && !booking.assignedDriver;
              const isTodayBooking = isToday(booking.date);
              const isTmrBooking = isTomorrow(booking.date);
              const urgentUnassigned = isTodayBooking && isUnassigned;
              const flightNum = booking.flightNumber || booking.flightArrivalNumber || booking.arrivalFlightNumber || booking.flightDepartureNumber || booking.departureFlightNumber || '';
              const payment = paymentBadge(booking.payment_status);

              return (
                <tr
                  key={booking.id}
                  className={`group transition-colors hover:bg-slate-50/80 cursor-pointer
                    ${safeSelected.has(booking.id) ? 'bg-indigo-50/50' : ''}
                    ${urgentUnassigned ? 'bg-red-50/50' : ''}
                  `}
                  onClick={() => onViewDetails(booking)}
                >
                  {/* Checkbox */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectBooking(booking.id)}
                      className="p-0.5 hover:bg-slate-200 rounded transition-colors"
                    >
                      {safeSelected.has(booking.id)
                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                        : <Square className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />}
                    </button>
                  </td>

                  {/* Booking info */}
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      {/* Time indicator bar */}
                      <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                        urgentUnassigned ? 'bg-red-500' :
                        isTodayBooking ? 'bg-indigo-500' :
                        isTmrBooking ? 'bg-amber-400' : 'bg-slate-200'
                      }`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">#{booking.referenceNumber || booking.id?.slice(0, 5)}</span>
                          {isTodayBooking && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded">TODAY</span>}
                          {isTmrBooking && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">TOMORROW</span>}
                          {hasReturn && <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded">RETURN</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDate(booking.date)} at <span className="font-semibold text-slate-700">{booking.time}</span></p>
                        {flightNum && <p className="text-[10px] text-blue-600 font-medium mt-0.5">✈ {flightNum}</p>}
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="px-3 py-3">
                    <p className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">{booking.name}</p>
                    <p className="text-xs text-slate-400 truncate max-w-[140px]">{booking.email}</p>
                    <a href={`tel:${booking.phone}`} onClick={(e) => e.stopPropagation()} className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />{booking.phone}
                    </a>
                  </td>

                  {/* Route */}
                  <td className="px-3 py-3 hidden lg:table-cell">
                    <div className="max-w-[220px]">
                      <p className="text-xs text-slate-600 truncate"><span className="text-emerald-600 font-bold mr-1">From</span>{booking.pickupAddress}</p>
                      <p className="text-xs text-slate-600 truncate mt-0.5"><span className="text-red-500 font-bold mr-1">To</span>{booking.dropoffAddress}</p>
                      {booking.pricing?.distance && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{booking.pricing.distance} km</p>
                      )}
                    </div>
                  </td>

                  {/* Payment */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-bold text-slate-800">${booking.pricing?.totalPrice?.toFixed(0) || booking.totalPrice || '0'}</span>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold w-fit ${payment.cls}`}>
                        {payment.label}
                      </span>
                      {booking.payment_status !== 'paid' && booking.payment_status !== 'cash' && (
                        <button
                          onClick={() => onSendPaymentLink(booking.id, 'stripe')}
                          className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium hover:underline text-left"
                        >
                          {booking.payment_link_sent_at ? `✉ Resend link` : '→ Send payment link'}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Driver */}
                  <td className="px-3 py-3">
                    {booking.driver_id || booking.driver_name ? (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${booking.driverAcknowledged ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                        <div>
                          <p className="text-xs font-semibold text-slate-700">{booking.driver_name?.split(' ')[0] || 'Assigned'}</p>
                          <p className="text-[10px] text-slate-400">{booking.driverAcknowledged ? 'Confirmed' : 'Pending'}</p>
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${
                        urgentUnassigned ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {urgentUnassigned ? 'ASSIGN NOW' : 'Unassigned'}
                      </span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Select value={booking.status} onValueChange={(val) => onStatusUpdate(booking.id, val)}>
                      <SelectTrigger className="h-7 w-[110px] text-[11px] border-0 bg-transparent p-0">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[booking.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {booking.status?.replace('_', ' ').toUpperCase().slice(0, 12)}
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

                  {/* Actions */}
                  <td className="px-3 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onViewDetails(booking)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="View details">
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      <button onClick={() => onEditBooking(booking)} className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4 text-indigo-600" />
                      </button>
                      <button onClick={() => onSendEmail(booking)} className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors" title="Email">
                        <Mail className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button onClick={() => onResendConfirmation(booking.id)} className="p-1.5 hover:bg-amber-50 rounded-lg transition-colors" title="Resend confirmation">
                        <RefreshCw className="w-4 h-4 text-amber-600" />
                      </button>
                      <button onClick={() => onDeleteBooking(booking.id, booking.name, true)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Cancel & notify">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsTable;
