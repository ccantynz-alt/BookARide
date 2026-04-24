import React from 'react';
import { Mail, DollarSign, Car, Plane, RotateCcw, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

import { formatDate, getDayOfWeek } from '../../utils/dateFormat';

const BookingDetailsModal = ({
  open,
  onOpenChange,
  booking,
  // Payment
  selectedPaymentStatus,
  onPaymentStatusChange,
  onUpdatePaymentStatus,
  // Price override
  priceOverride,
  onPriceOverrideChange,
  onPriceOverride,
  // Admin
  onSendToAdmin,
}) => {
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Status & Payment */}
          <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-indigo-500">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Booking Status</span>
                <p className={`font-semibold text-sm mt-1 ${
                  booking.status === 'confirmed' ? 'text-emerald-600' :
                  booking.status === 'completed' ? 'text-blue-600' :
                  booking.status === 'cancelled' ? 'text-red-600' : 'text-amber-600'
                }`}>
                  {booking.status?.toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">Payment Status</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    booking.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    booking.payment_status === 'cash' ? 'bg-amber-100 text-amber-700' :
                    booking.payment_status === 'pay-on-pickup' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {booking.payment_status === 'cash' && <DollarSign className="w-3 h-3" />}
                    {booking.payment_status === 'pay-on-pickup' && <Car className="w-3 h-3" />}
                    {booking.payment_status === 'unpaid' && <X className="w-3 h-3" />}
                    <span className="uppercase">{booking.payment_status?.replace('-', ' ') || 'UNPAID'}</span>
                  </span>
                  <div className="flex gap-1">
                    <Select value={selectedPaymentStatus} onValueChange={onPaymentStatusChange}>
                      <SelectTrigger className="h-7 text-xs w-[100px]">
                        <SelectValue placeholder="Change" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="pay-on-pickup">Pay on Pickup</SelectItem>
                        <SelectItem value="invoiced">Invoiced</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={onUpdatePaymentStatus} disabled={!selectedPaymentStatus} className="h-7 px-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                      Update
                    </Button>
                  </div>
                </div>
                {booking.payment_link_sent_at && (
                  <div className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" /> Payment link sent {new Date(booking.payment_link_sent_at).toLocaleString()}
                    {booking.payment_link_sent_count > 1 && ` (sent ${booking.payment_link_sent_count} times)`}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Name:</span><p className="font-medium">{booking.name}</p></div>
              <div><span className="text-slate-500">Email:</span><p className="font-medium">{booking.email}</p></div>
              <div><span className="text-slate-500">Phone:</span><p className="font-medium">{booking.phone}</p></div>
              <div><span className="text-slate-500">Passengers:</span><p className="font-medium">{booking.passengers}</p></div>
            </div>
          </div>

          {/* Trip Info */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Trip Information</h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-slate-500">Service:</span><p className="font-medium">{booking.serviceType}</p></div>
              <div>
                <span className="text-slate-500">Pickup:</span>
                <p className="font-medium">{booking.pickupAddress}</p>
              </div>
              <div><span className="text-slate-500">Drop-off:</span><p className="font-medium">{booking.dropoffAddress}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-500">Date:</span>
                  <p className="font-medium">{formatDate(booking.date)}</p>
                  <p className="text-sm text-indigo-600 font-medium">{getDayOfWeek(booking.date)}</p>
                </div>
                <div><span className="text-slate-500">Time:</span><p className="font-medium">{booking.time}</p></div>
              </div>

              {/* Return Trip */}
              {(booking.bookReturn || (booking.returnDate && booking.returnTime)) && (
                <div className="mt-4 bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2 text-sm flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> Return Trip</h4>
                  <p className="font-bold text-purple-800">
                    {formatDate(booking.returnDate)} at {booking.returnTime}
                    <span className="text-purple-600 font-normal text-xs ml-1">({getDayOfWeek(booking.returnDate)})</span>
                  </p>
                  <p className="text-slate-600 text-xs italic mt-1">
                    {booking.dropoffAddress?.split(',')[0]} → {booking.pickupAddress?.split(',')[0]}
                  </p>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <span className="text-slate-700 text-xs font-semibold uppercase tracking-wide">Return Flight</span>
                    <p className="font-medium text-blue-700 mt-1">
                      {booking.returnDepartureFlightNumber || booking.returnFlightNumber || '— not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Outbound Flight Info */}
          {(booking.flightArrivalNumber || booking.arrivalFlightNumber || booking.flightDepartureNumber || booking.departureFlightNumber || booking.flightNumber) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5"><Plane className="w-4 h-4" /> Outbound Flight</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {booking.flightNumber && !booking.flightArrivalNumber && !booking.arrivalFlightNumber && (
                  <div><span className="text-slate-500">Flight:</span><p className="font-medium">{booking.flightNumber}</p></div>
                )}
                {(booking.flightArrivalNumber || booking.arrivalFlightNumber) && (
                  <div>
                    <span className="text-slate-500">Arrival:</span>
                    <p className="font-medium">{booking.flightArrivalNumber || booking.arrivalFlightNumber}</p>
                  </div>
                )}
                {(booking.flightDepartureNumber || booking.departureFlightNumber) && (
                  <div>
                    <span className="text-slate-500">Departure:</span>
                    <p className="font-medium">{booking.flightDepartureNumber || booking.departureFlightNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div>
            <h3 className="font-semibold text-slate-800 mb-3">Pricing</h3>
            <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
              {booking.pricing?.distance && (
                <div className="flex justify-between"><span>Distance:</span><span className="font-medium">{booking.pricing.distance} km</span></div>
              )}
              {booking.pricing?.basePrice != null && (
                <div className="flex justify-between"><span>Base Price:</span><span className="font-medium">${booking.pricing.basePrice.toFixed(2)}</span></div>
              )}
              {booking.pricing?.airportFee > 0 && (
                <div className="flex justify-between"><span>Airport Fee:</span><span className="font-medium">${booking.pricing.airportFee.toFixed(2)}</span></div>
              )}
              {booking.pricing?.passengerFee > 0 && (
                <div className="flex justify-between"><span>Passenger Fee:</span><span className="font-medium">${booking.pricing.passengerFee.toFixed(2)}</span></div>
              )}
              {booking.pricing?.fuelSurcharge > 0 && (
                <div className="flex justify-between text-amber-700"><span>Fuel Surcharge ({booking.pricing.fuelSurchargePercent || 12}%):</span><span className="font-medium">${booking.pricing.fuelSurcharge.toFixed(2)}</span></div>
              )}
              {booking.pricing?.stripeFee > 0 && (
                <div className="flex justify-between text-slate-500"><span>Card Processing Fee:</span><span className="font-medium">${booking.pricing.stripeFee.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between pt-2 border-t font-semibold text-base">
                <span>Total:</span>
                <span className="text-indigo-600">${booking.pricing?.totalPrice?.toFixed(2) || booking.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            <div className="mt-4">
              <Label>Override Price</Label>
              <div className="flex gap-2 mt-2">
                <Input type="number" step="0.01" value={priceOverride} onChange={(e) => onPriceOverrideChange(e.target.value)} className="flex-1" />
                <Button onClick={onPriceOverride} className="bg-indigo-600 hover:bg-indigo-700 text-white">Update Price</Button>
              </div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Special Requests</h3>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{booking.notes}</p>
            </div>
          )}

          {/* Admin Action */}
          <div className="pt-4 border-t">
            <Button onClick={() => onSendToAdmin(booking.id)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Mail className="w-4 h-4 mr-2" /> Send Booking Details to Admin
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailsModal;
