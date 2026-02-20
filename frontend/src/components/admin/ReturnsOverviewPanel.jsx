import React, { useState, useEffect } from 'react';
import { 
  Plane, Clock, MapPin, Car, User, Calendar, 
  AlertTriangle, CheckCircle, ArrowRight, Phone, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

import { API } from '../../config/api';

const ReturnsOverviewPanel = ({ bookings = [], drivers = [], onAssignDriver, onViewBooking }) => {
  const [urgentReturns, setUrgentReturns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper — returns YYYY-MM-DD in NZ time (Pacific/Auckland) so dates match
  // what the backend uses, regardless of where the admin's browser is.
  const getNZDateString = (offsetDays = 0) => {
    const d = new Date(Date.now() + offsetDays * 86400000);
    return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
  };

  const today = getNZDateString(0);
  const tomorrow = getNZDateString(1);
  const nextWeek = getNZDateString(7);

  // Get all returns (today, tomorrow, and upcoming)
  const allReturns = bookings.filter(b => 
    b.returnDate && b.returnTime && b.status !== 'cancelled' &&
    b.returnDate >= today && b.returnDate <= nextWeek
  ).sort((a, b) => {
    if (a.returnDate !== b.returnDate) return a.returnDate.localeCompare(b.returnDate);
    return (a.returnTime || '').localeCompare(b.returnTime || '');
  });

  const todayReturns = allReturns.filter(b => b.returnDate === today);
  const tomorrowReturns = allReturns.filter(b => b.returnDate === tomorrow);
  const laterReturns = allReturns.filter(b => b.returnDate > tomorrow);

  // Fetch urgent returns with drive time
  const fetchUrgentReturns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/urgent-returns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUrgentReturns(response.data.urgent_returns || []);
    } catch (error) {
      console.error('Error fetching urgent returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrgentReturns();
    const interval = setInterval(fetchUrgentReturns, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get urgency info for a return
  const getUrgencyInfo = (booking) => {
    const urgent = urgentReturns.find(u => u.booking_id === booking.id);
    return urgent;
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Get driver info
  const getDriverInfo = (booking) => {
    const driverId = booking.return_driver_id || booking.driver_id;
    if (!driverId) return null;
    const driver = drivers.find(d => d.id === driverId);
    return driver;
  };

  const renderReturnCard = (booking, isUrgent = false) => {
    const urgencyInfo = getUrgencyInfo(booking);
    const driver = getDriverInfo(booking);
    const isToday = booking.returnDate === today;
    const isTomorrow = booking.returnDate === tomorrow;

    return (
      <div 
        key={booking.id}
        className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer backdrop-blur-sm ${
          isToday && !driver
            ? 'bg-red-50/80 border-red-200/70'
            : isToday
              ? 'bg-violet-50/80 border-violet-200/70'
              : isTomorrow
                ? 'bg-sky-50/80 border-sky-200/70'
                : 'bg-gray-50/80 border-gray-100/70'
        }`}
        onClick={() => onViewBooking?.(booking)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Customer & Time */}
            <div className="flex items-center gap-2 mb-2">
              <User className={`w-4 h-4 ${isToday ? 'text-purple-600' : 'text-gray-600'}`} />
              <span className="font-semibold text-gray-900">{booking.name || booking.customerName}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isToday && !driver
                  ? 'bg-red-100/90 text-red-700'
                  : isToday
                    ? 'bg-violet-100/90 text-violet-700'
                    : isTomorrow
                      ? 'bg-sky-100/90 text-sky-700'
                      : 'bg-gray-100/90 text-gray-700'
              }`}>
                {formatDate(booking.returnDate)}
              </span>
            </div>

            {/* Time & Location */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {booking.returnTime}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {booking.dropoffAddress?.split(',')[0] || 'Airport'}
              </span>
            </div>

            {/* Urgency Info */}
            {urgencyInfo && (
              <div className={`mt-2 text-xs font-medium ${
                urgencyInfo.urgency === 'LEAVE NOW' || urgencyInfo.urgency === 'OVERDUE'
                  ? 'text-red-600'
                  : urgencyInfo.urgency === 'LEAVE SOON'
                    ? 'text-orange-600'
                    : 'text-gray-600'
              }`}>
                Leave by {urgencyInfo.leave_by} • {urgencyInfo.drive_minutes} min drive
              </div>
            )}
          </div>

          {/* Driver Status */}
          <div className="text-right">
            {driver ? (
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                  <Car className="w-3 h-3" />
                  {driver.name?.split(' ')[0]}
                </span>
              </div>
            ) : (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                No Driver
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (allReturns.length === 0) {
    return (
      <div className="bg-white/90 rounded-2xl shadow-md border border-gray-100/80 backdrop-blur-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Plane className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Return Trips</h2>
            <p className="text-sm text-gray-500">No upcoming returns in the next 7 days</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 rounded-2xl shadow-md border border-gray-100/80 backdrop-blur-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <Plane className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Return Trips</h2>
            <p className="text-sm text-gray-500">
              {todayReturns.length} today • {tomorrowReturns.length} tomorrow • {laterReturns.length} later
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUrgentReturns} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Today's Returns */}
      {todayReturns.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Today's Returns</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              {todayReturns.length}
            </span>
          </div>
          <div className="space-y-2">
            {todayReturns.map(b => renderReturnCard(b, true))}
          </div>
        </div>
      )}

      {/* Tomorrow's Returns */}
      {tomorrowReturns.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tomorrow</h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              {tomorrowReturns.length}
            </span>
          </div>
          <div className="space-y-2">
            {tomorrowReturns.map(b => renderReturnCard(b))}
          </div>
        </div>
      )}

      {/* Later Returns */}
      {laterReturns.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Coming Up</h3>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              {laterReturns.length}
            </span>
          </div>
          <div className="space-y-2">
            {laterReturns.slice(0, 3).map(b => renderReturnCard(b))}
            {laterReturns.length > 3 && (
              <p className="text-sm text-gray-500 text-center py-2">
                +{laterReturns.length - 3} more returns
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsOverviewPanel;
