import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Filter, Mail, DollarSign, CheckCircle, XCircle, Clock, Eye, Edit2, BarChart3, Users, BookOpen, Car, Settings, Trash2, MapPin, Calendar, RefreshCw, Send, Bell, Facebook, Globe, Square, CheckSquare, FileText, Smartphone, RotateCcw, AlertTriangle, Home } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { CustomDatePicker, CustomTimePicker } from '../components/DateTimePicker';
import axios from 'axios';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { DriversTab } from '../components/admin/DriversTab';
import { DriverApplicationsTab } from '../components/admin/DriverApplicationsTab';
import { LandingPagesTab } from '../components/admin/LandingPagesTab';
import { AdminBreadcrumb } from '../components/admin/AdminBreadcrumb';
import { initAutocompleteWithFix } from '../utils/fixGoogleAutocomplete';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const libraries = ['places'];

// Helper function to format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Helper function to get day of week from date string
const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to get short day of week
const getShortDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Helper function to check if date is today
const isToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const bookingDate = new Date(dateString);
  return (
    today.getFullYear() === bookingDate.getFullYear() &&
    today.getMonth() === bookingDate.getMonth() &&
    today.getDate() === bookingDate.getDate()
  );
};

// Helper function to check if date is tomorrow
const isTomorrow = (dateString) => {
  if (!dateString) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookingDate = new Date(dateString);
  return (
    tomorrow.getFullYear() === bookingDate.getFullYear() &&
    tomorrow.getMonth() === bookingDate.getMonth() &&
    tomorrow.getDate() === bookingDate.getDate()
  );
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);
  const additionalPickupRefs = useRef([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletedBookings, setDeletedBookings] = useState([]);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [xeroConnected, setXeroConnected] = useState(false);
  const [xeroOrg, setXeroOrg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailCC, setEmailCC] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    name: '',
    email: '',
    ccEmail: '',  // CC email for confirmation
    phone: '',
    serviceType: 'airport-shuttle',
    pickupAddress: '',
    pickupAddresses: [],  // Multiple pickups support
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    paymentMethod: 'pay-on-pickup',
    notes: '',
    flightArrivalNumber: '',
    flightArrivalTime: '',
    flightDepartureNumber: '',
    flightDepartureTime: '',
    // Return trip fields
    bookReturn: false,
    returnDate: '',
    returnTime: '',
    returnDepartureFlightNumber: '',
    returnDepartureTime: '',
    returnArrivalFlightNumber: '',
    returnArrivalTime: ''
  });
  const [bookingPricing, setBookingPricing] = useState({
    distance: 0,
    basePrice: 0,
    airportFee: 0,
    passengerFee: 0,
    totalPrice: 0
  });
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [manualPriceOverride, setManualPriceOverride] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  // Bulk delete state
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Preview confirmation modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewBookingInfo, setPreviewBookingInfo] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Refs for edit modal autocomplete
  const editPickupInputRef = useRef(null);
  const editDropoffInputRef = useRef(null);
  const editAdditionalPickupRefs = useRef([]);
  
  // Date/Time picker states for admin form
  const [adminPickupDate, setAdminPickupDate] = useState(null);
  const [adminPickupTime, setAdminPickupTime] = useState(null);
  const [adminReturnDate, setAdminReturnDate] = useState(null);
  const [adminReturnTime, setAdminReturnTime] = useState(null);
  const [adminFlightArrivalTime, setAdminFlightArrivalTime] = useState(null);
  const [adminFlightDepartureTime, setAdminFlightDepartureTime] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchBookings();
    fetchDrivers();
    checkXeroStatus();
  }, [navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  // Store cleanup functions for autocomplete instances
  const autocompleteCleanupRef = useRef([]);

  // Initialize Google Places Autocomplete for admin booking form
  useEffect(() => {
    if (!isLoaded || !showCreateBookingModal) return;

    // Clean up previous autocomplete instances
    autocompleteCleanupRef.current.forEach(cleanup => {
      if (cleanup) cleanup();
    });
    autocompleteCleanupRef.current = [];

    // Reset initialization flags for additional pickup refs
    additionalPickupRefs.current.forEach(ref => {
      if (ref) ref._autocompleteInitialized = false;
    });

    // Delay to ensure modal and inputs are fully rendered
    const timer = setTimeout(() => {
      try {
        if (window.google && window.google.maps && window.google.maps.places) {
          const autocompleteOptions = {
            fields: ['formatted_address', 'geometry', 'name']
          };

          // Initialize pickup autocomplete with fix
          if (pickupInputRef.current) {
            const pickupSetup = initAutocompleteWithFix(pickupInputRef.current, autocompleteOptions);
            if (pickupSetup && pickupSetup.autocomplete) {
              pickupSetup.autocomplete.addListener('place_changed', () => {
                const place = pickupSetup.autocomplete.getPlace();
                if (place && place.formatted_address) {
                  setNewBooking(prev => ({ ...prev, pickupAddress: place.formatted_address }));
                }
              });
              autocompleteCleanupRef.current.push(pickupSetup.cleanup);
            }
          }

          // Initialize dropoff autocomplete with fix
          if (dropoffInputRef.current) {
            const dropoffSetup = initAutocompleteWithFix(dropoffInputRef.current, autocompleteOptions);
            if (dropoffSetup && dropoffSetup.autocomplete) {
              dropoffSetup.autocomplete.addListener('place_changed', () => {
                const place = dropoffSetup.autocomplete.getPlace();
                if (place && place.formatted_address) {
                  setNewBooking(prev => ({ ...prev, dropoffAddress: place.formatted_address }));
                }
              });
              autocompleteCleanupRef.current.push(dropoffSetup.cleanup);
            }
          }

          // Initialize autocomplete for additional pickup addresses with fix
          additionalPickupRefs.current.forEach((ref, index) => {
            if (ref && !ref._autocompleteInitialized) {
              const additionalSetup = initAutocompleteWithFix(ref, autocompleteOptions);
              if (additionalSetup && additionalSetup.autocomplete) {
                additionalSetup.autocomplete.addListener('place_changed', () => {
                  const place = additionalSetup.autocomplete.getPlace();
                  if (place && place.formatted_address) {
                    // Use functional update to avoid stale closure
                    setNewBooking(prev => ({
                      ...prev,
                      pickupAddresses: prev.pickupAddresses.map((addr, i) => 
                        i === index ? place.formatted_address : addr
                      )
                    }));
                  }
                });
                ref._autocompleteInitialized = true;
                autocompleteCleanupRef.current.push(additionalSetup.cleanup);
              }
            }
          });

          console.log('✅ Google Places Autocomplete initialized for admin form with click fix');
        } else {
          console.warn('⚠️ Google Maps Places API not loaded yet');
        }
      } catch (error) {
        console.error('❌ Error initializing Google Places Autocomplete:', error);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      // Cleanup autocomplete instances when modal closes
      autocompleteCleanupRef.current.forEach(cleanup => {
        if (cleanup) cleanup();
      });
    };
  }, [isLoaded, showCreateBookingModal, newBooking.pickupAddresses.length]);

  // Initialize autocomplete for edit modal
  useEffect(() => {
    if (!isLoaded || !showEditBookingModal || !editingBooking) return;

    const timer = setTimeout(() => {
      try {
        if (window.google?.maps?.places) {
          const autocompleteOptions = {
            fields: ['formatted_address', 'geometry', 'name']
          };

          // Initialize pickup autocomplete for edit modal
          if (editPickupInputRef.current && !editPickupInputRef.current._autocompleteInitialized) {
            const pickupSetup = initAutocompleteWithFix(editPickupInputRef.current, autocompleteOptions);
            if (pickupSetup?.autocomplete) {
              pickupSetup.autocomplete.addListener('place_changed', () => {
                const place = pickupSetup.autocomplete.getPlace();
                if (place?.formatted_address) {
                  setEditingBooking(prev => ({ ...prev, pickupAddress: place.formatted_address }));
                }
              });
              editPickupInputRef.current._autocompleteInitialized = true;
            }
          }

          // Initialize dropoff autocomplete for edit modal
          if (editDropoffInputRef.current && !editDropoffInputRef.current._autocompleteInitialized) {
            const dropoffSetup = initAutocompleteWithFix(editDropoffInputRef.current, autocompleteOptions);
            if (dropoffSetup?.autocomplete) {
              dropoffSetup.autocomplete.addListener('place_changed', () => {
                const place = dropoffSetup.autocomplete.getPlace();
                if (place?.formatted_address) {
                  setEditingBooking(prev => ({ ...prev, dropoffAddress: place.formatted_address }));
                }
              });
              editDropoffInputRef.current._autocompleteInitialized = true;
            }
          }

          // Initialize additional pickup autocompletes for edit modal
          editAdditionalPickupRefs.current.forEach((ref, index) => {
            if (ref && !ref._autocompleteInitialized) {
              const setup = initAutocompleteWithFix(ref, autocompleteOptions);
              if (setup?.autocomplete) {
                setup.autocomplete.addListener('place_changed', () => {
                  const place = setup.autocomplete.getPlace();
                  if (place?.formatted_address) {
                    setEditingBooking(prev => ({
                      ...prev,
                      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? place.formatted_address : addr)
                    }));
                  }
                });
                ref._autocompleteInitialized = true;
              }
            }
          });

          console.log('✅ Google Places Autocomplete initialized for edit modal');
        }
      } catch (error) {
        console.error('❌ Error initializing autocomplete for edit modal:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoaded, showEditBookingModal, editingBooking?.pickupAddresses?.length]);

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
      // Sort bookings by date (newest first)
      const sortedBookings = response.data.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB - dateA;
      });
      setBookings(sortedBookings);
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

  const fetchDeletedBookings = async () => {
    setLoadingDeleted(true);
    try {
      const response = await axios.get(`${API}/bookings/deleted`, getAuthHeaders());
      setDeletedBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching deleted bookings:', error);
      toast.error('Failed to load deleted bookings');
    } finally {
      setLoadingDeleted(false);
    }
  };

  const checkXeroStatus = async () => {
    try {
      const response = await axios.get(`${API}/xero/status`, getAuthHeaders());
      setXeroConnected(response.data.connected);
      setXeroOrg(response.data.organization || '');
    } catch (error) {
      console.error('Error checking Xero status:', error);
    }
  };

  const connectXero = async () => {
    try {
      const response = await axios.get(`${API}/xero/login`, getAuthHeaders());
      window.open(response.data.authorization_url, '_blank');
      toast.info('Complete Xero authorization in the new window');
    } catch (error) {
      console.error('Error connecting Xero:', error);
      toast.error('Failed to connect Xero');
    }
  };

  const createXeroInvoice = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/xero/create-invoice/${bookingId}`, {}, getAuthHeaders());
      toast.success(response.data.message);
      fetchBookings();
    } catch (error) {
      console.error('Error creating Xero invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const recordXeroPayment = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/xero/record-payment/${bookingId}`, {}, getAuthHeaders());
      toast.success(response.data.message);
      fetchBookings();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleRestoreBooking = async (bookingId) => {
    try {
      await axios.post(`${API}/bookings/restore/${bookingId}`, {}, getAuthHeaders());
      toast.success('Booking restored successfully!');
      fetchDeletedBookings();
      fetchBookings();
    } catch (error) {
      console.error('Error restoring booking:', error);
      toast.error('Failed to restore booking');
    }
  };

  const handlePermanentDelete = async (bookingId) => {
    if (!window.confirm('This will PERMANENTLY delete this booking with NO way to recover. Are you sure?')) {
      return;
    }
    try {
      await axios.delete(`${API}/bookings/permanent/${bookingId}`, getAuthHeaders());
      toast.success('Booking permanently deleted');
      fetchDeletedBookings();
    } catch (error) {
      console.error('Error permanently deleting booking:', error);
      toast.error('Failed to permanently delete booking');
    }
  };

  const handleAssignDriver = async (tripType = 'outbound') => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }
    
    try {
      const response = await axios.patch(
        `${API}/drivers/${selectedDriver}/assign?booking_id=${selectedBooking.id}&trip_type=${tripType}`,
        {},
        getAuthHeaders()
      );
      
      // Get the driver details to update selectedBooking
      const assignedDriver = drivers.find(d => d.id === selectedDriver);
      
      // Update the selectedBooking with driver info based on trip type
      if (tripType === 'return') {
        setSelectedBooking(prev => ({
          ...prev,
          return_driver_id: selectedDriver,
          return_driver_name: assignedDriver?.name || '',
          return_driver_phone: assignedDriver?.phone || '',
          return_driver_email: assignedDriver?.email || ''
        }));
      } else {
        setSelectedBooking(prev => ({
          ...prev,
          driver_id: selectedDriver,
          driver_name: assignedDriver?.name || '',
          driver_phone: assignedDriver?.phone || '',
          driver_email: assignedDriver?.email || ''
        }));
      }
      
      toast.success(response.data?.message || 'Driver assigned successfully!');
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
    const totalPrice = booking.pricing?.totalPrice ?? booking.totalPrice ?? 0;
    setPriceOverride(totalPrice.toString());
    setShowDetailsModal(true);
  };

  const openEmailModal = (booking) => {
    setSelectedBooking(booking);
    setEmailSubject(`Booking Confirmation - ${booking.serviceType}`);
    const totalPrice = booking.pricing?.totalPrice ?? booking.totalPrice ?? 0;
    setEmailMessage(`Dear ${booking.name},\n\nYour booking has been confirmed!\n\nDetails:\nService: ${booking.serviceType}\nPickup: ${booking.pickupAddress}\nDrop-off: ${booking.dropoffAddress}\nDate: ${formatDate(booking.date)} (${getDayOfWeek(booking.date)})\nTime: ${booking.time}\nPassengers: ${booking.passengers}\n\nTotal Price: $${totalPrice.toFixed(2)}\n\nThank you for choosing Book A Ride NZ!`);
    setEmailCC('');
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

  const handleDeleteBooking = async (bookingId, bookingName, sendNotification = true) => {
    const confirmMessage = sendNotification 
      ? `Are you sure you want to CANCEL booking for ${bookingName}?\n\nThe customer will receive a cancellation email and SMS.`
      : `Are you sure you want to DELETE booking for ${bookingName}?\n\nNo notification will be sent to the customer.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`${API}/bookings/${bookingId}?send_notification=${sendNotification}`, getAuthHeaders());
      
      if (sendNotification) {
        toast.success('Booking cancelled - Customer notified via email & SMS');
      } else {
        toast.success('Booking deleted (no notification sent)');
      }
      fetchBookings();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error deleting booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  // Bulk delete without notifications
  const handleBulkDelete = async () => {
    if (selectedBookings.size === 0) return;
    
    setShowBulkDeleteConfirm(false);
    const count = selectedBookings.size;
    let deleted = 0;
    let failed = 0;

    toast.loading(`Deleting ${count} bookings...`);

    for (const bookingId of selectedBookings) {
      try {
        await axios.delete(`${API}/bookings/${bookingId}?send_notification=false`, getAuthHeaders());
        deleted++;
      } catch (error) {
        console.error(`Failed to delete booking ${bookingId}:`, error);
        failed++;
      }
    }

    toast.dismiss();
    
    if (failed === 0) {
      toast.success(`Successfully deleted ${deleted} booking${deleted > 1 ? 's' : ''} (no notifications sent)`);
    } else {
      toast.warning(`Deleted ${deleted} bookings, ${failed} failed`);
    }
    
    setSelectedBookings(new Set());
    fetchBookings();
  };

  const handleSendToAdmin = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/send-to-admin`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Booking details sent to admin mailbox');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error sending booking to admin:', error);
      toast.error(error.response?.data?.detail || 'Failed to send booking to admin');
    }
  };
  
  const handleRemovePickup = (index) => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index)
    }));
  };

  const handlePickupAddressChange = (index, value) => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  // Function to initialize autocomplete for additional pickup inputs
  const initializeAdditionalPickupAutocomplete = useCallback(() => {
    if (!isLoaded || !window.google?.maps?.places) return;
    
    const autocompleteOptions = {
      fields: ['formatted_address', 'geometry', 'name']
    };
    
    additionalPickupRefs.current.forEach((ref, index) => {
      if (ref && !ref._autocompleteInitialized) {
        const setup = initAutocompleteWithFix(ref, autocompleteOptions);
        if (setup?.autocomplete) {
          setup.autocomplete.addListener('place_changed', () => {
            const place = setup.autocomplete.getPlace();
            if (place?.formatted_address) {
              // Update the pickup address directly using setNewBooking
              setNewBooking(prev => ({
                ...prev,
                pickupAddresses: prev.pickupAddresses.map((addr, i) => 
                  i === index ? place.formatted_address : addr
                )
              }));
            }
          });
          ref._autocompleteInitialized = true;
          autocompleteCleanupRef.current.push(setup.cleanup);
        }
      }
    });
  }, [isLoaded]);

  const handleAddPickup = () => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: [...prev.pickupAddresses, '']
    }));
    
    // Re-initialize autocomplete for new input after DOM update
    setTimeout(() => {
      initializeAdditionalPickupAutocomplete();
    }, 200);
  };

  const exportToCSV = () => {
    try {
      // Define CSV headers
      const headers = ['Booking ID', 'Date', 'Time', 'Customer Name', 'Email', 'Phone', 'Service Type', 'Pickup Address', 'Dropoff Address', 'Passengers', 'Price', 'Payment Status', 'Status', 'Notes', 'Created At'];
      
      // Convert bookings to CSV rows
      const rows = filteredBookings.map(booking => [
        booking.id || '',
        booking.date || '',
        booking.time || '',
        booking.name || '',
        booking.email || '',
        booking.phone || '',
        booking.serviceType?.replace('-', ' ').toUpperCase() || '',
        booking.pickupAddress || '',
        booking.dropoffAddress || '',
        booking.passengers || '',
        booking.totalPrice || booking.pricing?.totalPrice || '',
        booking.payment_status || '',
        booking.status || '',
        booking.notes || '',
        booking.createdAt || ''
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
      ].join('\\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${filteredBookings.length} bookings to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export bookings');
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

  const handleUpdatePaymentStatus = async () => {
    if (!selectedBooking || !selectedPaymentStatus) {
      toast.error('Please select a payment status');
      return;
    }

    try {
      const response = await axios.put(`${API}/bookings/${selectedBooking.id}/payment-status`, {
        paymentStatus: selectedPaymentStatus
      }, getAuthHeaders());

      if (response.data.success) {
        toast.success('Payment status updated successfully');
        fetchBookings();
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update payment status');
    }
  };

  const handleSendEmail = async () => {
    try {
      await axios.post(`${API}/send-booking-email`, {
        bookingId: selectedBooking.id,
        email: selectedBooking.email,
        cc: emailCC,
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

  // Open edit booking modal
  const openEditBookingModal = (booking) => {
    setEditingBooking({
      ...booking,
      pickupAddresses: booking.pickupAddresses || []
    });
    setShowEditBookingModal(true);
  };

  // Handle edit booking save
  const handleSaveEditedBooking = async () => {
    if (!editingBooking) return;

    try {
      await axios.patch(`${API}/bookings/${editingBooking.id}`, {
        name: editingBooking.name,
        email: editingBooking.email,
        phone: editingBooking.phone,
        pickupAddress: editingBooking.pickupAddress,
        pickupAddresses: editingBooking.pickupAddresses?.filter(addr => addr.trim()) || [],
        dropoffAddress: editingBooking.dropoffAddress,
        date: editingBooking.date,
        time: editingBooking.time,
        passengers: editingBooking.passengers,
        notes: editingBooking.notes,
        flightArrivalNumber: editingBooking.flightArrivalNumber,
        flightArrivalTime: editingBooking.flightArrivalTime,
        flightDepartureNumber: editingBooking.flightDepartureNumber,
        flightDepartureTime: editingBooking.flightDepartureTime,
        // Return trip fields
        bookReturn: editingBooking.bookReturn,
        returnDate: editingBooking.returnDate,
        returnTime: editingBooking.returnTime
      }, getAuthHeaders());

      toast.success('Booking updated successfully!');
      setShowEditBookingModal(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to update booking');
    }
  };

  // Handle adding pickup to edit form
  const handleAddEditPickup = () => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: [...(prev.pickupAddresses || []), '']
    }));
    
    // Re-initialize autocomplete for new input after DOM update
    setTimeout(() => {
      if (!isLoaded || !window.google?.maps?.places) return;
      
      const autocompleteOptions = {
        fields: ['formatted_address', 'geometry', 'name']
      };
      
      editAdditionalPickupRefs.current.forEach((ref, index) => {
        if (ref && !ref._autocompleteInitialized) {
          const setup = initAutocompleteWithFix(ref, autocompleteOptions);
          if (setup?.autocomplete) {
            setup.autocomplete.addListener('place_changed', () => {
              const place = setup.autocomplete.getPlace();
              if (place?.formatted_address) {
                setEditingBooking(prev => ({
                  ...prev,
                  pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? place.formatted_address : addr)
                }));
              }
            });
            ref._autocompleteInitialized = true;
          }
        }
      });
    }, 100);
  };

  // Handle removing pickup from edit form
  const handleRemoveEditPickup = (index) => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index)
    }));
  };

  // Handle edit pickup address change
  const handleEditPickupAddressChange = (index, value) => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  // Manual calendar sync
  const handleManualCalendarSync = async (bookingId) => {
    setCalendarLoading(true);
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/sync-calendar`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Booking synced to Google Calendar!');
      fetchBookings();
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      toast.error(error.response?.data?.detail || 'Failed to sync to calendar');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Resend confirmation email/SMS
  const handleResendConfirmation = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/resend-confirmation`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Confirmation resent to customer!');
    } catch (error) {
      console.error('Error resending confirmation:', error);
      toast.error(error.response?.data?.detail || 'Failed to resend confirmation');
    }
  };

  // Preview confirmation before sending
  const handlePreviewConfirmation = async (bookingId) => {
    setPreviewLoading(true);
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}/preview-confirmation`, getAuthHeaders());
      setPreviewHtml(response.data.html);
      setPreviewBookingInfo(response.data.booking);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error previewing confirmation:', error);
      toast.error(error.response?.data?.detail || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Send confirmation after preview
  const handleSendAfterPreview = async () => {
    if (!previewBookingInfo) return;
    
    // Find the booking ID from the current editing context or most recent preview
    const bookingId = editingBooking?.id;
    if (!bookingId) {
      toast.error('No booking selected');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/resend-confirmation`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Confirmation sent to customer!');
      setShowPreviewModal(false);
      setPreviewHtml('');
      setPreviewBookingInfo(null);
    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast.error(error.response?.data?.detail || 'Failed to send confirmation');
    }
  };

  // Send day-before reminders
  const handleSendReminders = async () => {
    if (!window.confirm('Send reminder emails and SMS to all customers with bookings tomorrow?')) {
      return;
    }
    
    try {
      const response = await axios.post(`${API}/admin/send-reminders`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Reminders sent successfully!');
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error(error.response?.data?.detail || 'Failed to send reminders');
    }
  };

  // Sync contacts to iPhone
  const [syncingContacts, setSyncingContacts] = useState(false);
  const handleSyncContactsToiPhone = async () => {
    if (!window.confirm('Sync all customer contacts to your iPhone? This will upload unique contacts from all bookings.')) {
      return;
    }
    
    setSyncingContacts(true);
    try {
      const response = await axios.post(`${API}/admin/sync-contacts-to-icloud`, {}, getAuthHeaders());
      const data = response.data;
      toast.success(`✅ Synced ${data.synced} contacts to iPhone! (${data.skipped} skipped, ${data.failed} failed)`);
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast.error(error.response?.data?.detail || 'Failed to sync contacts to iPhone');
    } finally {
      setSyncingContacts(false);
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

  const calculateBookingPrice = async () => {
    if (!newBooking.pickupAddress || !newBooking.dropoffAddress) {
      toast.error('Please enter pickup and drop-off addresses');
      return;
    }

    const pickupCount = 1 + newBooking.pickupAddresses.filter(addr => addr.trim()).length;
    if (pickupCount > 1) {
      toast.info(`Calculating route for ${pickupCount} pickup locations...`);
    }

    setCalculatingPrice(true);
    try {
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: newBooking.serviceType,
        pickupAddress: newBooking.pickupAddress,
        pickupAddresses: newBooking.pickupAddresses.filter(addr => addr.trim()),  // Filter empty
        dropoffAddress: newBooking.dropoffAddress,
        passengers: parseInt(newBooking.passengers),
        vipAirportPickup: false,
        oversizedLuggage: false
      });

      setBookingPricing(response.data);
      toast.success(`Price calculated: $${response.data.totalPrice.toFixed(2)} for ${response.data.distance}km route`);
    } catch (error) {
      console.error('Error calculating price:', error);
      toast.error('Failed to calculate price');
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleCreateManualBooking = async () => {
    // Validation
    if (!newBooking.name || !newBooking.email || !newBooking.phone) {
      toast.error('Please fill in customer details');
      return;
    }

    if (!newBooking.pickupAddress || !newBooking.dropoffAddress) {
      toast.error('Please enter pickup and drop-off addresses');
      return;
    }

    if (!newBooking.date || !newBooking.time) {
      toast.error('Please select date and time');
      return;
    }

    // Return trip validation
    if (newBooking.bookReturn && (!newBooking.returnDate || !newBooking.returnTime)) {
      toast.error('Please select return date and time for the return trip');
      return;
    }

    // Check if either calculated price or manual override is provided
    const hasCalculatedPrice = bookingPricing.totalPrice > 0;
    const hasManualPrice = manualPriceOverride && parseFloat(manualPriceOverride) > 0;
    
    if (!hasCalculatedPrice && !hasManualPrice) {
      toast.error('Please calculate the price or enter a manual price override');
      return;
    }

    try {
      // Calculate final price (double if return trip)
      let finalPrice = hasManualPrice ? parseFloat(manualPriceOverride) : bookingPricing.totalPrice;
      if (newBooking.bookReturn && !hasManualPrice) {
        finalPrice = finalPrice * 2; // Double for return trip
      }
      
      const priceOverride = hasManualPrice ? parseFloat(manualPriceOverride) : (newBooking.bookReturn ? finalPrice : null);
      
      await axios.post(`${API}/bookings/manual`, {
        name: newBooking.name,
        email: newBooking.email,
        ccEmail: newBooking.ccEmail,  // CC email for confirmation
        phone: newBooking.phone,
        serviceType: newBooking.serviceType,
        pickupAddress: newBooking.pickupAddress,
        pickupAddresses: newBooking.pickupAddresses.filter(addr => addr.trim()),  // Filter empty addresses
        dropoffAddress: newBooking.dropoffAddress,
        date: newBooking.date,
        time: newBooking.time,
        passengers: newBooking.passengers,
        pricing: newBooking.bookReturn ? { ...bookingPricing, totalPrice: finalPrice } : bookingPricing,
        paymentMethod: newBooking.paymentMethod,
        notes: newBooking.notes,
        priceOverride: priceOverride,
        // Flight details
        flightArrivalNumber: newBooking.flightArrivalNumber,
        flightArrivalTime: newBooking.flightArrivalTime,
        flightDepartureNumber: newBooking.flightDepartureNumber,
        flightDepartureTime: newBooking.flightDepartureTime,
        // Return trip details
        bookReturn: newBooking.bookReturn,
        returnDate: newBooking.returnDate,
        returnTime: newBooking.returnTime,
        returnDepartureFlightNumber: newBooking.returnDepartureFlightNumber,
        returnDepartureTime: newBooking.returnDepartureTime,
        returnArrivalFlightNumber: newBooking.returnArrivalFlightNumber,
        returnArrivalTime: newBooking.returnArrivalTime
      }, getAuthHeaders());

      toast.success('Booking created successfully! Customer will receive email & SMS confirmation.');
      setShowCreateBookingModal(false);
      // Reset form
      setNewBooking({
        name: '',
        email: '',
        ccEmail: '',
        phone: '',
        serviceType: 'airport-shuttle',
        pickupAddress: '',
        pickupAddresses: [],
        dropoffAddress: '',
        date: '',
        time: '',
        passengers: '1',
        paymentMethod: 'pay-on-pickup',
        notes: '',
        flightArrivalNumber: '',
        flightArrivalTime: '',
        flightDepartureNumber: '',
        flightDepartureTime: '',
        bookReturn: false,
        returnDate: '',
        returnTime: '',
        returnDepartureFlightNumber: '',
        returnDepartureTime: '',
        returnArrivalFlightNumber: '',
        returnArrivalTime: ''
      });
      setAdminReturnDate(null);
      setAdminReturnTime(null);
      setBookingPricing({
        distance: 0,
        basePrice: 0,
        airportFee: 0,
        passengerFee: 0,
        totalPrice: 0
      });
      setManualPriceOverride('');
      fetchBookings(); // Refresh bookings list
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
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
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    // Only count revenue from confirmed and completed bookings (not pending or cancelled)
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.pricing?.totalPrice || b.totalPrice || 0), 0)
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
              <p className="text-white/50 text-xs mt-1">v2024.12.08</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => window.open('/', '_blank')} variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                <Home className="w-4 h-4 mr-2" />
                View Site
              </Button>
              <Button onClick={handleSyncContactsToiPhone} disabled={syncingContacts} variant="outline" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                <Smartphone className="w-4 h-4 mr-2" />
                {syncingContacts ? 'Syncing...' : 'Sync to iPhone'}
              </Button>
              <Button onClick={() => navigate('/driver/portal')} variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                <Users className="w-4 h-4 mr-2" />
                Driver Portal
              </Button>
              <Button onClick={() => navigate('/admin/seo')} variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black">
                <Settings className="w-4 h-4 mr-2" />
                SEO Management
              </Button>
              <Button onClick={() => navigate('/admin/facebook-strategy')} variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                <Facebook className="w-4 h-4 mr-2" />
                Facebook Strategy
              </Button>
              {xeroConnected ? (
                <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Xero: {xeroOrg || 'Connected'}
                </Button>
              ) : (
                <Button onClick={connectXero} variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Connect Xero
                </Button>
              )}
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
        {/* Breadcrumb Navigation */}
        <AdminBreadcrumb 
          activeTab={activeTab} 
          selectedBooking={selectedBooking}
          showDetailsModal={showDetailsModal}
          showEditBookingModal={showEditBookingModal}
        />

        {/* Tabs Navigation */}
        <Tabs defaultValue="bookings" value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          if (val === 'deleted') fetchDeletedBookings();
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="deleted" className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Deleted {deletedBookings.length > 0 && `(${deletedBookings.length})`}
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
              <Users className="w-4 h-4" />
              Drivers
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Marketing
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gold border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Total Bookings</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <BookOpen className="w-10 h-10 text-white/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gold border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-white">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-white/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gold border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Confirmed</p>
                  <p className="text-3xl font-bold text-white">{stats.confirmed}</p>
                </div>
                <CheckCircle className="w-10 h-10 text-white/60" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-600 border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80 mb-1">Revenue (Confirmed)</p>
                  <p className="text-3xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
                  <p className="text-xs text-white/60 mt-1">{stats.confirmed + stats.completed} jobs</p>
                </div>
                <DollarSign className="w-10 h-10 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
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
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-black"
              >
                Export CSV
              </Button>
              <Button 
                onClick={handleSendReminders}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-black"
                title="Send reminders to tomorrow's bookings"
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Reminders
              </Button>
              <Button 
                onClick={() => setShowCreateBookingModal(true)}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                + Create Booking
              </Button>
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
                {/* Bulk Action Bar */}
                {selectedBookings.size > 0 && (
                  <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-red-800">
                        {selectedBookings.size} booking{selectedBookings.size > 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBookings(new Set())}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Clear selection
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Selected (No Notifications)
                    </Button>
                  </div>
                )}
                <table className="w-full">
                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="p-4 w-10">
                        <button
                          onClick={() => {
                            if (selectedBookings.size === filteredBookings.length) {
                              setSelectedBookings(new Set());
                            } else {
                              setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
                            }
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Select all"
                        >
                          {selectedBookings.size === filteredBookings.length && filteredBookings.length > 0 ? (
                            <CheckSquare className="w-5 h-5 text-gold" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-700">Ref # / Date</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Customer</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Service</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Route</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Price</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Payment</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className={`border-b hover:bg-gray-50 ${selectedBookings.has(booking.id) ? 'bg-gold/10' : ''}`}>
                        <td className="p-4">
                          <button
                            onClick={() => {
                              const newSelected = new Set(selectedBookings);
                              if (newSelected.has(booking.id)) {
                                newSelected.delete(booking.id);
                              } else {
                                newSelected.add(booking.id);
                              }
                              setSelectedBookings(newSelected);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {selectedBookings.has(booking.id) ? (
                              <CheckSquare className="w-5 h-5 text-gold" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gold">
                              #{booking.referenceNumber || booking.id?.slice(0, 8).toUpperCase()}
                            </div>
                            {isToday(booking.date) && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-blue-600 text-white rounded-full animate-pulse">
                                TODAY
                              </span>
                            )}
                            {isTomorrow(booking.date) && (
                              <span className="px-2 py-0.5 text-xs font-bold bg-orange-500 text-white rounded-full">
                                TOMORROW
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                          <div className="text-xs font-medium text-blue-600">{getDayOfWeek(booking.date)}</div>
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
                          <div className="text-sm font-semibold text-gray-900">${booking.pricing?.totalPrice?.toFixed(2) || '0.00'}</div>
                          <div className="text-xs text-gray-500">{booking.pricing?.distance || 0}km</div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 w-fit ${
                              booking.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : booking.payment_status === 'cash'
                                ? 'bg-yellow-100 text-yellow-700'
                                : booking.payment_status === 'pay-on-pickup'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {booking.payment_status === 'paid' && '✓'}
                              {booking.payment_status === 'cash' && '💵'}
                              {booking.payment_status === 'pay-on-pickup' && '🚗'}
                              {booking.payment_status === 'unpaid' && '✗'}
                              <span className="capitalize">{booking.payment_status?.replace('-', ' ') || 'unpaid'}</span>
                            </span>
                          </div>
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
                          <div className="flex flex-wrap gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openDetailsModal(booking)}
                              className="hover:bg-gray-100"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditBookingModal(booking)}
                              className="hover:bg-blue-100 hover:text-blue-600"
                              title="Edit Booking"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEmailModal(booking)}
                              className="hover:bg-gold hover:text-black"
                              title="Send Email"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManualCalendarSync(booking.id)}
                              className="hover:bg-green-100 hover:text-green-600"
                              title="Sync to Google Calendar"
                              disabled={calendarLoading}
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendConfirmation(booking.id)}
                              className="hover:bg-purple-100 hover:text-purple-600"
                              title="Resend Confirmation (Email & SMS)"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteBooking(booking.id, booking.name, true)}
                              className="hover:bg-red-100 hover:text-red-600"
                              title="Cancel Booking (notify customer)"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* Driver Applications Tab */}
          <TabsContent value="applications">
            <DriverApplicationsTab />
          </TabsContent>

          {/* Marketing Tab - Landing Pages & Social */}
          <TabsContent value="marketing">
            <LandingPagesTab />
          </TabsContent>

          {/* Deleted Bookings Tab */}
          <TabsContent value="deleted" className="space-y-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Recently Deleted Bookings</h3>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  These bookings have been deleted but can be restored. They will be kept for 30 days before permanent deletion.
                </p>
                
                {loadingDeleted ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading deleted bookings...</p>
                  </div>
                ) : deletedBookings.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border border-red-100">
                    <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No deleted bookings</p>
                    <p className="text-sm text-gray-400">Bookings you delete will appear here for recovery</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletedBookings.map((booking) => (
                      <div key={booking.id} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{booking.customerName || booking.name}</h4>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">DELETED</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="text-gray-400">Date:</span> {formatDate(booking.date)} {booking.time}
                              </div>
                              <div>
                                <span className="text-gray-400">Phone:</span> {booking.phone}
                              </div>
                              <div>
                                <span className="text-gray-400">Total:</span> ${booking.totalPrice || booking.total_price}
                              </div>
                              <div>
                                <span className="text-gray-400">Deleted:</span> {new Date(booking.deletedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-gray-400">Pickup:</span> <span className="text-gray-600">{booking.pickup || booking.pickupAddress}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-400">Dropoff:</span> <span className="text-gray-600">{booking.dropoff || booking.dropoffAddress}</span>
                            </div>
                            {booking.deletedBy && (
                              <div className="mt-1 text-xs text-gray-400">
                                Deleted by: {booking.deletedBy}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => handleRestoreBooking(booking.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              onClick={() => handlePermanentDelete(booking.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete Forever
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
              {/* Booking Status & Payment Banner */}
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-600">Booking Status</span>
                    <p className={`font-semibold text-sm mt-1 ${
                      selectedBooking.status === 'confirmed' ? 'text-green-600' : 
                      selectedBooking.status === 'completed' ? 'text-blue-600' : 
                      selectedBooking.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {selectedBooking.status?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Payment Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                        selectedBooking.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : selectedBooking.payment_status === 'cash'
                          ? 'bg-yellow-100 text-yellow-700'
                          : selectedBooking.payment_status === 'pay-on-pickup'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedBooking.payment_status === 'paid' && '✓ '}
                        {selectedBooking.payment_status === 'cash' && '💵 '}
                        {selectedBooking.payment_status === 'pay-on-pickup' && '🚗 '}
                        {selectedBooking.payment_status === 'unpaid' && '✗ '}
                        <span className="uppercase">{selectedBooking.payment_status?.replace('-', ' ') || 'UNPAID'}</span>
                      </span>
                      <div className="flex gap-1">
                        <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                          <SelectTrigger className="h-7 text-xs w-[100px]">
                            <SelectValue placeholder="Change" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="paid">✓ Paid</SelectItem>
                            <SelectItem value="cash">💵 Cash</SelectItem>
                            <SelectItem value="pay-on-pickup">🚗 Pay on Pickup</SelectItem>
                            <SelectItem value="unpaid">✗ Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm"
                          onClick={handleUpdatePaymentStatus}
                          disabled={!selectedPaymentStatus}
                          className="h-7 px-2 text-xs bg-gold hover:bg-gold/90 text-black"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

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
                    <span className="text-gray-600">Pickup Addresses:</span>
                    <div className="font-medium space-y-1">
                      <p className="flex items-start">
                        <span className="text-blue-600 mr-2">1.</span>
                        <span>{selectedBooking.pickupAddress}</span>
                      </p>
                      {selectedBooking.pickupAddresses && selectedBooking.pickupAddresses.length > 0 && 
                        selectedBooking.pickupAddresses.map((addr, idx) => addr && (
                          <p key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">{idx + 2}.</span>
                            <span>{addr}</span>
                          </p>
                        ))
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Drop-off:</span>
                    <p className="font-medium">{selectedBooking.dropoffAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{formatDate(selectedBooking.date)}</p>
                      <p className="text-sm text-blue-600 font-medium">{getDayOfWeek(selectedBooking.date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <p className="font-medium">{selectedBooking.time}</p>
                    </div>
                  </div>
                  
                  {/* Return Trip Info - Inline */}
                  {selectedBooking.bookReturn && (
                    <div className="mt-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                        🔄 Return Trip
                      </h4>
                      <div className="text-sm">
                        <p className="text-gray-600 text-xs italic mb-2">
                          Reverse: {selectedBooking.dropoffAddress?.split(',')[0]} → {selectedBooking.pickupAddress?.split(',')[0]}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 text-xs">Return Date:</span>
                            <p className="font-medium">{formatDate(selectedBooking.returnDate)}</p>
                            <p className="text-xs text-blue-600 font-medium">{getDayOfWeek(selectedBooking.returnDate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Return Time:</span>
                            <p className="font-medium">{selectedBooking.returnTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Flight Info */}
              {(selectedBooking.flightArrivalNumber || selectedBooking.flightDepartureNumber) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✈️ Flight Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedBooking.flightArrivalNumber && (
                      <div>
                        <span className="text-gray-600">Arrival Flight:</span>
                        <p className="font-medium">{selectedBooking.flightArrivalNumber}</p>
                        {selectedBooking.flightArrivalTime && <p className="text-xs text-gray-500">Arrival: {selectedBooking.flightArrivalTime}</p>}
                      </div>
                    )}
                    {selectedBooking.flightDepartureNumber && (
                      <div>
                        <span className="text-gray-600">Departure Flight:</span>
                        <p className="font-medium">{selectedBooking.flightDepartureNumber}</p>
                        {selectedBooking.flightDepartureTime && <p className="text-xs text-gray-500">Departure: {selectedBooking.flightDepartureTime}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pricing Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  {selectedBooking.pricing?.distance && (
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{selectedBooking.pricing.distance} km</span>
                    </div>
                  )}
                  {selectedBooking.pricing?.basePrice != null && (
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">${selectedBooking.pricing.basePrice.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.pricing?.airportFee > 0 && (
                    <div className="flex justify-between">
                      <span>Airport Fee:</span>
                      <span className="font-medium">${selectedBooking.pricing.airportFee.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.pricing?.passengerFee > 0 && (
                    <div className="flex justify-between">
                      <span>Passenger Fee:</span>
                      <span className="font-medium">${selectedBooking.pricing.passengerFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold text-base">
                    <span>Total:</span>
                    <span className="text-gold">${selectedBooking.pricing?.totalPrice?.toFixed(2) || selectedBooking.totalPrice?.toFixed(2) || '0.00'}</span>
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

              {/* Driver Assignment - OUTBOUND */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  🚗 Outbound Driver {selectedBooking.bookReturn && <span className="text-sm font-normal text-gray-500">(One-way to destination)</span>}
                </h3>
                {selectedBooking.driver_id ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Assigned Driver</p>
                        <p className="font-medium text-gray-900">
                          {drivers.find(d => d.id === selectedBooking.driver_id)?.name || selectedBooking.driver_name || 'Unknown Driver'}
                        </p>
                        <p className="text-xs text-gray-500">{selectedBooking.driver_phone}</p>
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
                    <p className="text-sm text-gray-600">No outbound driver assigned yet</p>
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
                        onClick={() => handleAssignDriver('outbound')}
                        disabled={!selectedDriver}
                        className="bg-gold hover:bg-gold/90 text-black"
                      >
                        Assign
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Assignment - RETURN (only if return trip booked) */}
              {selectedBooking.bookReturn && (
                <div className="mt-4 pt-4 border-t border-dashed">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    🔄 Return Driver <span className="text-sm font-normal text-gray-500">(Return on {selectedBooking.returnDate} at {selectedBooking.returnTime})</span>
                  </h3>
                  {selectedBooking.return_driver_id ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Return Trip Driver</p>
                          <p className="font-medium text-gray-900">
                            {drivers.find(d => d.id === selectedBooking.return_driver_id)?.name || selectedBooking.return_driver_name || 'Unknown Driver'}
                          </p>
                          <p className="text-xs text-gray-500">{selectedBooking.return_driver_phone}</p>
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
                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                        ⚠️ No return driver assigned yet - assign closer to return date
                      </p>
                      <div className="flex gap-2">
                        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select return driver..." />
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
                          onClick={() => handleAssignDriver('return')}
                          disabled={!selectedDriver}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Assign Return
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Admin Actions */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleSendToAdmin(selectedBooking.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Booking Details to Admin Mailbox
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This will send a complete summary of this booking to the admin email address
                </p>
              </div>
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
                <Label>CC (optional):</Label>
                <Input
                  value={emailCC}
                  onChange={(e) => setEmailCC(e.target.value)}
                  placeholder="Additional email addresses (comma separated)"
                />
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

      {/* Create Booking Modal */}
      <Dialog open={showCreateBookingModal} onOpenChange={setShowCreateBookingModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newBooking.name}
                    onChange={(e) => setNewBooking(prev => ({...prev, name: e.target.value}))}
                    placeholder="Customer name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newBooking.email}
                    onChange={(e) => setNewBooking(prev => ({...prev, email: e.target.value}))}
                    placeholder="customer@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>CC Email (optional)</Label>
                  <Input
                    type="email"
                    value={newBooking.ccEmail}
                    onChange={(e) => setNewBooking(prev => ({...prev, ccEmail: e.target.value}))}
                    placeholder="copy@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Send copy of confirmation to this email</p>
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking(prev => ({...prev, phone: e.target.value}))}
                    placeholder="+64 21 XXX XXXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Service Type *</Label>
                  <Select 
                    value={newBooking.serviceType} 
                    onValueChange={(value) => setNewBooking(prev => ({...prev, serviceType: value}))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airport-shuttle">Airport Shuttle</SelectItem>
                      <SelectItem value="private-transfer">Private Shuttle Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method *</Label>
                  <Select 
                    value={newBooking.paymentMethod} 
                    onValueChange={(value) => setNewBooking(prev => ({...prev, paymentMethod: value}))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">💳 Stripe - Send Payment Link</SelectItem>
                      <SelectItem value="paypal">🅿️ PayPal - Send Payment Link</SelectItem>
                      <SelectItem value="pay-on-pickup">💵 Pay on Pickup (Cash)</SelectItem>
                      <SelectItem value="card">✅ Card (Already Paid)</SelectItem>
                      <SelectItem value="bank-transfer">🏦 Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {(newBooking.paymentMethod === 'stripe' || newBooking.paymentMethod === 'paypal') && (
                    <p className="text-xs text-gold mt-1">
                      A payment link will be sent to the customer's email after booking is created.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
              <div className="space-y-4">
                <div>
                  <Label>Pickup Address 1 *</Label>
                  <Input
                    ref={pickupInputRef}
                    value={newBooking.pickupAddress}
                    onChange={(e) => setNewBooking(prev => ({...prev, pickupAddress: e.target.value}))}
                    placeholder="Start typing address..."
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>

                {/* Additional Pickup Addresses */}
                {newBooking.pickupAddresses.map((pickup, index) => (
                  <div key={index} className="relative">
                    <Label>Pickup Address {index + 2}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        ref={(el) => (additionalPickupRefs.current[index] = el)}
                        value={pickup}
                        onChange={(e) => handlePickupAddressChange(index, e.target.value)}
                        placeholder="Start typing address..."
                        autoComplete="off"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemovePickup(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Pickup Button - Elegant Design */}
                <div>
                  <button
                    type="button"
                    onClick={handleAddPickup}
                    className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border-2 border-dashed border-gold/40 hover:border-gold/60 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 group-hover:bg-gold/30 transition-colors">
                      <MapPin className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                      Add Another Pickup Location
                    </span>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gold text-white text-xs font-bold group-hover:scale-110 transition-transform">
                      +
                    </div>
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Add multiple pickup locations for shared rides or multi-stop trips
                  </p>
                </div>

                <div>
                  <Label>Drop-off Address *</Label>
                  <Input
                    ref={dropoffInputRef}
                    value={newBooking.dropoffAddress}
                    onChange={(e) => setNewBooking(prev => ({...prev, dropoffAddress: e.target.value}))}
                    placeholder="Start typing address..."
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <div className="mt-1">
                      <CustomDatePicker
                        selected={adminPickupDate}
                        onChange={(date) => {
                          setAdminPickupDate(date);
                          if (date) {
                            // Use local date to avoid timezone issues
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const formattedDate = `${year}-${month}-${day}`;
                            setNewBooking(prev => ({...prev, date: formattedDate}));
                          }
                        }}
                        placeholder="Select date"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <div className="mt-1">
                      <CustomTimePicker
                        selected={adminPickupTime}
                        onChange={(time) => {
                          setAdminPickupTime(time);
                          if (time) {
                            const hours = time.getHours().toString().padStart(2, '0');
                            const minutes = time.getMinutes().toString().padStart(2, '0');
                            setNewBooking(prev => ({...prev, time: `${hours}:${minutes}`}));
                          }
                        }}
                        placeholder="Select time"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Passengers *</Label>
                    <Select 
                      value={newBooking.passengers} 
                      onValueChange={(value) => setNewBooking(prev => ({...prev, passengers: value}))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Flight Details Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✈️ Flight Details (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Flight Arrival Number</Label>
                      <Input
                        value={newBooking.flightArrivalNumber}
                        onChange={(e) => setNewBooking(prev => ({...prev, flightArrivalNumber: e.target.value}))}
                        placeholder="e.g., NZ123"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label>Flight Arrival Time</Label>
                      <div className="mt-1">
                        <CustomTimePicker
                          selected={adminFlightArrivalTime}
                          onChange={(time) => {
                            setAdminFlightArrivalTime(time);
                            if (time) {
                              const hours = time.getHours().toString().padStart(2, '0');
                              const minutes = time.getMinutes().toString().padStart(2, '0');
                              setNewBooking(prev => ({...prev, flightArrivalTime: `${hours}:${minutes}`}));
                            }
                          }}
                          placeholder="Select arrival time"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Flight Departure Number</Label>
                      <Input
                        value={newBooking.flightDepartureNumber}
                        onChange={(e) => setNewBooking(prev => ({...prev, flightDepartureNumber: e.target.value}))}
                        placeholder="e.g., NZ456"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label>Flight Departure Time</Label>
                      <div className="mt-1">
                        <CustomTimePicker
                          selected={adminFlightDepartureTime}
                          onChange={(time) => {
                            setAdminFlightDepartureTime(time);
                            if (time) {
                              const hours = time.getHours().toString().padStart(2, '0');
                              const minutes = time.getMinutes().toString().padStart(2, '0');
                              setNewBooking(prev => ({...prev, flightDepartureTime: `${hours}:${minutes}`}));
                            }
                          }}
                          placeholder="Select departure time"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Add flight details for airport pickups/drop-offs to better track and coordinate transfers
                  </p>
                </div>

                {/* Return Trip Section */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="adminBookReturn"
                      checked={newBooking.bookReturn}
                      onChange={(e) => setNewBooking(prev => ({...prev, bookReturn: e.target.checked}))}
                      className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                    />
                    <Label htmlFor="adminBookReturn" className="cursor-pointer font-semibold text-gray-900">
                      🔄 Book a Return Trip
                    </Label>
                  </div>

                  {newBooking.bookReturn && (
                    <div className="space-y-4 mt-4 pt-4 border-t border-green-200">
                      <p className="text-sm text-gray-600">
                        Return trip: Drop-off → Pickup (reverse of outbound journey)
                      </p>
                      
                      {/* Return Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Return Date *</Label>
                          <div className="mt-1">
                            <CustomDatePicker
                              selected={adminReturnDate}
                              onChange={(date) => {
                                setAdminReturnDate(date);
                                if (date) {
                                  // Use local date to avoid timezone issues
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  const formattedDate = `${year}-${month}-${day}`;
                                  setNewBooking(prev => ({...prev, returnDate: formattedDate}));
                                }
                              }}
                              placeholder="Select return date"
                              minDate={adminPickupDate || new Date()}
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Return Time *</Label>
                          <div className="mt-1">
                            <CustomTimePicker
                              selected={adminReturnTime}
                              onChange={(time) => {
                                setAdminReturnTime(time);
                                if (time) {
                                  const hours = time.getHours().toString().padStart(2, '0');
                                  const minutes = time.getMinutes().toString().padStart(2, '0');
                                  setNewBooking(prev => ({...prev, returnTime: `${hours}:${minutes}`}));
                                }
                              }}
                              placeholder="Select return time"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label>Special Notes</Label>
                  <Textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {bookingPricing.totalPrice > 0 ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{bookingPricing.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">${bookingPricing.basePrice.toFixed(2)}</span>
                    </div>
                    {bookingPricing.airportFee > 0 && (
                      <div className="flex justify-between">
                        <span>Airport Fee:</span>
                        <span className="font-medium">${bookingPricing.airportFee.toFixed(2)}</span>
                      </div>
                    )}
                    {bookingPricing.passengerFee > 0 && (
                      <div className="flex justify-between">
                        <span>Passenger Fee:</span>
                        <span className="font-medium">${bookingPricing.passengerFee.toFixed(2)}</span>
                      </div>
                    )}
                    {newBooking.bookReturn && (
                      <div className="flex justify-between text-green-700">
                        <span>🔄 Return Trip:</span>
                        <span className="font-medium">x2</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-semibold text-base">
                      <span>Total:</span>
                      <span className="text-gold">
                        ${(newBooking.bookReturn ? bookingPricing.totalPrice * 2 : bookingPricing.totalPrice).toFixed(2)}
                      </span>
                    </div>
                    {newBooking.bookReturn && (
                      <p className="text-xs text-green-600 text-center mt-1">
                        Includes return trip (outbound + return)
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center">
                    Click &quot;Calculate Price&quot; to get pricing details
                  </p>
                )}
                <Button 
                  onClick={calculateBookingPrice}
                  disabled={calculatingPrice || !newBooking.pickupAddress || !newBooking.dropoffAddress}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {calculatingPrice ? 'Calculating...' : 'Calculate Price'}
                </Button>
              </div>

              {/* Price Override Section */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  💰 Manual Price Override (Optional)
                </Label>
                <p className="text-xs text-gray-600 mb-3">
                  Enter a custom price to override the calculated amount. Leave empty to use calculated price.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualPriceOverride}
                      onChange={(e) => setManualPriceOverride(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                  {manualPriceOverride && (
                    <Button
                      variant="outline"
                      onClick={() => setManualPriceOverride('')}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {manualPriceOverride && parseFloat(manualPriceOverride) > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <strong>Final Price:</strong> <span className="text-green-700 font-bold">${parseFloat(manualPriceOverride).toFixed(2)} NZD</span>
                    <span className="text-xs text-gray-600 block mt-1">
                      {bookingPricing.totalPrice > 0 && (
                        `Original: $${bookingPricing.totalPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateBookingModal(false);
                  setNewBooking({
                    name: '',
                    email: '',
                    phone: '',
                    serviceType: 'airport-shuttle',
                    pickupAddress: '',
                    dropoffAddress: '',
                    date: '',
                    time: '',
                    passengers: '1',
                    paymentMethod: 'pay-on-pickup',
                    notes: ''
                  });
                  setBookingPricing({
                    distance: 0,
                    basePrice: 0,
                    airportFee: 0,
                    passengerFee: 0,
                    totalPrice: 0
                  });
                  setManualPriceOverride('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateManualBooking}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
                disabled={bookingPricing.totalPrice === 0 && (!manualPriceOverride || parseFloat(manualPriceOverride) <= 0)}
              >
                Create Booking & Send Confirmations
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={showEditBookingModal} onOpenChange={setShowEditBookingModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking #{editingBooking?.referenceNumber || editingBooking?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <div className="space-y-6 pt-4">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={editingBooking.name}
                      onChange={(e) => setEditingBooking(prev => ({...prev, name: e.target.value}))}
                      placeholder="Customer name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editingBooking.email}
                      onChange={(e) => setEditingBooking(prev => ({...prev, email: e.target.value}))}
                      placeholder="customer@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={editingBooking.phone}
                      onChange={(e) => setEditingBooking(prev => ({...prev, phone: e.target.value}))}
                      placeholder="+64 21 XXX XXXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Passengers</Label>
                    <Select 
                      value={editingBooking.passengers?.toString()} 
                      onValueChange={(value) => setEditingBooking(prev => ({...prev, passengers: value}))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Trip Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Pickup Address 1 *</Label>
                    <Input
                      ref={editPickupInputRef}
                      value={editingBooking.pickupAddress}
                      onChange={(e) => setEditingBooking(prev => ({...prev, pickupAddress: e.target.value}))}
                      placeholder="Start typing address..."
                      className="mt-1"
                      autoComplete="off"
                    />
                  </div>

                  {/* Additional Pickup Addresses */}
                  {editingBooking.pickupAddresses?.map((pickup, index) => (
                    <div key={index} className="relative">
                      <Label>Pickup Address {index + 2}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          ref={(el) => (editAdditionalPickupRefs.current[index] = el)}
                          value={pickup}
                          onChange={(e) => handleEditPickupAddressChange(index, e.target.value)}
                          placeholder="Start typing address..."
                          autoComplete="off"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveEditPickup(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add Pickup Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleAddEditPickup}
                      className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border-2 border-dashed border-gold/40 hover:border-gold/60 rounded-lg transition-all duration-300"
                    >
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-sm font-semibold text-gray-700">Add Another Pickup Location</span>
                      <span className="w-6 h-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center">+</span>
                    </button>
                  </div>

                  <div>
                    <Label>Drop-off Address *</Label>
                    <Input
                      ref={editDropoffInputRef}
                      value={editingBooking.dropoffAddress}
                      onChange={(e) => setEditingBooking(prev => ({...prev, dropoffAddress: e.target.value}))}
                      placeholder="Start typing address..."
                      className="mt-1"
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={editingBooking.date}
                        onChange={(e) => setEditingBooking(prev => ({...prev, date: e.target.value}))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Time *</Label>
                      <Input
                        type="time"
                        value={editingBooking.time}
                        onChange={(e) => setEditingBooking(prev => ({...prev, time: e.target.value}))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      ✈️ Flight Details (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Flight Arrival Number</Label>
                        <Input
                          value={editingBooking.flightArrivalNumber || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightArrivalNumber: e.target.value}))}
                          placeholder="e.g., NZ123"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label>Flight Arrival Time</Label>
                        <Input
                          type="time"
                          value={editingBooking.flightArrivalTime || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightArrivalTime: e.target.value}))}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label>Flight Departure Number</Label>
                        <Input
                          value={editingBooking.flightDepartureNumber || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightDepartureNumber: e.target.value}))}
                          placeholder="e.g., NZ456"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label>Flight Departure Time</Label>
                        <Input
                          type="time"
                          value={editingBooking.flightDepartureTime || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightDepartureTime: e.target.value}))}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Return Trip Section */}
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id="editBookReturn"
                        checked={editingBooking.bookReturn || false}
                        onChange={(e) => setEditingBooking(prev => ({...prev, bookReturn: e.target.checked}))}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <Label htmlFor="editBookReturn" className="cursor-pointer font-semibold text-gray-900">
                        🔄 Return Trip
                      </Label>
                    </div>
                    {editingBooking.bookReturn && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <Label>Return Date *</Label>
                          <Input
                            type="date"
                            value={editingBooking.returnDate || ''}
                            onChange={(e) => setEditingBooking(prev => ({...prev, returnDate: e.target.value}))}
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div>
                          <Label>Return Time *</Label>
                          <Input
                            type="time"
                            value={editingBooking.returnTime || ''}
                            onChange={(e) => setEditingBooking(prev => ({...prev, returnTime: e.target.value}))}
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-600 italic">
                            Return route: {editingBooking.dropoffAddress?.split(',')[0]} → {editingBooking.pickupAddress?.split(',')[0]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Special Notes</Label>
                    <Textarea
                      value={editingBooking.notes || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Any special requests or notes..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Current Pricing Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Current Pricing</h3>
                <div className="flex justify-between items-center">
                  <span>Total Price:</span>
                  <span className="text-xl font-bold text-gold">${editingBooking.pricing?.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">To change pricing, use the View Details modal and override the price.</p>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewConfirmation(editingBooking.id)}
                    className="bg-white"
                    disabled={previewLoading}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {previewLoading ? 'Loading...' : 'Preview Confirmation'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendConfirmation(editingBooking.id)}
                    className="bg-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Confirmation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualCalendarSync(editingBooking.id)}
                    className="bg-white"
                    disabled={calendarLoading}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Sync to Calendar
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditBookingModal(false);
                    setEditingBooking(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditedBooking}
                  className="bg-gold hover:bg-gold/90 text-black font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Confirmation Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Confirmation Email
            </DialogTitle>
          </DialogHeader>
          
          {previewBookingInfo && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm"><strong>To:</strong> {previewBookingInfo.email}</p>
              {previewBookingInfo.ccEmail && (
                <p className="text-sm"><strong>CC:</strong> {previewBookingInfo.ccEmail}</p>
              )}
              <p className="text-sm"><strong>Customer:</strong> {previewBookingInfo.name}</p>
              <p className="text-sm"><strong>Phone:</strong> {previewBookingInfo.phone}</p>
            </div>
          )}
          
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="bg-white"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewHtml('');
                setPreviewBookingInfo(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleSendAfterPreview}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete {selectedBookings.size} Booking{selectedBookings.size > 1 ? 's' : ''}?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ No notifications will be sent</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                The selected bookings will be permanently deleted without sending any SMS or email notifications to customers.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              This action cannot be undone. Are you sure you want to delete these test/spam bookings?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedBookings.size} Booking{selectedBookings.size > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
