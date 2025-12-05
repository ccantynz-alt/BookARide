import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Filter, Mail, DollarSign, CheckCircle, XCircle, Clock, Eye, Edit2, BarChart3, Users, BookOpen, Car, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { DriversTab } from '../components/admin/DriversTab';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchBookings();
    fetchDrivers();
  }, [navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  const fetchBookings = async () => {
    try {
      const response = await axios.get(`${API}/bookings`, getAuthHeaders());
      setBookings(response.data);
      setLoading(false);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuth');
        navigate('/admin/login');
        return;
      }
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
      setLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API}/drivers`, getAuthHeaders());
      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }
    
    try {
      await axios.patch(
        `${API}/drivers/${selectedDriver}/assign?booking_id=${selectedBooking.id}`,
        {},
        getAuthHeaders()
      );
      toast.success('Driver assigned successfully!');
      setSelectedDriver('');
      fetchBookings();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.phone.includes(searchTerm) ||
        b.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  const openDetailsModal = (booking) => {
    setSelectedBooking(booking);
    setPriceOverride(booking.pricing.totalPrice.toString());
    setShowDetailsModal(true);
  };

  const openEmailModal = (booking) => {
    setSelectedBooking(booking);
    setEmailSubject(`Booking Confirmation - ${booking.serviceType}`);
    setEmailMessage(`Dear ${booking.name},\n\nYour booking has been confirmed!\n\nDetails:\nService: ${booking.serviceType}\nPickup: ${booking.pickupAddress}\nDrop-off: ${booking.dropoffAddress}\nDate: ${booking.date}\nTime: ${booking.time}\nPassengers: ${booking.passengers}\n\nTotal Price: $${booking.pricing.totalPrice.toFixed(2)}\n\nThank you for choosing Book A Ride NZ!`);
    setShowEmailModal(true);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await axios.patch(`${API}/bookings/${bookingId}`, { status: newStatus }, getAuthHeaders());
      toast.success('Status updated successfully');
      fetchBookings();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handlePriceOverride = async () => {
    try {
      const newPrice = parseFloat(priceOverride);
      if (isNaN(newPrice) || newPrice < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      await axios.patch(`${API}/bookings/${selectedBooking.id}`, {
        pricing: {
          ...selectedBooking.pricing,
          totalPrice: newPrice,
          overridden: true
        }
      }, getAuthHeaders());
      toast.success('Price updated successfully');
      setShowDetailsModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const handleSendEmail = async () => {
    try {
      await axios.post(`${API}/send-booking-email`, {
        bookingId: selectedBooking.id,
        email: selectedBooking.email,
        subject: emailSubject,
        message: emailMessage
      }, getAuthHeaders());
      toast.success('Email sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error('Please fill in all fields');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters');
        return;
      }
      
      // Call backend API to change password
      await axios.post(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, getAuthHeaders());
      
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
        return;
      }
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    totalRevenue: bookings.reduce((sum, b) => sum + (b.pricing.totalPrice || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-white/70">Manage bookings and customer communications</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/admin/seo')} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
                <Settings className="w-4 h-4 mr-2" />
                SEO Management
              </Button>
              <Button onClick={() => setShowPasswordModal(true)} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
                Change Password
              </Button>
              <Button onClick={handleLogout} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <Tabs defaultValue="bookings" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Drivers
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Clock className="w-10 h-10 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Confirmed</p>
                  <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                  <p className="text-3xl font-bold text-gold">${stats.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-gold" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, email, phone, or address..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No bookings found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Service</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Route</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Price</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">{booking.date}</div>
                          <div className="text-xs text-gray-500">{booking.time}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-medium text-gray-900">{booking.name}</div>
                          <div className="text-xs text-gray-500">{booking.email}</div>
                          <div className="text-xs text-gray-500">{booking.phone}</div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-gray-700">{booking.serviceType}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-xs text-gray-600 max-w-xs">
                            <div className="truncate">From: {booking.pickupAddress}</div>
                            <div className="truncate">To: {booking.dropoffAddress}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-semibold text-gray-900">${booking.pricing.totalPrice.toFixed(2)}</div>
                          <div className="text-xs text-gray-500">{booking.pricing.distance}km</div>
                        </td>
                        <td className="p-4">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                  {booking.status}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailsModal(booking)}
                              className="hover:bg-gray-100"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEmailModal(booking)}
                              className="hover:bg-gold hover:text-black"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers">
            <DriversTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedBooking.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedBooking.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers:</span>
                    <p className="font-medium">{selectedBooking.passengers}</p>
                  </div>
                </div>
              </div>

              {/* Trip Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <p className="font-medium">{selectedBooking.serviceType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Pickup:</span>
                    <p className="font-medium">{selectedBooking.pickupAddress}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Drop-off:</span>
                    <p className="font-medium">{selectedBooking.dropoffAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{selectedBooking.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <p className="font-medium">{selectedBooking.time}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Info */}
              {(selectedBooking.departureFlightNumber || selectedBooking.arrivalFlightNumber) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Flight Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.departureFlightNumber && (
                      <div>
                        <span className="text-gray-600">Departure Flight:</span>
                        <p className="font-medium">{selectedBooking.departureFlightNumber}</p>
                        {selectedBooking.departureTime && <p className="text-xs text-gray-500">{selectedBooking.departureTime}</p>}
                      </div>
                    )}
                    {selectedBooking.arrivalFlightNumber && (
                      <div>
                        <span className="text-gray-600">Arrival Flight:</span>
                        <p className="font-medium">{selectedBooking.arrivalFlightNumber}</p>
                        {selectedBooking.arrivalTime && <p className="text-xs text-gray-500">{selectedBooking.arrivalTime}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pricing Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Distance:</span>
                    <span className="font-medium">{selectedBooking.pricing.distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span className="font-medium">${selectedBooking.pricing.basePrice.toFixed(2)}</span>
                  </div>
                  {selectedBooking.pricing.airportFee > 0 && (
                    <div className="flex justify-between">
                      <span>Airport Fee:</span>
                      <span className="font-medium">${selectedBooking.pricing.airportFee.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.pricing.passengerFee > 0 && (
                    <div className="flex justify-between">
                      <span>Passenger Fee:</span>
                      <span className="font-medium">${selectedBooking.pricing.passengerFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold text-base">
                    <span>Total:</span>
                    <span className="text-gold">${selectedBooking.pricing.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Price Override */}
                <div className="mt-4">
                  <Label>Override Price</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={priceOverride}
                      onChange={(e) => setPriceOverride(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handlePriceOverride} className="bg-gold hover:bg-gold/90 text-black">
                      Update Price
                    </Button>
                  </div>
                </div>
              </div>

              {/* Driver Assignment */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Driver Assignment</h3>
                {selectedBooking.driver_id ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Assigned Driver</p>
                        <p className="font-medium text-gray-900">
                          {drivers.find(d => d.id === selectedBooking.driver_id)?.name || 'Unknown Driver'}
                        </p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDriver('')}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Change Driver
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">No driver assigned yet</p>
                    <div className="flex gap-2">
                      <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a driver..." />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.filter(d => d.status === 'active').map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              {driver.name} - {driver.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleAssignDriver}
                        disabled={!selectedDriver}
                        className="bg-gold hover:bg-gold/90 text-black"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to Customer</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>To:</Label>
                <Input value={selectedBooking.email} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>Subject:</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <Label>Message:</Label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Email message"
                  rows={10}
                />
              </div>
              <Button onClick={handleSendEmail} className="w-full bg-gold hover:bg-gold/90 text-black">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                className="bg-gold hover:bg-gold/90 text-black"
              >
                Change Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
