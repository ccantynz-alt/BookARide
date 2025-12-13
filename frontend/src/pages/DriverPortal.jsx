import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Phone, Mail, LogOut, DollarSign, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DriverPortal = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('driverAuth');
    localStorage.removeItem('driverToken');
    navigate('/driver/login');
    toast.success('Logged out successfully');
  }, [navigate]);

  const fetchAssignedBookings = React.useCallback(async (driverId) => {
    try {
      const token = localStorage.getItem('driverToken');
      const response = await axios.get(`${API}/drivers/${driverId}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
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
  }, [handleLogout]);

  useEffect(() => {
    const driverData = localStorage.getItem('driverAuth');
    if (!driverData) {
      navigate('/driver/login');
      return;
    }
    
    const parsedDriver = JSON.parse(driverData);
    setDriver(parsedDriver);
    fetchAssignedBookings(parsedDriver.id);
  }, [navigate, fetchAssignedBookings]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === today);
  const upcomingBookings = bookings.filter(b => b.date > today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const completedBookings = bookings.filter(b => b.status === 'completed');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  // Calculate earnings (driver gets 85% of each job)
  const totalEarnings = bookings.reduce((sum, b) => sum + (b.driver_price || 0), 0);
  const completedEarnings = completedBookings.reduce((sum, b) => sum + (b.driver_price || 0), 0);
  const pendingEarnings = confirmedBookings.reduce((sum, b) => sum + (b.driver_price || 0), 0);
  const todayEarnings = todayBookings.reduce((sum, b) => sum + (b.driver_price || 0), 0);

  // Get this week's bookings
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekBookings = bookings.filter(b => new Date(b.date) >= startOfWeek);
  const weekEarnings = weekBookings.reduce((sum, b) => sum + (b.driver_price || 0), 0);

  const BookingCard = ({ booking, showDate = false }) => (
    <Card className="border-l-4 border-l-gold hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {booking.serviceType?.replace('-', ' ').toUpperCase() || 'SHUTTLE'}
            </h3>
            <Badge className={`${getStatusColor(booking.status)} border`}>
              {booking.status?.toUpperCase()}
            </Badge>
            {showDate && (
              <p className="text-sm text-gray-600 mt-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                {new Date(booking.date).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">${booking.driver_price?.toFixed(2) || '0.00'}</p>
            <p className="text-xs text-gray-500">Your Earnings (85%)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2 text-gold" />
              <span className="font-medium">Time:</span>
              <span className="ml-2">{booking.time}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2 text-gold" />
              <span className="font-medium">Passengers:</span>
              <span className="ml-2">{booking.passengers}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gold" />
              <span className="font-medium">{booking.name}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2 text-gold" />
              <span className="ml-2">{booking.phone}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t space-y-3">
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-2 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs text-gray-500 font-medium">PICKUP</p>
              <p className="text-sm text-gray-900">{booking.pickupAddress}</p>
            </div>
          </div>
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-2 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-xs text-gray-500 font-medium">DROP-OFF</p>
              <p className="text-sm text-gray-900">{booking.dropoffAddress}</p>
            </div>
          </div>
        </div>

        {booking.notes && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">📝 Notes: </span>
              {booking.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80 mb-1">Today's Earnings</p>
                  <p className="text-2xl font-bold">${todayEarnings.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-xs text-white/70 mt-2">{todayBookings.length} jobs</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80 mb-1">This Week</p>
                  <p className="text-2xl font-bold">${weekEarnings.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-xs text-white/70 mt-2">{weekBookings.length} jobs</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80 mb-1">Upcoming</p>
                  <p className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-xs text-white/70 mt-2">{upcomingBookings.length} pending</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/80 mb-1">Completed</p>
                  <p className="text-2xl font-bold">${completedEarnings.toFixed(2)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-xs text-white/70 mt-2">{completedBookings.length} jobs done</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="schedule" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Today's Schedule
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Upcoming Jobs
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Earnings
            </TabsTrigger>
          </TabsList>

          {/* Today's Schedule */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gold" />
                  Today's Jobs - {new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No jobs scheduled for today</p>
                    <p className="text-gray-400 text-sm">Check the Upcoming Jobs tab for future bookings</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Jobs */}
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  Upcoming Jobs ({upcomingBookings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No upcoming jobs</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} showDate={true} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings">
            <div className="space-y-6">
              {/* Earnings Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gold" />
                    Earnings Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-xl mb-6">
                    <div className="text-center">
                      <p className="text-white/70 text-sm mb-2">Total Earnings (All Time)</p>
                      <p className="text-5xl font-bold text-gold">${totalEarnings.toFixed(2)}</p>
                      <p className="text-white/50 text-xs mt-2">You receive 85% of each booking</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-600 font-medium">Completed Jobs</p>
                      <p className="text-2xl font-bold text-green-700">${completedEarnings.toFixed(2)}</p>
                      <p className="text-xs text-green-500">{completedBookings.length} jobs</p>
                    </div>
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-600 font-medium">Pending Payment</p>
                      <p className="text-2xl font-bold text-yellow-700">${pendingEarnings.toFixed(2)}</p>
                      <p className="text-xs text-yellow-500">{confirmedBookings.length} upcoming</p>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-600 font-medium">This Week</p>
                      <p className="text-2xl font-bold text-blue-700">${weekEarnings.toFixed(2)}</p>
                      <p className="text-xs text-blue-500">{weekBookings.length} jobs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Completed Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  {completedBookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No completed jobs yet</p>
                  ) : (
                    <div className="space-y-3">
                      {completedBookings.slice(0, 10).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{booking.name}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(booking.date).toLocaleDateString('en-NZ')} • {booking.serviceType?.replace('-', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">+${booking.driver_price?.toFixed(2)}</p>
                            <Badge variant="outline" className="text-green-600 border-green-200">Completed</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Commission Info */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-amber-800 mb-2">How Earnings Work</h3>
                      <p className="text-amber-700 text-sm">
                        You receive <strong>85%</strong> of the total booking price for each job.
                        A 15% service fee is retained by BookaRide for platform maintenance,
                        customer support, and marketing.
                      </p>
                      <p className="text-amber-600 text-xs mt-2">
                        Example: $100 booking = $85 to you
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DriverPortal;
