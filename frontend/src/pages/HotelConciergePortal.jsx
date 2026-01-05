import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Calendar, Clock, MapPin, Phone, Mail, 
  Search, Plus, CheckCircle, XCircle, Eye, RefreshCw,
  Plane, LogOut, User, DollarSign, FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import SEO from '../components/SEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HotelConciergePortal = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hotelInfo, setHotelInfo] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Login form
  const [loginForm, setLoginForm] = useState({ hotelCode: '', password: '' });
  
  // New booking form
  const [bookingForm, setBookingForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    roomNumber: '',
    pickupDate: '',
    pickupTime: '',
    flightNumber: '',
    destination: 'auckland-airport',
    passengers: '1',
    luggage: '1',
    specialRequests: ''
  });

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('hotel_token');
    const hotel = localStorage.getItem('hotel_info');
    if (token && hotel) {
      setIsAuthenticated(true);
      setHotelInfo(JSON.parse(hotel));
      fetchBookings(token);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API}/hotel/login`, loginForm);
      
      if (response.data.success) {
        localStorage.setItem('hotel_token', response.data.token);
        localStorage.setItem('hotel_info', JSON.stringify(response.data.hotel));
        setIsAuthenticated(true);
        setHotelInfo(response.data.hotel);
        fetchBookings(response.data.token);
        toast.success(`Welcome, ${response.data.hotel.name}!`);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hotel_token');
    localStorage.removeItem('hotel_info');
    setIsAuthenticated(false);
    setHotelInfo(null);
    setBookings([]);
  };

  const fetchBookings = async (token) => {
    try {
      const response = await axios.get(`${API}/hotel/bookings`, {
        headers: { Authorization: `Bearer ${token || localStorage.getItem('hotel_token')}` }
      });
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const handleNewBooking = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('hotel_token');
      const response = await axios.post(`${API}/hotel/bookings`, bookingForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Transfer booked for ${bookingForm.guestName}! Ref: ${response.data.referenceNumber}`);
        setShowNewBooking(false);
        setBookingForm({
          guestName: '', guestEmail: '', guestPhone: '', roomNumber: '',
          pickupDate: '', pickupTime: '', flightNumber: '', destination: 'auckland-airport',
          passengers: '1', luggage: '1', specialRequests: ''
        });
        fetchBookings(token);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.roomNumber?.includes(searchTerm) ||
    b.referenceNumber?.toString().includes(searchTerm)
  );

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <SEO 
          title="Hotel Concierge Portal | BookaRide Partner Login"
          description="Hotel partner portal for booking guest airport transfers. Manage transfers, track bookings, and provide seamless service for your guests."
        />
        
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-black" />
            </div>
            <CardTitle className="text-2xl">Hotel Concierge Portal</CardTitle>
            <p className="text-gray-500 text-sm mt-2">Book airport transfers for your guests</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>Hotel Code</Label>
                <Input
                  required
                  placeholder="Enter your hotel code"
                  value={loginForm.hotelCode}
                  onChange={(e) => setLoginForm({...loginForm, hotelCode: e.target.value})}
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Not a partner yet?</p>
              <a href="/travel-agents" className="text-gold hover:underline">Apply for partnership</a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main Portal
  return (
    <div className="min-h-screen bg-gray-100">
      <SEO title={`${hotelInfo?.name || 'Hotel'} - Concierge Portal | BookaRide`} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900">{hotelInfo?.name}</h1>
              <p className="text-xs text-gray-500">Concierge Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setShowNewBooking(true)} 
              className="bg-gold hover:bg-gold/90 text-black"
            >
              <Plus className="w-4 h-4 mr-2" /> New Transfer
            </Button>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gold">{bookings.length}</div>
              <div className="text-sm text-gray-500">Total Bookings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-500">Confirmed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">
                {bookings.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by guest name, room, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => fetchBookings()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guest</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destination</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No bookings found. Create your first guest transfer!
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-sm">#{booking.referenceNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{booking.guestName}</div>
                          <div className="text-xs text-gray-500">{booking.guestEmail}</div>
                        </td>
                        <td className="px-4 py-3">{booking.roomNumber || '-'}</td>
                        <td className="px-4 py-3">
                          <div>{booking.pickupDate}</div>
                          <div className="text-xs text-gray-500">{booking.pickupTime}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">{booking.destination}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* New Booking Modal */}
      {showNewBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Book Guest Transfer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNewBooking} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Guest Name *</Label>
                    <Input
                      required
                      value={bookingForm.guestName}
                      onChange={(e) => setBookingForm({...bookingForm, guestName: e.target.value})}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label>Room Number</Label>
                    <Input
                      value={bookingForm.roomNumber}
                      onChange={(e) => setBookingForm({...bookingForm, roomNumber: e.target.value})}
                      placeholder="e.g. 1205"
                    />
                  </div>
                  <div>
                    <Label>Guest Email *</Label>
                    <Input
                      type="email"
                      required
                      value={bookingForm.guestEmail}
                      onChange={(e) => setBookingForm({...bookingForm, guestEmail: e.target.value})}
                      placeholder="guest@email.com"
                    />
                  </div>
                  <div>
                    <Label>Guest Phone *</Label>
                    <Input
                      type="tel"
                      required
                      value={bookingForm.guestPhone}
                      onChange={(e) => setBookingForm({...bookingForm, guestPhone: e.target.value})}
                      placeholder="+64..."
                    />
                  </div>
                  <div>
                    <Label>Pickup Date *</Label>
                    <Input
                      type="date"
                      required
                      value={bookingForm.pickupDate}
                      onChange={(e) => setBookingForm({...bookingForm, pickupDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Pickup Time *</Label>
                    <Input
                      type="time"
                      required
                      value={bookingForm.pickupTime}
                      onChange={(e) => setBookingForm({...bookingForm, pickupTime: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Flight Number</Label>
                    <Input
                      value={bookingForm.flightNumber}
                      onChange={(e) => setBookingForm({...bookingForm, flightNumber: e.target.value})}
                      placeholder="e.g. NZ123"
                    />
                  </div>
                  <div>
                    <Label>Destination *</Label>
                    <Select
                      value={bookingForm.destination}
                      onValueChange={(v) => setBookingForm({...bookingForm, destination: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auckland-airport">Auckland Airport</SelectItem>
                        <SelectItem value="auckland-cbd">Auckland CBD</SelectItem>
                        <SelectItem value="cruise-terminal">Cruise Terminal</SelectItem>
                        <SelectItem value="other">Other (specify in notes)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Passengers *</Label>
                    <Select
                      value={bookingForm.passengers}
                      onValueChange={(v) => setBookingForm({...bookingForm, passengers: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} passenger{n > 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Luggage Items</Label>
                    <Select
                      value={bookingForm.luggage}
                      onValueChange={(v) => setBookingForm({...bookingForm, luggage: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0,1,2,3,4,5,6,7,8].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} item{n !== 1 ? 's' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Special Requests</Label>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm({...bookingForm, specialRequests: e.target.value})}
                    placeholder="Child seat, wheelchair access, specific pickup location..."
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowNewBooking(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gold hover:bg-gold/90 text-black" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Booking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default HotelConciergePortal;
