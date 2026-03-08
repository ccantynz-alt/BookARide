import React, { useState, useEffect, memo } from 'react';
import { MapPin, Eye, RefreshCw, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import AddressAutocomplete from '../AddressAutocomplete';
import axios from 'axios';
import { API } from '../../config/api';

const EditBookingModal = memo(({ open, onClose, booking, onSuccess, onPreviewConfirmation, onResendConfirmation, onResendPaymentLink, onManualCalendarSync, getAuthHeaders, previewLoading, calendarLoading }) => {
  const [editingBooking, setEditingBooking] = useState(null);

  // Sync booking prop into local state when modal opens or booking changes
  useEffect(() => {
    if (booking && open) {
      setEditingBooking({ ...booking });
    }
  }, [booking, open]);

  const handleAddEditPickup = () => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: [...(prev.pickupAddresses || []), '']
    }));
  };

  const handleRemoveEditPickup = (index) => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index)
    }));
  };

  const handleEditPickupAddressChange = (index, value) => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  const handleSaveEditedBooking = async () => {
    if (!editingBooking) return;

    try {
      await axios.patch(`${API}/bookings/${editingBooking.id}`, {
        name: editingBooking.name,
        email: editingBooking.email,
        phone: editingBooking.phone,
        pickupAddress: editingBooking.pickupAddress,
        pickupAddresses: editingBooking.pickupAddresses?.filter(addr => addr.trim()) || [],
        dropoffAddress: editingBooking.dropoffAddress,
        date: editingBooking.date,
        time: editingBooking.time,
        passengers: editingBooking.passengers,
        notes: editingBooking.notes,
        flightArrivalNumber: editingBooking.flightArrivalNumber,
        flightArrivalTime: editingBooking.flightArrivalTime,
        flightDepartureNumber: editingBooking.flightDepartureNumber,
        flightDepartureTime: editingBooking.flightDepartureTime,
        bookReturn: !!(editingBooking.returnDate && editingBooking.returnTime),
        returnDate: editingBooking.returnDate,
        returnTime: editingBooking.returnTime
      }, getAuthHeaders());

      toast.success('Booking updated successfully!');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to update booking');
    }
  };

  if (!editingBooking) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Booking #{editingBooking?.referenceNumber || editingBooking?.id?.slice(0, 8)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* Customer Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editingBooking.name}
                  onChange={(e) => setEditingBooking(prev => ({...prev, name: e.target.value}))}
                  placeholder="Customer name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editingBooking.email}
                  onChange={(e) => setEditingBooking(prev => ({...prev, email: e.target.value}))}
                  placeholder="customer@example.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={editingBooking.phone}
                  onChange={(e) => setEditingBooking(prev => ({...prev, phone: e.target.value}))}
                  placeholder="+64 21 XXX XXXX"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Passengers</Label>
                <Select
                  value={editingBooking.passengers?.toString()}
                  onValueChange={(value) => setEditingBooking(prev => ({...prev, passengers: value}))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Trip Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Pickup Address 1 *</Label>
                <AddressAutocomplete
                  value={editingBooking.pickupAddress}
                  onChange={(val) => setEditingBooking(prev => ({ ...prev, pickupAddress: val }))}
                  onSelect={(val) => setEditingBooking(prev => ({ ...prev, pickupAddress: val }))}
                  placeholder="Start typing an address..."
                  className="mt-1"
                />
              </div>

              {editingBooking.pickupAddresses?.map((pickup, index) => (
                <div key={index} className="relative">
                  <Label>Pickup Address {index + 2}</Label>
                  <div className="flex gap-2 mt-1">
                    <AddressAutocomplete
                      value={pickup}
                      onChange={(val) => handleEditPickupAddressChange(index, val)}
                      onSelect={(val) => handleEditPickupAddressChange(index, val)}
                      placeholder="Start typing an address..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleRemoveEditPickup(index)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}

              <div>
                <button
                  type="button"
                  onClick={handleAddEditPickup}
                  className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border-2 border-dashed border-gold/40 hover:border-gold/60 rounded-lg transition-all duration-300"
                >
                  <MapPin className="w-4 h-4 text-gold" />
                  <span className="text-sm font-semibold text-gray-700">Add Another Pickup Location</span>
                  <span className="w-6 h-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center">+</span>
                </button>
              </div>

              <div>
                <Label>Drop-off Address *</Label>
                <AddressAutocomplete
                  value={editingBooking.dropoffAddress}
                  onChange={(val) => setEditingBooking(prev => ({ ...prev, dropoffAddress: val }))}
                  onSelect={(val) => setEditingBooking(prev => ({ ...prev, dropoffAddress: val }))}
                  placeholder="Start typing an address..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={editingBooking.date}
                    onChange={(e) => setEditingBooking(prev => ({...prev, date: e.target.value}))}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Time *</Label>
                  <Input
                    type="time"
                    value={editingBooking.time}
                    onChange={(e) => setEditingBooking(prev => ({...prev, time: e.target.value}))}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Flight Details */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  Flight Details (Optional)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Flight Arrival Number</Label>
                    <Input
                      value={editingBooking.flightArrivalNumber || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, flightArrivalNumber: e.target.value}))}
                      placeholder="e.g., NZ123"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Flight Arrival Time</Label>
                    <Input
                      type="time"
                      value={editingBooking.flightArrivalTime || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, flightArrivalTime: e.target.value}))}
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Flight Departure Number</Label>
                    <Input
                      value={editingBooking.flightDepartureNumber || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, flightDepartureNumber: e.target.value}))}
                      placeholder="e.g., NZ456"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Flight Departure Time</Label>
                    <Input
                      type="time"
                      value={editingBooking.flightDepartureTime || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, flightDepartureTime: e.target.value}))}
                      className="mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Return Journey */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">Return Journey <span className="text-sm font-normal text-gray-500">(Optional)</span></h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label>Return Date *</Label>
                    <Input
                      type="date"
                      value={editingBooking.returnDate || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, returnDate: e.target.value}))}
                      min={editingBooking.date || new Date().toISOString().split('T')[0]}
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Return Time *</Label>
                    <Input
                      type="time"
                      value={editingBooking.returnTime || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, returnTime: e.target.value}))}
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label>Return Flight Number</Label>
                    <Input
                      value={editingBooking.returnFlightNumber || editingBooking.returnDepartureFlightNumber || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, returnFlightNumber: e.target.value, returnDepartureFlightNumber: e.target.value}))}
                      placeholder="e.g. NZ456"
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-gray-600 italic">
                      Return route: {editingBooking.dropoffAddress?.split(',')[0]} → {editingBooking.pickupAddress?.split(',')[0]}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label>Special Notes</Label>
                <Textarea
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking(prev => ({...prev, notes: e.target.value}))}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Current Pricing Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Current Pricing</h3>
            <div className="flex justify-between items-center">
              <span>Total Price:</span>
              <span className="text-xl font-bold text-gold">${editingBooking.pricing?.totalPrice?.toFixed(2) || '0.00'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">To change pricing, use the View Details modal and override the price.</p>
          </div>

          {/* Quick Actions */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreviewConfirmation?.(editingBooking.id)}
                className="bg-white"
                disabled={previewLoading}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewLoading ? 'Loading...' : 'Preview Confirmation'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onResendConfirmation?.(editingBooking.id)}
                className="bg-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Confirmation
              </Button>
              {editingBooking.payment_status !== 'paid' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResendPaymentLink?.(editingBooking.id, 'stripe')}
                  className="bg-white text-green-600 border-green-200 hover:bg-green-50"
                >
                  Send Payment Link
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onManualCalendarSync?.(editingBooking.id)}
                className="bg-white"
                disabled={calendarLoading}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Sync to Calendar
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedBooking}
              className="bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EditBookingModal.displayName = 'EditBookingModal';

export default EditBookingModal;
