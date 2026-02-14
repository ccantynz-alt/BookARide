import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import axios from 'axios';
import { toast } from 'sonner';

import { API } from '../../config/api';

export const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/analytics/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAnalytics(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/export/csv`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center py-12">No analytics data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.summary.total}</p>
              </div>
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">{analytics.summary.confirmed}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{analytics.summary.pending}</p>
              </div>
              <Users className="w-10 h-10 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gold">${analytics.summary.revenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-10 h-10 text-gold" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={handleExportCSV} className="bg-gold hover:bg-gold/90 text-black">
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Revenue Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenue_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Booking Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Trends (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.booking_trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#D4AF37" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Popular Routes */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popular_routes.map((route, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center mr-3">
                    <span className="text-gold font-bold">{index + 1}</span>
                  </div>
                  <span className="font-medium">{route.route}</span>
                </div>
                <span className="text-gray-600">{route.count} bookings</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
