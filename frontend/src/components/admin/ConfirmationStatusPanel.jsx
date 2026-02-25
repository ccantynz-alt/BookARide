import React, { useState } from 'react';
import { 
  Mail, MessageSquare, CheckCircle, XCircle, Send, 
  Clock, AlertCircle, RefreshCw, User, Calendar
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ConfirmationStatusPanel = ({ bookings = [] }) => {
  const [sendingId, setSendingId] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Helper for local date string
  const getLocalDateString = (date) => {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = getLocalDateString(new Date());
  const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));

  // Get upcoming bookings (today and tomorrow)
  const upcomingBookings = bookings.filter(b => 
    ((b.date || b.pickupDate) === today || (b.date || b.pickupDate) === tomorrow) &&
    b.status !== 'cancelled'
  ).sort((a, b) => {
    const dateA = a.date || a.pickupDate;
    const dateB = b.date || b.pickupDate;
    if (dateA !== dateB) return dateA.localeCompare(dateB);
    const timeA = a.time || a.pickupTime || '';
    const timeB = b.time || b.pickupTime || '';
    return timeA.localeCompare(timeB);
  });

  // Check confirmation status
  const getConfirmationStatus = (booking) => {
    const emailSent = booking.confirmation_sent || booking.notifications_sent;
    const smsSent = booking.sms_sent || booking.notifications_sent;
    return { emailSent, smsSent };
  };

  // Send confirmation
  const sendConfirmation = async (bookingId, customerName) => {
    setSendingId(bookingId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/bookings/${bookingId}/resend-confirmation`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Confirmation sent to ${customerName}`);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Failed to send confirmation';
      toast.error(errorMsg);
    } finally {
      setSendingId(null);
    }
  };

  // Count stats
  const confirmedCount = upcomingBookings.filter(b => {
    const { emailSent, smsSent } = getConfirmationStatus(b);
    return emailSent || smsSent;
  }).length;

  const needsConfirmation = upcomingBookings.filter(b => {
    const { emailSent, smsSent } = getConfirmationStatus(b);
    return !emailSent && !smsSent;
  });

  const displayBookings = expanded ? upcomingBookings : upcomingBookings.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Confirmation Status</h2>
            <p className="text-sm text-gray-500">
              {confirmedCount}/{upcomingBookings.length} customers confirmed
            </p>
          </div>
        </div>
        {needsConfirmation.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            {needsConfirmation.length} pending
          </div>
        )}
      </div>

      {/* Bookings List */}
      <div className="space-y-2">
        {displayBookings.map((booking) => {
          const { emailSent, smsSent } = getConfirmationStatus(booking);
          const isToday = (booking.date || booking.pickupDate) === today;
          
          return (
            <div 
              key={booking.id}
              className={`flex items-center justify-between p-3 rounded-xl border ${
                !emailSent && !smsSent 
                  ? 'bg-amber-50 border-amber-200' 
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isToday ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <User className={`w-4 h-4 ${isToday ? 'text-red-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {booking.name || booking.customerName}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      isToday ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isToday ? 'TODAY' : 'TOMORROW'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {booking.time || booking.pickupTime}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Status Indicators */}
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 text-xs ${emailSent ? 'text-green-600' : 'text-gray-400'}`}>
                    {emailSent ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs ${smsSent ? 'text-green-600' : 'text-gray-400'}`}>
                    {smsSent ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>
                
                {/* Resend Button */}
                <Button
                  size="sm"
                  variant={!emailSent && !smsSent ? "default" : "outline"}
                  className={`text-xs h-7 ${
                    !emailSent && !smsSent 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : ''
                  }`}
                  onClick={() => sendConfirmation(booking.id, booking.name || booking.customerName)}
                  disabled={sendingId === booking.id}
                >
                  {sendingId === booking.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      {!emailSent && !smsSent ? 'Send' : 'Resend'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More */}
      {upcomingBookings.length > 5 && (
        <Button 
          variant="ghost" 
          className="w-full mt-3 text-gray-500"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : `Show ${upcomingBookings.length - 5} More`}
        </Button>
      )}
    </div>
  );
};

export default ConfirmationStatusPanel;
