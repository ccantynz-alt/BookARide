import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, DollarSign, AlertTriangle, Users, Car, 
  CheckCircle, RefreshCw, TrendingUp, Plane, ArrowUpRight, Activity
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import axios from 'axios';
import { API } from '../../config/api';

const DashboardStatsPanel = ({ bookings = [], drivers = [] }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculate stats from bookings
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const todayBookings = bookings.filter(b => b.date === today && b.status !== 'cancelled');
  const tomorrowBookings = bookings.filter(b => b.date === tomorrow && b.status !== 'cancelled');
  
  const unassignedToday = todayBookings.filter(b => !b.driver_id && !b.driver_name && !b.assignedDriver);
  const unpaidToday = todayBookings.filter(b => b.payment_status !== 'paid' && b.payment_status !== 'cash');
  const pendingApproval = bookings.filter(b => b.status === 'pending_approval');
  
  // Return bookings for today (where returnDate = today)
  const returnBookingsToday = bookings.filter(b => 
    b.returnDate === today && b.returnTime && b.status !== 'cancelled'
  );

  // Calculate today's revenue
  const todayRevenue = todayBookings.reduce((sum, b) => {
    const price = b.pricing?.totalPrice || b.totalPrice || 0;
    return sum + (typeof price === 'number' ? price : parseFloat(price) || 0);
  }, 0);

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
  }, []);

  const runErrorCheck = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/admin/run-error-check`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchSystemHealth();
    } catch (error) {
      console.error('Error running check:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const activeDrivers = drivers.filter(d => d.status === 'active').length;

  return (
    <div className="space-y-4 mb-6">
      {/* Executive Stats Bar */}
      <div className="bg-slate-900 rounded-xl p-4 shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Today's Pickups */}
          <div className={`rounded-lg p-3 ${unassignedToday.length > 0 ? 'bg-red-500/20 border border-red-500/30' : 'bg-slate-800'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Today</span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white">{todayBookings.length}</div>
            {unassignedToday.length > 0 && (
              <div className="text-xs text-red-400 font-medium mt-1">{unassignedToday.length} unassigned</div>
            )}
          </div>

          {/* Tomorrow */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Tomorrow</span>
              <Clock className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white">{tomorrowBookings.length}</div>
          </div>

          {/* Returns Today */}
          <div className={`rounded-lg p-3 ${returnBookingsToday.length > 0 ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-slate-800'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Returns</span>
              <ArrowUpRight className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{returnBookingsToday.length}</div>
            <div className="text-xs text-purple-400 mt-1">pickup today</div>
          </div>

          {/* Revenue */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">${todayRevenue.toFixed(0)}</div>
          </div>

          {/* Pending */}
          <div className={`rounded-lg p-3 ${(unpaidToday.length + pendingApproval.length) > 0 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-slate-800'}`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Pending</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{unpaidToday.length + pendingApproval.length}</div>
            {unpaidToday.length > 0 && <div className="text-xs text-amber-400 mt-1">{unpaidToday.length} unpaid</div>}
          </div>

          {/* Drivers */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Drivers</span>
              <Car className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-white">{activeDrivers}</div>
            <div className="text-xs text-slate-500 mt-1">active</div>
          </div>
        </div>

        {/* System Status Bar */}
        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${getHealthColor(systemHealth?.health_status)} animate-pulse`}></div>
            <span className="text-sm text-slate-300">{systemHealth?.health_message || 'Checking system...'}</span>
            {systemHealth?.latest_report?.issues_count > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded font-medium">
                {systemHealth.latest_report.issues_count} issues
              </span>
            )}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={runErrorCheck}
            disabled={loading}
            className="text-slate-400 hover:text-white hover:bg-slate-700 text-xs"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Activity className="w-3 h-3 mr-1" />}
            Run Check
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {(unassignedToday.length > 0 || pendingApproval.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-800">ACTION REQUIRED:</span>
            {unassignedToday.length > 0 && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {unassignedToday.length} TODAY pickup(s) need driver
              </span>
            )}
            {pendingApproval.length > 0 && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                {pendingApproval.length} awaiting approval
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatsPanel;
