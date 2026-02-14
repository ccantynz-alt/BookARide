import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, DollarSign, AlertTriangle, Users, Car, 
  CheckCircle, XCircle, RefreshCw, TrendingUp, Plane, ArrowUpRight, 
  Activity, Bell, Mail, MessageSquare, AlertCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../../config/api';

const ProfessionalStatsBar = ({ bookings = [], drivers = [], onRefresh }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate stats from bookings - use LOCAL dates, not UTC
  const getLocalDateString = (date) => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDateString(new Date());
  const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));

  const todayBookings = bookings.filter(b => (b.date || b.pickupDate) === today && b.status !== 'cancelled');
  const tomorrowBookings = bookings.filter(b => (b.date || b.pickupDate) === tomorrow && b.status !== 'cancelled');
  
  const unassignedToday = todayBookings.filter(b => !b.driver_id && !b.driver_name && !b.assignedDriver);
  const pendingApproval = bookings.filter(b => b.status === 'pending_approval');
  
  // Return bookings for today
  const returnBookingsToday = bookings.filter(b => 
    b.returnDate === today && b.returnTime && b.status !== 'cancelled'
  );

  // Calculate today's revenue
  const todayRevenue = todayBookings.reduce((sum, b) => {
    const price = b.pricing?.totalPrice || b.totalPrice || 0;
    return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
  }, 0);

  const activeDrivers = drivers.filter(d => d.status === 'active').length;

  // Fetch system health
  const fetchSystemHealth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/admin/system-health`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSystemHealth(response.data);
    } catch (error) {
      console.error('Error fetching system health:', error);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
  }, [bookings]);

  const runErrorCheck = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/admin/run-error-check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchSystemHealth();
      toast.success('System check completed');
    } catch (error) {
      console.error('Error running check:', error);
      toast.error('Failed to run system check');
    } finally {
      setLoading(false);
    }
  };

  const issuesCount = systemHealth?.latest_report?.issues_count || 0;
  const warningsCount = systemHealth?.latest_report?.warnings_count || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Operations Overview</h2>
          <p className="text-sm text-gray-500">Real-time booking statistics</p>
        </div>
        <div className="flex items-center gap-3">
          {issuesCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
              <AlertCircle className="w-4 h-4" />
              {issuesCount} issues
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={runErrorCheck}
            disabled={loading}
            className="text-gray-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Check
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Today's Pickups */}
        <div className={`rounded-xl p-4 transition-all ${
          unassignedToday.length > 0 
            ? 'bg-red-50 border-2 border-red-200' 
            : 'bg-gray-50 border border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Today</span>
            <Calendar className={`w-4 h-4 ${unassignedToday.length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-3xl font-bold ${unassignedToday.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {todayBookings.length}
          </div>
          {unassignedToday.length > 0 ? (
            <div className="text-xs text-red-600 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {unassignedToday.length} need driver
            </div>
          ) : (
            <div className="text-xs text-green-600 font-medium mt-1">All assigned ✓</div>
          )}
        </div>

        {/* Tomorrow */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Tomorrow</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{tomorrowBookings.length}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Upcoming</div>
        </div>

        {/* Returns Today */}
        <div className={`rounded-xl p-4 ${
          returnBookingsToday.length > 0 
            ? 'bg-purple-50 border-2 border-purple-200' 
            : 'bg-gray-50 border border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Returns</span>
            <Plane className={`w-4 h-4 ${returnBookingsToday.length > 0 ? 'text-purple-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-3xl font-bold ${returnBookingsToday.length > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
            {returnBookingsToday.length}
          </div>
          <div className={`text-xs font-medium mt-1 ${returnBookingsToday.length > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
            {returnBookingsToday.length > 0 ? 'Pickup today' : 'None today'}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-bold text-emerald-600">${todayRevenue.toFixed(0)}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Today's total</div>
        </div>

        {/* Pending Approval */}
        <div className={`rounded-xl p-4 ${
          pendingApproval.length > 0 
            ? 'bg-amber-50 border-2 border-amber-200' 
            : 'bg-gray-50 border border-gray-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Pending</span>
            <Bell className={`w-4 h-4 ${pendingApproval.length > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
          </div>
          <div className={`text-3xl font-bold ${pendingApproval.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {pendingApproval.length}
          </div>
          <div className={`text-xs font-medium mt-1 ${pendingApproval.length > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {pendingApproval.length > 0 ? 'Need approval' : 'All clear'}
          </div>
        </div>

        {/* Active Drivers */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Drivers</span>
            <Car className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{activeDrivers}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Active</div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalStatsBar;
