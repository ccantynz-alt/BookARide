import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Phone, Mail, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DriverPortal = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const driverData = localStorage.getItem('driverAuth');
    if (!driverData) {
      navigate('/driver/login');
      return;
    }
    
    const parsedDriver = JSON.parse(driverData);
    setDriver(parsedDriver);
    fetchAssignedBookings(parsedDriver.id);
  }, [navigate, selectedDate]);

  const fetchAssignedBookings = async (driverId) => {
    try {
      const token = localStorage.getItem('driverToken');
      const response = await axios.get(`${API}/drivers/${driverId}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { date: selectedDate }
      });
      setBookings(response.data.bookings || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      if (error.response?.status === 401) {
        handleLogout();
      }
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driverAuth');
    localStorage.removeItem('driverToken');
    navigate('/driver/login');
    toast.success('Logged out successfully');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const todayBookings = bookings.filter(b => b.date === selectedDate);
  const upcomingBookings = bookings.filter(b => b.date > selectedDate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-1">Driver Portal</h1>
              <p className="text-white/70">Welcome back, {driver?.name}!</p>
            </div>
            <Button onClick={handleLogout} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Today's Jobs</p>
              <p className="text-3xl font-bold text-gray-900">{todayBookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Upcoming Jobs</p>
              <p className="text-3xl font-bold text-gold">{upcomingBookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-gray-600 mb-1">Total This Week</p>
              <p className="text-3xl font-bold text-green-600">{bookings.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Date Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Today's Schedule - {selectedDate}</CardTitle>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No jobs scheduled for this date</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <Card key={booking.id} className="border-l-4 border-l-gold">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {booking.serviceType.replace('-', ' ').toUpperCase()}
                          </h3>
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gold">${booking.driver_price?.toFixed(2) || '0.00'}</p>
                          <p className="text-sm text-gray-600">Payment</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="font-medium">Time:</span>
                            <span className="ml-2">{booking.time}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Users className="w-4 h-4 mr-2" />
                            <span className="font-medium">Passengers:</span>
                            <span className="ml-2">{booking.passengers}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Phone className="w-4 h-4 mr-2" />
                            <span className="font-medium">Customer:</span>
                            <span className="ml-2">{booking.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="ml-2">{booking.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <MapPin className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">PICKUP</p>
                              <p className="text-sm text-gray-900">{booking.pickupAddress}</p>
                            </div>
                          </div>
                          <div className="flex items-start">
                            <MapPin className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                              <p className="text-xs text-gray-600 font-medium">DROP-OFF</p>
                              <p className="text-sm text-gray-900">{booking.dropoffAddress}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-gray-900">
                            <span className="font-semibold">Special Notes: </span>
                            {booking.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverPortal;
