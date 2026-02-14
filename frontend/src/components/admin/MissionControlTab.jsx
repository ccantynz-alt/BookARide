import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, ShieldCheck, Truck, BellRing } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import UrgentNotificationsCenter from './UrgentNotificationsCenter';
import ConfirmationStatusPanel from './ConfirmationStatusPanel';
import ReturnsOverviewPanel from './ReturnsOverviewPanel';
import TodaysOperationsPanel from './TodaysOperationsPanel';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const MissionControlTab = ({
  bookings = [],
  drivers = [],
  onAssignDriver,
  onViewBooking,
  onSendReminder,
}) => {
  const [queue, setQueue] = useState([]);
  const [summary, setSummary] = useState({
    total_items: 0,
    requires_driver_assignment: 0,
    manual_approval_required: 0,
  });
  const [loading, setLoading] = useState(false);

  const bookingById = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => map.set(b.id, b));
    return map;
  }, [bookings]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchMissionControl = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/mission-control?limit=40`, getAuthHeaders());
      setQueue(response.data.urgent_queue || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Mission control load failed:', error);
      toast.error('Failed to load mission control queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissionControl();
    const timer = setInterval(fetchMissionControl, 45000);
    return () => clearInterval(timer);
  }, []);

  const resolveBooking = (bookingId) => bookingById.get(bookingId) || { id: bookingId };

  const runPrimaryAction = (item) => {
    const booking = resolveBooking(item.booking_id);
    const reasonBlob = (item.reasons || []).join(' ').toLowerCase();

    if (reasonBlob.includes('driver')) {
      onAssignDriver?.(booking);
      return;
    }
    if (reasonBlob.includes('reminder')) {
      onSendReminder?.(item.booking_id, item.customer_name);
      return;
    }
    onViewBooking?.(booking);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Urgent Queue</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_items || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Needs Driver</p>
                <p className="text-2xl font-bold text-amber-600">{summary.requires_driver_assignment || 0}</p>
              </div>
              <Truck className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Manual Approval</p>
                <p className="text-2xl font-bold text-blue-600">{summary.manual_approval_required || 0}</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-500" />
            Mission Control Queue
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchMissionControl} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 ? (
            <p className="text-sm text-gray-500">No urgent actions right now.</p>
          ) : (
            queue.map((item) => (
              <div
                key={`${item.booking_id}-${item.priority_score}`}
                className="border rounded-lg p-3 bg-red-50/40 border-red-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.booking_ref} - {item.customer_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.date} {item.time} • Priority {item.priority_score}
                    </p>
                    <ul className="list-disc ml-5 mt-1 text-sm text-gray-700">
                      {(item.reasons || []).slice(0, 3).map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => runPrimaryAction(item)}>
                      {item.suggested_action || 'Take Action'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onViewBooking?.(resolveBooking(item.booking_id))}>
                      Open
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <UrgentNotificationsCenter
        bookings={bookings}
        drivers={drivers}
        onAssignDriver={onAssignDriver}
        onViewBooking={onViewBooking}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ConfirmationStatusPanel bookings={bookings} />
        <ReturnsOverviewPanel bookings={bookings} drivers={drivers} onViewBooking={onViewBooking} />
      </div>

      <TodaysOperationsPanel bookings={bookings} onViewBooking={onViewBooking} />
    </div>
  );
};

export default MissionControlTab;
