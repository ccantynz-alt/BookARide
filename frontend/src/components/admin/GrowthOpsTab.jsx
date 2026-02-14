import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, ShieldCheck, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const GrowthOpsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/ops-intelligence`, getAuthHeaders());
      setData(response.data);
    } catch (error) {
      console.error('Ops intelligence load failed:', error);
      toast.error('Failed to load ops intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) {
    return (
      <div className="text-center py-12">
        {loading ? 'Loading ops intelligence...' : 'No ops intelligence data'}
      </div>
    );
  }

  const funnel = data.funnel_conversion || {};
  const customerFlags = data.customer_value_flags || [];
  const driverSla = data.driver_sla_metrics || {};
  const drivers = driverSla.drivers || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Intelligence
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500">Leads</p>
            <p className="text-2xl font-bold">{funnel.leads || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500">Bookings</p>
            <p className="text-2xl font-bold">{funnel.bookings_created || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500">Confirmed / Completed</p>
            <p className="text-2xl font-bold text-blue-600">{funnel.confirmed_or_completed || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500">Lead → Booking</p>
            <p className="text-2xl font-bold text-emerald-600">{funnel.lead_to_booking_rate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-gray-500">Booking → Completion</p>
            <p className="text-2xl font-bold text-violet-600">{funnel.booking_to_completion_rate || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customer Value Flags
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[520px] overflow-y-auto space-y-2">
            {customerFlags.slice(0, 25).map((c) => (
              <div key={c.email} className="border rounded p-2 text-sm">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.name || c.email}</p>
                    <p className="text-xs text-gray-500">{c.email}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 h-fit">{c.tier}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Trips: {c.trip_count} • Spend: ${Number(c.total_spend || 0).toFixed(2)} • Last trip: {c.last_trip_date || 'N/A'}
                </p>
                {c.churn_risk && <p className="text-xs text-red-600">Churn risk: repeated cancellations</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Driver SLA Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm border rounded p-3 bg-emerald-50 border-emerald-100">
              Assignment coverage: <span className="font-bold">{driverSla.assignment_coverage_percent || 0}%</span>
            </div>
            <div className="space-y-2 max-h-[440px] overflow-y-auto">
              {drivers.slice(0, 30).map((d) => (
                <div key={d.driver_key} className="border rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{d.driver_name || d.driver_key}</p>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {d.assigned_jobs} assigned
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Completed: {d.completed_jobs} • Pending: {d.pending_jobs}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Funnel / Conversion Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500">Leads</p>
              <p className="text-xl font-bold">{funnel.leads || 0}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500">Bookings Created</p>
              <p className="text-xl font-bold">{funnel.bookings_created || 0}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500">Confirmed + Completed</p>
              <p className="text-xl font-bold">{funnel.confirmed_or_completed || 0}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-xl font-bold">{funnel.completed || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GrowthOpsTab;
