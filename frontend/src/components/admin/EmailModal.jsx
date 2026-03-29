import React from 'react';
import { Mail } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

const EmailModal = ({
  open,
  onOpenChange,
  booking,
  emailSubject,
  emailMessage,
  emailCC,
  onSubjectChange,
  onMessageChange,
  onCCChange,
  onSend,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send Email to Customer</DialogTitle>
        </DialogHeader>
        {booking && (
          <div className="space-y-4">
            <div>
              <Label>To:</Label>
              <Input value={booking.email} disabled className="bg-slate-50" />
            </div>
            <div>
              <Label>CC (optional):</Label>
              <Input
                value={emailCC}
                onChange={(e) => onCCChange(e.target.value)}
                placeholder="Additional email addresses (comma separated)"
              />
            </div>
            <div>
              <Label>Subject:</Label>
              <Input
                value={emailSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label>Message:</Label>
              <Textarea
                value={emailMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Email message"
                rows={10}
              />
            </div>
            <Button onClick={onSend} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              <Mail className="w-4 h-4 mr-2" />
              Send Email
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailModal;
