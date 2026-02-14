import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Clock, Car, Plane, Bell, CheckCircle, 
  XCircle, ArrowRight, Phone, Mail, RefreshCw, User,
  Calendar, MapPin, DollarSign, Send
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

import { API } from '../../config/api';

const UrgentNotificationsCenter = ({ bookings = [], drivers = [], onAssignDriver, onViewBooking }) => {
  const [urgentReturns, setUrgentReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(null);

  // Helper for local date string
  const getLocalDateString = (date) => {
    const d = date || new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = getLocalDateString(new Date());
  const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));

  // Get urgent items
  const unassignedToday = bookings.filter(b => 
    (b.date || b.pickupDate) === today && 
    !b.driver_id && !b.driver_name && !b.assignedDriver &&
    b.status !== 'cancelled'
  );

  const pendingApproval = bookings.filter(b => b.status === 'pending_approval');

  const returnsToday = bookings.filter(b => 
    b.returnDate === today && b.returnTime && b.status !== 'cancelled'
  );

  const unpaidToday = bookings.filter(b => 
    (b.date || b.pickupDate) === today && 
    b.status !== 'cancelled' &&
    !['paid', 'cash', 'pay-on-pickup'].includes(b.payment_status)
  );

  // Fetch urgent returns with drive time
  const fetchUrgentReturns = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/urgent-returns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUrgentReturns(response.data.urgent_returns || []);
    } catch (error) {
      console.error('Error fetching urgent returns:', error);
    }
  };

  useEffect(() => {
    fetchUrgentReturns();
    const interval = setInterval(fetchUrgentReturns, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Send reminder
  const sendReminder = async (bookingId, customerName) => {
    setSendingReminder(bookingId);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/bookings/${bookingId}/resend-confirmation`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Reminder sent to ${customerName}`);
    } catch (error) {
      toast.error('Failed to send reminder');
    } finally {
      setSendingReminder(null);
    }
  };

  const hasUrgentItems = unassignedToday.length > 0 || pendingApproval.length > 0 || urgentReturns.length > 0;

  if (!hasUrgentItems) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">All Clear!</h3>
            <p className="text-sm text-emerald-600">No urgent items requiring attention</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
            <Bell className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Action Required</h2>
            <p className="text-sm text-gray-500">Items needing immediate attention</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUrgentReturns}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {/* Unassigned Today */}
        {unassignedToday.map((booking) => (
          <div 
            key={booking.id} 
            className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{booking.name || booking.customerName}</span>
                  <span className="text-xs px-2 py-0.5 bg-red-200 text-red-700 rounded-full font-medium">
                    NO DRIVER
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {booking.time || booking.pickupTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {(booking.pickupAddress || '').split(',')[0]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => onAssignDriver?.(booking)}
              >
                Assign Driver
              </Button>
            </div>
          </div>
        ))}

        {/* Pending Approval */}
        {pendingApproval.map((booking) => (
          <div 
            key={booking.id} 
            className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{booking.name || booking.customerName}</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-700 rounded-full font-medium">
                    PENDING APPROVAL
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {booking.date || booking.pickupDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {booking.time || booking.pickupTime}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="text-amber-700 border-amber-300 hover:bg-amber-100"
                onClick={() => onViewBooking?.(booking)}
              >
                Review
              </Button>
            </div>
          </div>
        ))}

        {/* Urgent Returns */}
        {urgentReturns.map((ret) => (
          <div 
            key={ret.booking_id} 
            className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ret.urgency === 'OVERDUE' || ret.urgency === 'LEAVE NOW' 
                  ? 'bg-red-100' 
                  : ret.urgency === 'LEAVE SOON' 
                    ? 'bg-orange-100' 
                    : 'bg-purple-100'
              }`}>
                <Plane className={`w-5 h-5 ${
                  ret.urgency === 'OVERDUE' || ret.urgency === 'LEAVE NOW' 
                    ? 'text-red-600' 
                    : ret.urgency === 'LEAVE SOON' 
                      ? 'text-orange-600' 
                      : 'text-purple-600'
                }`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{ret.customer_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    ret.urgency === 'OVERDUE' || ret.urgency === 'LEAVE NOW' 
                      ? 'bg-red-200 text-red-700' 
                      : ret.urgency === 'LEAVE SOON' 
                        ? 'bg-orange-200 text-orange-700' 
                        : 'bg-purple-200 text-purple-700'
                  }`}>
                    RETURN @ {ret.return_time_formatted}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {(ret.pickup_address || '').split(',')[0]}
                  </span>
                  <span className={`font-medium ${
                    ret.urgency === 'OVERDUE' || ret.urgency === 'LEAVE NOW' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    Leave by {ret.leave_by}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!ret.driver_assigned && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                  No Driver!
                </span>
              )}
              <Button 
                size="sm" 
                variant="outline"
                className="text-purple-700 border-purple-300 hover:bg-purple-100"
                onClick={() => onViewBooking?.({ id: ret.booking_id })}
              >
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UrgentNotificationsCenter;
