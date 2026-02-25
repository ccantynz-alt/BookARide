import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { User, Phone, Mail, Car, Plus, Edit2, Trash2, Calendar, MapPin, Key } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DriversTab = () => {
  const [drivers, setDrivers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedDriverForPassword, setSelectedDriverForPassword] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    license_number: '',
    status: 'active',
    notes: ''
  });

  useEffect(() => {
    fetchDrivers();
    fetchBookings();
  }, []);

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/drivers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDrivers(response.data.drivers || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleOpenDriverModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        name: driver.name,
        phone: driver.phone,
        email: driver.email,
        license_number: driver.license_number,
        status: driver.status,
        notes: driver.notes || ''
      });
    } else {
      setEditingDriver(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        license_number: '',
        status: 'active',
        notes: ''
      });
    }
    setShowDriverModal(true);
  };

  const handleSaveDriver = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      if (editingDriver) {
        // Update existing driver
        await axios.put(`${API}/drivers/${editingDriver.id}`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Driver updated successfully!');
      } else {
        // Create new driver
        await axios.post(`${API}/drivers`, formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        toast.success('Driver created successfully!');
      }
      
      setShowDriverModal(false);
      fetchDrivers();
    } catch (error) {
      console.error('Error saving driver:', error);
      toast.error('Failed to save driver');
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API}/drivers/${driverId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Driver deleted successfully!');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error('Failed to delete driver');
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(`${API}/drivers/set-password`, {
        driver_id: selectedDriverForPassword.id,
        password: newPassword
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Password set successfully!');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedDriverForPassword(null);
      // Refresh drivers list
      fetchDrivers();
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error(error.response?.data?.detail || 'Failed to set password');
      setShowPasswordModal(false);
    }
  };

  const openPasswordModal = (driver) => {
    setSelectedDriverForPassword(driver);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const handleAssignDriver = async (driverId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API}/drivers/${driverId}/assign?booking_id=${selectedBooking.id}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      toast.success('Driver assigned successfully!');
      setShowAssignModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const getDriverBookings = (driverId) => {
    return bookings.filter(b => b.driver_id === driverId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on_leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading drivers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
          <p className="text-gray-600">Manage your drivers and assignments</p>
        </div>
        <Button onClick={() => handleOpenDriverModal()} className="bg-gold hover:bg-gold/90 text-black">
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gold border-none">
          <CardContent className="p-6">
            <p className="text-sm text-white/80 mb-1">Total Drivers</p>
            <p className="text-3xl font-bold text-white">{drivers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gold border-none">
          <CardContent className="p-6">
            <p className="text-sm text-white/80 mb-1">Active Drivers</p>
            <p className="text-3xl font-bold text-white">
              {drivers.filter(d => d.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gold border-none">
          <CardContent className="p-6">
            <p className="text-sm text-white/80 mb-1">Assigned Today</p>
            <p className="text-3xl font-bold text-white">
              {drivers.filter(d => getDriverBookings(d.id).some(b => 
                b.date === new Date().toISOString().split('T')[0]
              )).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drivers.map((driver) => {
          const driverBookings = getDriverBookings(driver.id);
          const todayBookings = driverBookings.filter(b => 
            b.date === new Date().toISOString().split('T')[0]
          );
          
          return (
            <Card key={driver.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{driver.name}</CardTitle>
                      <span className={`inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                        {driver.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openPasswordModal(driver)}
                            title="Set Driver Password">
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleOpenDriverModal(driver)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteDriver(driver.id)}
                            className="text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="w-4 h-4 mr-2" />
                  {driver.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="w-4 h-4 mr-2" />
                  {driver.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Car className="w-4 h-4 mr-2" />
                  License: {driver.license_number}
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-500">{driverBookings.length} assigned jobs</p>
                </div>
                
                {driver.notes && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 italic">{driver.notes}</p>
                  </div>
                )}

                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-900">Today's Schedule</p>
                    <span className="text-sm text-gray-600">{todayBookings.length} bookings</span>
                  </div>
                  {todayBookings.length > 0 ? (
                    <div className="space-y-2">
                      {todayBookings.slice(0, 3).map((booking) => (
                        <div key={booking.id} className="p-2 bg-gray-50 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{booking.time}</span>
                            <span className="text-xs text-gray-600">{booking.serviceType}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1 flex items-start">
                            <MapPin className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span>{booking.pickupAddress.split(',')[0]} → {booking.dropoffAddress.split(',')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No bookings scheduled today</p>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    Total Assignments: <span className="font-bold text-gray-900">{driverBookings.length}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {drivers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Drivers Yet</h3>
            <p className="text-gray-600 mb-4">Add your first driver to start managing assignments</p>
            <Button onClick={() => handleOpenDriverModal()} className="bg-gold hover:bg-gold/90 text-black">
              <Plus className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Driver Form Modal */}
      <Dialog open={showDriverModal} onOpenChange={setShowDriverModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="John Smith"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+64 21 123 4567"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="license">Driver's License Number *</Label>
              <Input
                id="license"
                value={formData.license_number}
                onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                placeholder="AB123456"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Any additional notes about this driver..."
                className="mt-1"
                rows={3}
              />
            </div>

            {editingDriver && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Driver Portal Access:</strong> To allow this driver to log in and view their schedule,
                  you need to set their password separately after saving.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDriverModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDriver} className="bg-gold hover:bg-gold/90 text-black">
                {editingDriver ? 'Update Driver' : 'Add Driver'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Driver Portal Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Driver:</strong> {selectedDriverForPassword?.name}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Login Email:</strong> {selectedDriverForPassword?.email}
              </p>
            </div>

            <div>
              <Label htmlFor="new-password">New Password *</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="mt-1"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                The driver will use their email and this password to log in at: /driver/login
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetPassword} className="bg-gold hover:bg-gold/90 text-black">
                Set Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
