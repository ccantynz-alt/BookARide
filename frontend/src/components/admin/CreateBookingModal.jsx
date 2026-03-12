import React, { useState, useEffect, useRef, memo } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { CustomDatePicker, CustomTimePicker } from '../DateTimePicker';
import AddressAutocomplete from '../AddressAutocomplete';
import axios from 'axios';
import { API } from '../../config/api';

const CreateBookingModal = memo(({ open, onClose, onSuccess, getAuthHeaders }) => {
  const [newBooking, setNewBooking] = useState({
    name: '',
    email: '',
    ccEmail: '',
    phone: '',
    serviceType: 'private-transfer',
    pickupAddress: '',
    pickupAddresses: [],
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    paymentMethod: 'stripe',
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
  const [bookingPricing, setBookingPricing] = useState({
    distance: 0,
    basePrice: 0,
    airportFee: 0,
    passengerFee: 0,
    totalPrice: 0
  });
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [manualPriceOverride, setManualPriceOverride] = useState('');

  // Customer autocomplete state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const customerSearchRef = useRef(null);

  // Date/Time picker states
  const [adminPickupDate, setAdminPickupDate] = useState(null);
  const [adminPickupTime, setAdminPickupTime] = useState(null);
  const [adminReturnDate, setAdminReturnDate] = useState(null);
  const [adminReturnTime, setAdminReturnTime] = useState(null);
  const [adminFlightArrivalTime, setAdminFlightArrivalTime] = useState(null);
  const [adminFlightDepartureTime, setAdminFlightDepartureTime] = useState(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setNewBooking({
        name: '', email: '', ccEmail: '', phone: '',
        serviceType: 'private-transfer', pickupAddress: '', pickupAddresses: [],
        dropoffAddress: '', date: '', time: '', passengers: '1',
        paymentMethod: 'stripe', notes: '',
        flightArrivalNumber: '', flightArrivalTime: '',
        flightDepartureNumber: '', flightDepartureTime: '',
        bookReturn: false, returnDate: '', returnTime: '',
        returnDepartureFlightNumber: '', returnDepartureTime: '',
        returnArrivalFlightNumber: '', returnArrivalTime: ''
      });
      setBookingPricing({ distance: 0, basePrice: 0, airportFee: 0, passengerFee: 0, totalPrice: 0 });
      setManualPriceOverride('');
      setCustomerSearchQuery('');
      setAdminPickupDate(null);
      setAdminPickupTime(null);
      setAdminReturnDate(null);
      setAdminReturnTime(null);
      setAdminFlightArrivalTime(null);
      setAdminFlightDepartureTime(null);
    }
  }, [open]);

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchQuery) {
        searchCustomers(customerSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    setSearchingCustomers(true);
    try {
      const response = await axios.get(`${API}/customers/search?q=${encodeURIComponent(query)}`, getAuthHeaders());
      setCustomerSearchResults(response.data.customers || []);
      setShowCustomerDropdown(response.data.customers?.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  const selectCustomer = (customer) => {
    setNewBooking(prev => ({
      ...prev,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      pickupAddress: customer.pickupAddress || prev.pickupAddress,
      dropoffAddress: customer.dropoffAddress || prev.dropoffAddress
    }));
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
    toast.success(`Loaded ${customer.name}'s details (${customer.totalBookings} previous bookings)`);
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
      const hasReturn = !!(newBooking.returnDate && newBooking.returnTime);
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: newBooking.serviceType,
        pickupAddress: newBooking.pickupAddress,
        pickupAddresses: newBooking.pickupAddresses.filter(addr => addr.trim()),
        dropoffAddress: newBooking.dropoffAddress,
        passengers: parseInt(newBooking.passengers),
        vipAirportPickup: false,
        oversizedLuggage: false,
        bookReturn: hasReturn
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

  const handleAddPickup = () => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: [...prev.pickupAddresses, '']
    }));
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

  const handleCreateManualBooking = async () => {
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

    const hasReturnTrip = !!(newBooking.returnDate && newBooking.returnTime);
    const isAirportShuttle = (newBooking.serviceType || '').toLowerCase().includes('airport') || (newBooking.serviceType || '').toLowerCase().includes('shuttle');
    if (hasReturnTrip && isAirportShuttle && !(newBooking.returnDepartureFlightNumber || '').trim()) {
      toast.error('Return flight number is required for airport shuttle return trips');
      return;
    }

    const hasCalculatedPrice = bookingPricing.totalPrice > 0;
    const hasManualPrice = manualPriceOverride && parseFloat(manualPriceOverride) > 0;
    if (!hasCalculatedPrice && !hasManualPrice) {
      toast.error('Please calculate the price or enter a manual price override');
      return;
    }

    try {
      let finalPrice = hasManualPrice ? parseFloat(manualPriceOverride) : bookingPricing.totalPrice;
      if (hasReturnTrip && !hasManualPrice) {
        finalPrice = finalPrice * 2;
      }
      const priceOverride = hasManualPrice ? parseFloat(manualPriceOverride) : (hasReturnTrip ? finalPrice : null);

      await axios.post(`${API}/bookings/manual`, {
        name: newBooking.name,
        email: newBooking.email,
        ccEmail: newBooking.ccEmail,
        phone: newBooking.phone,
        serviceType: newBooking.serviceType,
        pickupAddress: newBooking.pickupAddress,
        pickupAddresses: newBooking.pickupAddresses.filter(addr => addr.trim()),
        dropoffAddress: newBooking.dropoffAddress,
        date: newBooking.date,
        time: newBooking.time,
        passengers: newBooking.passengers,
        pricing: hasReturnTrip ? { ...bookingPricing, totalPrice: finalPrice } : bookingPricing,
        paymentMethod: newBooking.paymentMethod,
        notes: newBooking.notes,
        priceOverride: priceOverride,
        flightArrivalNumber: newBooking.flightArrivalNumber,
        flightArrivalTime: newBooking.flightArrivalTime,
        flightDepartureNumber: newBooking.flightDepartureNumber,
        flightDepartureTime: newBooking.flightDepartureTime,
        bookReturn: hasReturnTrip,
        returnDate: newBooking.returnDate,
        returnTime: newBooking.returnTime,
        returnDepartureFlightNumber: newBooking.returnDepartureFlightNumber,
        returnDepartureTime: newBooking.returnDepartureTime,
        returnArrivalFlightNumber: newBooking.returnArrivalFlightNumber,
        returnArrivalTime: newBooking.returnArrivalTime
      }, getAuthHeaders());

      toast.success('Booking created successfully! Customer will receive email & SMS confirmation.');
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to create booking');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* Customer Search & Information */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>

            {/* Customer Search Autocomplete */}
            <div className="mb-4 relative" ref={customerSearchRef}>
              <Label className="text-amber-600 font-medium">Search Existing Customer</Label>
              <div className="relative mt-1">
                <Input
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    if (!e.target.value) setShowCustomerDropdown(false);
                  }}
                  placeholder="Type customer name, email, or phone to search..."
                  className="pr-10"
                />
                {searchingCustomers && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {showCustomerDropdown && customerSearchResults.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {customerSearchResults.map((customer, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => selectCustomer(customer)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                          <p className="text-sm text-gray-500">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            {customer.totalBookings} bookings
                          </span>
                          {customer.lastBookingDate && (
                            <p className="text-xs text-gray-400 mt-1">Last: {customer.lastBookingDate}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">Start typing to find existing customers</p>
            </div>

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
                    <SelectItem value="private-transfer">Private Transfer</SelectItem>
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
                    <SelectItem value="stripe">Stripe - Send Payment Link</SelectItem>
                    <SelectItem value="paypal">PayPal - Send Payment Link</SelectItem>
                    <SelectItem value="xero">Xero - Send Invoice</SelectItem>
                    <SelectItem value="pay-on-pickup">Pay on Pickup (Cash)</SelectItem>
                    <SelectItem value="card">Card (Already Paid)</SelectItem>
                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
                {(newBooking.paymentMethod === 'stripe' || newBooking.paymentMethod === 'paypal') && (
                  <p className="text-xs text-gold mt-1">
                    A payment link will be sent to the customer's email after booking is created.
                  </p>
                )}
                {newBooking.paymentMethod === 'xero' && (
                  <p className="text-xs text-purple-600 mt-1">
                    An invoice will be created in Xero and emailed to the customer automatically.
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
                <AddressAutocomplete
                  value={newBooking.pickupAddress}
                  onChange={(val) => setNewBooking(prev => ({ ...prev, pickupAddress: val }))}
                  onSelect={(val) => setNewBooking(prev => ({ ...prev, pickupAddress: val }))}
                  placeholder="Start typing an address..."
                  className="mt-1"
                />
              </div>

              {newBooking.pickupAddresses.map((pickup, index) => (
                <div key={index} className="relative">
                  <Label>Pickup Address {index + 2}</Label>
                  <div className="flex gap-2 mt-1">
                    <AddressAutocomplete
                      value={pickup}
                      onChange={(val) => handlePickupAddressChange(index, val)}
                      onSelect={(val) => handlePickupAddressChange(index, val)}
                      placeholder="Start typing an address..."
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
                <AddressAutocomplete
                  value={newBooking.dropoffAddress}
                  onChange={(val) => setNewBooking(prev => ({ ...prev, dropoffAddress: val }))}
                  onSelect={(val) => setNewBooking(prev => ({ ...prev, dropoffAddress: val }))}
                  placeholder="Start typing an address..."
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Date * (can backdate for invoicing)</Label>
                  <div className="mt-1">
                    <CustomDatePicker
                      selected={adminPickupDate}
                      onChange={(date) => {
                        setAdminPickupDate(date);
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setNewBooking(prev => ({...prev, date: `${year}-${month}-${day}`}));
                        }
                      }}
                      placeholder="Select date"
                      minDate={new Date('2020-01-01')}
                      maxDate={new Date('2030-12-31')}
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
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

              {/* Flight Details & Return Journey - Single Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  Flight Details (Optional)
                </h4>
                <p className="text-xs text-gray-600 mb-3">
                  Add flight details for airport pickups/drop-offs to better track and coordinate transfers
                </p>
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

                {/* Return Journey sub-section */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Return Journey <span className="text-sm font-normal text-gray-500">(Optional – leave blank for one-way)</span></h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Return trip: Drop-off → Pickup (reverse of outbound journey)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Return Date *</Label>
                      <div className="mt-1">
                        <CustomDatePicker
                          selected={adminReturnDate}
                          onChange={(date) => {
                            setAdminReturnDate(date);
                            if (date) {
                              const year = date.getFullYear();
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const day = String(date.getDate()).padStart(2, '0');
                              setNewBooking(prev => ({...prev, returnDate: `${year}-${month}-${day}`}));
                            }
                          }}
                          placeholder="Select return date"
                          minDate={new Date('2020-01-01')}
                          maxDate={new Date('2030-12-31')}
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
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
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Return Flight Information (required if booking return)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Return Flight Number</Label>
                        <Input
                          value={newBooking.returnDepartureFlightNumber || ''}
                          onChange={(e) => setNewBooking(prev => ({...prev, returnDepartureFlightNumber: e.target.value}))}
                          placeholder="e.g. NZ456"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Return Arrival Flight (optional)</Label>
                        <Input
                          value={newBooking.returnArrivalFlightNumber || ''}
                          onChange={(e) => setNewBooking(prev => ({...prev, returnArrivalFlightNumber: e.target.value}))}
                          placeholder="e.g. NZ789"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
                  {(newBooking.returnDate && newBooking.returnTime) && (
                    <div className="flex justify-between text-green-700">
                      <span>Return Trip:</span>
                      <span className="font-medium">x2</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold text-base">
                    <span>Total:</span>
                    <span className="text-gold">
                      ${((newBooking.returnDate && newBooking.returnTime) ? bookingPricing.totalPrice * 2 : bookingPricing.totalPrice).toFixed(2)}
                    </span>
                  </div>
                  {(newBooking.returnDate && newBooking.returnTime) && (
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
                Manual Price Override (Optional)
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
            <Button variant="outline" onClick={onClose}>
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
  );
});

CreateBookingModal.displayName = 'CreateBookingModal';

export default CreateBookingModal;
