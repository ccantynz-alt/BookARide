import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const BulkDeleteDialog = ({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Delete {selectedCount} Booking{selectedCount > 1 ? 's' : ''}?
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800 font-medium">No notifications will be sent</p>
            <p className="text-sm text-amber-700 mt-1">
              The selected bookings will be moved to the Deleted tab without sending any SMS or email notifications to customers.
            </p>
          </div>
          <p className="text-slate-600 text-sm">
            You can restore these bookings later from the Deleted tab if needed.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {selectedCount} Booking{selectedCount > 1 ? 's' : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteDialog;
