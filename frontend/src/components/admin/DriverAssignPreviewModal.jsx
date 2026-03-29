import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
};

const DriverAssignPreviewModal = ({
  open,
  onOpenChange,
  pendingAssignment,
  booking,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Driver Assignment</DialogTitle>
        </DialogHeader>
        {pendingAssignment && booking && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <p className="text-sm"><strong>Booking:</strong> #{booking.referenceNumber} - {booking.name}</p>
              <p className="text-sm"><strong>Date:</strong> {formatDate(booking.date)} at {booking.time}</p>
              <p className="text-sm"><strong>Trip:</strong> {pendingAssignment.tripType === 'return' ? 'Return Trip' : 'Outbound Trip'}</p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <p className="text-sm text-slate-600">Assigning to:</p>
              <p className="font-bold text-lg">{pendingAssignment.driver?.name}</p>
              <p className="text-sm text-slate-500">{pendingAssignment.driver?.phone}</p>
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-600">Driver payout:</p>
              <p className="font-bold text-2xl text-emerald-700">${pendingAssignment.driverPayout?.toFixed(2)}</p>
              {pendingAssignment.isOverride ? (
                <p className="text-xs text-emerald-600 mt-1">Custom payout set</p>
              ) : (
                <p className="text-xs text-slate-500 mt-1">Auto-calculated (full amount, customer pays Stripe fee)</p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onConfirm}>
                Confirm & Send to Driver
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DriverAssignPreviewModal;
