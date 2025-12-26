import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, DollarSign, AlertTriangle, Users, Car, 
  CheckCircle, XCircle, RefreshCw, TrendingUp, Plane
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
  
  // Return bookings for today
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
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Today's Bookings */}
        <Card className={`${unassignedToday.length > 0 ? 'border-red-400 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Calendar className={`w-5 h-5 ${unassignedToday.length > 0 ? 'text-red-600' : 'text-blue-600'}`} />
              <span className="text-2xl font-bold">{todayBookings.length}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Today's Bookings</p>
            {unassignedToday.length > 0 && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                ⚠️ {unassignedToday.length} unassigned!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tomorrow's Bookings */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold">{tomorrowBookings.length}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Tomorrow</p>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-xl font-bold">${todayRevenue.toFixed(0)}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Today's Revenue</p>
          </CardContent>
        </Card>

        {/* Return Trips Today */}
        <Card className={`${returnBookingsToday.length > 0 ? 'border-purple-400 bg-purple-50' : 'border-gray-200'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <RefreshCw className={`w-5 h-5 ${returnBookingsToday.length > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
              <span className="text-2xl font-bold">{returnBookingsToday.length}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Return Trips Today</p>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card className={`${(unpaidToday.length + pendingApproval.length) > 0 ? 'border-amber-400 bg-amber-50' : 'border-gray-200'}`}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <AlertTriangle className={`w-5 h-5 ${(unpaidToday.length + pendingApproval.length) > 0 ? 'text-amber-600' : 'text-gray-400'}`} />
              <span className="text-2xl font-bold">{unpaidToday.length + pendingApproval.length}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Pending Actions</p>
            {unpaidToday.length > 0 && (
              <p className="text-xs text-amber-600">💳 {unpaidToday.length} unpaid</p>
            )}
          </CardContent>
        </Card>

        {/* Active Drivers */}
        <Card className="border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <Car className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-bold">{drivers.filter(d => d.status === 'active').length}</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Active Drivers</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {(unassignedToday.length > 0 || pendingApproval.length > 0) && (
        <Card className="border-red-400 bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
                <span className="font-semibold text-red-800">CRITICAL ALERTS:</span>
              </div>
              
              {unassignedToday.length > 0 && (
                <div className="flex items-center gap-1 bg-red-200 px-2 py-1 rounded">
                  <Users className="w-4 h-4 text-red-700" />
                  <span className="text-sm text-red-800 font-medium">
                    {unassignedToday.length} TODAY booking(s) need driver!
                  </span>
                </div>
              )}
              
              {pendingApproval.length > 0 && (
                <div className="flex items-center gap-1 bg-amber-200 px-2 py-1 rounded">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span className="text-sm text-amber-800 font-medium">
                    {pendingApproval.length} awaiting approval
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health Bar */}
      <div className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${getHealthColor(systemHealth?.health_status)}`}></div>
          <span className="text-sm font-medium">
            System: {systemHealth?.health_message || 'Checking...'}
          </span>
          {systemHealth?.latest_report?.issues_count > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
              {systemHealth.latest_report.issues_count} issues
            </span>
          )}
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={runErrorCheck}
          disabled={loading}
          className="text-xs h-7"
        >
          {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Run Check'}
        </Button>
      </div>
    </div>
  );
};

export default DashboardStatsPanel;
