import React from 'react';
import { Eye, Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const PreviewConfirmationModal = ({
  open,
  onOpenChange,
  previewHtml,
  previewBookingInfo,
  onClose,
  onSend,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Preview Confirmation Email
          </DialogTitle>
        </DialogHeader>

        {previewBookingInfo && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm"><strong>To:</strong> {previewBookingInfo.email}</p>
            {previewBookingInfo.ccEmail && (
              <p className="text-sm"><strong>CC:</strong> {previewBookingInfo.ccEmail}</p>
            )}
            <p className="text-sm"><strong>Customer:</strong> {previewBookingInfo.name}</p>
            <p className="text-sm"><strong>Phone:</strong> {previewBookingInfo.phone}</p>
          </div>
        )}

        <div className="border rounded-lg overflow-hidden">
          <div className="bg-white" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onSend} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            <Send className="w-4 h-4 mr-2" />
            Send to Customer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreviewConfirmationModal;
