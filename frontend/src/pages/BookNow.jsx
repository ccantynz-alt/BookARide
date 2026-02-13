import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Users, DollarSign, Clock, Mail, Phone, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import SEO from '../components/SEO';
import LoadingSpinner from '../components/LoadingSpinner';
import CurrencyConverter from '../components/CurrencyConverter';
import TripCostSplitter from '../components/TripCostSplitter';
import WeatherWidget from '../components/WeatherWidget';
import LiveJourneyVisualizer from '../components/LiveJourneyVisualizer';
import { CustomDatePicker, CustomTimePicker } from '../components/DateTimePicker';
import PriceComparison from '../components/PriceComparison';
import BookingAddOns, { addOns } from '../components/BookingAddOns';
import TrustBadges from '../components/TrustBadges';
import GoogleReviewsWidget from '../components/GoogleReviewsWidget';
import SocialProofCounter from '../components/SocialProofCounter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BookNow = () => {
  const { i18n } = useTranslation();

  const [formData, setFormData] = useState({
    serviceType: '',
    pickupAddress: '',
    pickupAddresses: [],  // Multiple pickups support
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    vipAirportPickup: false,
    oversizedLuggage: false,
    departureFlightNumber: '',
    departureTime: '',
    arrivalFlightNumber: '',
    arrivalTime: '',
    bookReturn: false,
    returnDate: '',
    returnTime: '',
    returnDepartureFlightNumber: '',
    returnDepartureTime: '',
    returnArrivalFlightNumber: '',
    returnArrivalTime: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    paymentMethod: 'card',  // 'card' or 'afterpay'
    notificationPreference: 'both'  // 'email', 'sms', or 'both'
  });

  // Load saved customer details on mount
  const [isReturningCustomer, setIsReturningCustomer] = useState(false);
  
  useEffect(() => {
    const savedCustomer = localStorage.getItem('bookaride_customer');
    if (savedCustomer) {
      try {
        const customer = JSON.parse(savedCustomer);
        setFormData(prev => ({
          ...prev,
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || ''
        }));
        setIsReturningCustomer(true);
      } catch (e) {
        console.error('Error loading saved customer:', e);
      }
    }
  }, []);

  // Save customer details after successful booking
  const saveCustomerDetails = () => {
    if (formData.name && formData.email) {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        lastBooking: new Date().toISOString()
      };
      localStorage.setItem('bookaride_customer', JSON.stringify(customerData));
    }
  };

  // Clear saved customer details
  const clearSavedCustomer = () => {
    localStorage.removeItem('bookaride_customer');
    setFormData(prev => ({
      ...prev,
      name: '',
      email: '',
      phone: ''
    }));
    setIsReturningCustomer(false);
  };

  // Date/Time picker states
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  const [departureTimeDate, setDepartureTimeDate] = useState(null);
  const [arrivalTimeDate, setArrivalTimeDate] = useState(null);
  const [returnDatePicker, setReturnDatePicker] = useState(null);
  const [returnTimePicker, setReturnTimePicker] = useState(null);
  const [returnDepartureTimeDate, setReturnDepartureTimeDate] = useState(null);
  const [returnArrivalTimeDate, setReturnArrivalTimeDate] = useState(null);

  const [pricing, setPricing] = useState({
    distance: 0,
    basePrice: 0,
    airportFee: 0,
    oversizedLuggageFee: 0,
    passengerFee: 0,
    stripeFee: 0,
    subtotal: 0,
    totalPrice: 0,
    calculating: false,
    promoCode: null,
    promoDiscount: 0
  });

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [hasPromoFromPopup, setHasPromoFromPopup] = useState(false);

  // Check for saved promo code from exit popup on mount
  useEffect(() => {
    const savedPromo = localStorage.getItem('promoCode');
    if (savedPromo) {
      setPromoCode(savedPromo);
      setHasPromoFromPopup(true);
      // Clear it so it doesn't persist forever
      localStorage.removeItem('promoCode');
    }
  }, []);

  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Calculate total add-ons price
  const addOnsTotal = selectedAddOns.reduce((total, id) => {
    const addOn = addOns.find(a => a.id === id);
    return total + (addOn?.price || 0);
  }, 0);

  // Final total including add-ons and promo discount
  const finalTotal = pricing.totalPrice + addOnsTotal;

  const serviceOptions = [
    { value: 'airport-shuttle', label: 'Airport Shuttle' },
    { value: 'private-transfer', label: 'Private Shuttle Transfer' }
  ];

  // Calculate price when addresses, passengers, VIP service, oversized luggage, or return trip changes
  useEffect(() => {
    if (formData.pickupAddress && formData.dropoffAddress && formData.serviceType) {
      calculatePrice();
    }
  }, [formData.pickupAddress, formData.dropoffAddress, formData.pickupAddresses, formData.passengers, formData.serviceType, formData.bookReturn, formData.vipAirportPickup, formData.oversizedLuggage]);

  const calculatePrice = async () => {
    setPricing(prev => ({ ...prev, calculating: true }));

    try {
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: formData.serviceType,
        pickupAddress: formData.pickupAddress,
        pickupAddresses: formData.pickupAddresses.filter(addr => addr.trim()),  // Filter empty
        dropoffAddress: formData.dropoffAddress,
        passengers: parseInt(formData.passengers),
        vipAirportPickup: formData.vipAirportPickup,
        oversizedLuggage: formData.oversizedLuggage
      });

      // If return trip is booked, double the price (round trip)
      const multiplier = formData.bookReturn ? 2 : 1;
      
      // Calculate Stripe fee for the multiplied amount
      const subtotal = response.data.subtotal * multiplier;
      const stripeFee = (subtotal * 0.029) + 0.30;
      
      setPricing({
        distance: response.data.distance * multiplier,
        basePrice: response.data.basePrice * multiplier,
        airportFee: response.data.airportFee * multiplier,
        oversizedLuggageFee: response.data.oversizedLuggageFee * multiplier,
        passengerFee: response.data.passengerFee * multiplier,
        stripeFee: Math.round(stripeFee * 100) / 100,
        subtotal: subtotal,
        totalPrice: Math.round((subtotal + stripeFee) * 100) / 100,
        calculating: false
      });
      
      // Auto-apply promo code if one was entered before price calculation
      if (promoCode.trim() && !promoApplied) {
        // Delay slightly to ensure state is updated
        setTimeout(() => {
          handleApplyPromoWithSubtotal(promoCode.trim(), subtotal);
        }, 100);
      } else {
        // Reset promo if price changes and there's no pending code
        setPromoApplied(null);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPricing(prev => ({ ...prev, calculating: false }));
      toast.error('Unable to calculate distance. Please check addresses.');
    }
  };

  // Apply promo code with specific subtotal (for auto-apply after price calc)
  const handleApplyPromoWithSubtotal = async (code, subtotal) => {
    setApplyingPromo(true);
    setPromoError('');
    
    try {
      const response = await axios.post(`${API}/validate-promo`, {
        code: code,
        subtotal: subtotal
      });
      
      setPromoApplied(response.data);
      toast.success(`Promo code applied! You saved $${response.data.discountAmount.toFixed(2)}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid promo code';
      setPromoError(message);
      setPromoApplied(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  // Apply promo code (manual button click)
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    if (pricing.subtotal <= 0) {
      setPromoError('Get a quote first, then your code will be applied automatically');
      return;
    }
    
    setApplyingPromo(true);
    setPromoError('');
    
    try {
      const response = await axios.post(`${API}/validate-promo`, {
        code: promoCode.trim(),
        subtotal: pricing.subtotal
      });
      
      setPromoApplied(response.data);
      toast.success(`Promo code applied! You saved $${response.data.discountAmount.toFixed(2)}`);
    } catch (error) {
      const message = error.response?.data?.detail || 'Invalid promo code';
      setPromoError(message);
      setPromoApplied(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  // Remove promo code
  const handleRemovePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPickup = () => {
    setFormData(prev => ({
      ...prev,
      pickupAddresses: [...prev.pickupAddresses, '']
    }));
  };

  const handleRemovePickup = (index) => {
    setFormData(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index)
    }));
  };

  const handlePickupAddressChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Enhanced validation with helpful messages
    if (!formData.serviceType) {
      toast.error('Please select a service type');
      return;
    }
    
    if (!formData.pickupAddress || !formData.dropoffAddress) {
      toast.error('Please enter both pickup and drop-off addresses');
      return;
    }
    
    if (!formData.date || !formData.time) {
      toast.error('Please select pickup date and time');
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all contact information');
      return;
    }

    // Validate return flight number for airport shuttle return bookings
    const isAirportShuttle = formData.serviceType?.toLowerCase().includes('airport') || 
                            formData.serviceType?.toLowerCase().includes('shuttle');
    if (isAirportShuttle && formData.bookReturn) {
      if (!formData.returnDepartureFlightNumber || !formData.returnDepartureFlightNumber.trim()) {
        toast.error('Flight number is mandatory for return trips. Bookings without flight numbers may face cancellation.');
        return;
      }
      if (!formData.returnDate || !formData.returnTime) {
        toast.error('Please select return date and time for your return trip');
        return;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (pricing.totalPrice === 0) {
      toast.error('Please wait for price calculation to complete');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const bookingData = {
        ...formData,
        pricing: pricing,
        status: 'pending',
        language: i18n.language, // Capture selected language
        createdAt: new Date()
      };

      const bookingResponse = await axios.post(`${API}/bookings`, bookingData);
      const booking = bookingResponse.data;

      // Save customer details for future bookings
      saveCustomerDetails();

      // Check payment method
      if (formData.paymentMethod === 'afterpay') {
        // Create Afterpay checkout
        const afterpayData = {
          booking_id: booking.id,
          redirect_confirm_url: `${window.location.origin}/payment-success?method=afterpay`,
          redirect_cancel_url: `${window.location.origin}/book-now`
        };

        const afterpayResponse = await axios.post(`${API}/afterpay/create-checkout`, afterpayData);

        if (afterpayResponse.data.redirect_url) {
          window.location.href = afterpayResponse.data.redirect_url;
        } else {
          setIsProcessingPayment(false);
          toast.error('Unable to redirect to Afterpay');
        }
      } else {
        // Create Stripe checkout session (default)
        const paymentData = {
          booking_id: booking.id,
          origin_url: window.location.origin
        };

        const checkoutResponse = await axios.post(`${API}/payment/create-checkout`, paymentData);

        // Redirect to Stripe Checkout
        if (checkoutResponse.data.url) {
          window.location.href = checkoutResponse.data.url;
        } else {
          setIsProcessingPayment(false);
          toast.error('Unable to redirect to payment page');
        }
      }

    } catch (error) {
      console.error('Error submitting booking:', error);
      setIsProcessingPayment(false);
      toast.error('Failed to submit booking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {isProcessingPayment && <LoadingSpinner message="Processing your booking..." />}
      <SEO 
        title="Book Your Airport Shuttle Now - Instant Quote & Online Booking"
        description="Book your airport shuttle online with instant live pricing. Auckland, Hamilton, Whangarei airport transfers. Easy online booking, secure payment, live price calculator. Book your shuttle service now!"
        keywords="book airport shuttle, book airport transfer, online shuttle booking, airport shuttle booking online, instant quote shuttle, book shuttle Auckland, airport transfer booking, shuttle service booking"
        canonical="/book-now"
      />
      {/* Hero Section with Professional Image */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Background Image - Luxury Travel */}
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1920&q=80" 
            alt="Road trip scenic drive" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/70 via-gray-900/60 to-gray-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-block mb-4">
              <span className="bg-gold/20 text-gold text-sm font-semibold px-4 py-2 rounded-full border border-gold/30">
                ✨ INSTANT ONLINE BOOKING
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Book Your <span className="text-gold">Ride</span>
            </h1>
            <p className="text-xl text-white/80">
              Get instant pricing with our live calculator • No hidden fees
            </p>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form - Left Side */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-2 border-gray-200 shadow-lg">
                    <CardContent className="p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Trip Details</h2>

                      {/* Service Type */}
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="serviceType" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Service Type *</span>
                        </Label>
                        <Select onValueChange={(value) => handleSelectChange('serviceType', value)} required>
                          <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-gold">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Pickup Address */}
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="pickupAddress" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Pickup Location 1 *</span>
                        </Label>
                        <Input
                          id="pickupAddress"
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={handleChange}
                          placeholder="Start typing address..."
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                        <p className="text-xs text-gray-500">Enter full street address for accurate pricing</p>
                      </div>

                      {/* Additional Pickup Addresses */}
                      {formData.pickupAddresses.map((pickup, index) => (
                        <div key={index} className="space-y-2 mb-6">
                          <Label className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gold" />
                            <span>Pickup Location {index + 2}</span>
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              value={pickup}
                              onChange={(e) => handlePickupAddressChange(index, e.target.value)}
                              placeholder="Start typing address..."
                              className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-gold"
                            />
                            <Button
                              type="button"
                              onClick={() => handleRemovePickup(index)}
                              className="bg-red-50 text-red-600 hover:bg-red-100 px-4"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add Pickup Button - Elegant Design */}
                      <div className="mb-6">
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
                          Need multiple pickups? Add as many locations as you need!
                        </p>
                      </div>

                      {/* Dropoff Address */}
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="dropoffAddress" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Drop-off Address *</span>
                        </Label>
                        <Input
                          id="dropoffAddress"
                          name="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={handleChange}
                          placeholder="Start typing address..."
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                        <p className="text-xs text-gray-500">Enter full street address for accurate pricing</p>
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gold" />
                            <span>Pickup Date *</span>
                          </Label>
                          <CustomDatePicker
                            selected={pickupDate}
                            onChange={(date) => {
                              setPickupDate(date);
                              if (date) {
                                // Use local date to avoid timezone issues
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const formattedDate = `${year}-${month}-${day}`;
                                setFormData(prev => ({ ...prev, date: formattedDate }));
                              }
                            }}
                            placeholder="Select pickup date"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gold" />
                            <span>Pickup Time *</span>
                          </Label>
                          <CustomTimePicker
                            selected={pickupTime}
                            onChange={(time) => {
                              setPickupTime(time);
                              if (time) {
                                const hours = time.getHours().toString().padStart(2, '0');
                                const minutes = time.getMinutes().toString().padStart(2, '0');
                                setFormData(prev => ({ ...prev, time: `${hours}:${minutes}` }));
                              }
                            }}
                            placeholder="Select pickup time"
                            required
                          />
                        </div>
                      </div>

                      {/* Flight Information */}
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Flight Information</h3>
                        <p className="text-sm text-gray-600 mb-2">Enter your flight number so our driver knows which flight to meet.</p>
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-4">
                          ⚠️ <strong>Important:</strong> Flight numbers are required for airport pickups so our driver can meet you on time.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="departureFlightNumber">Departure Flight Number</Label>
                            <Input
                              id="departureFlightNumber"
                              name="departureFlightNumber"
                              value={formData.departureFlightNumber}
                              onChange={handleChange}
                              placeholder="e.g., NZ123"
                              className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Departure Time</Label>
                            <CustomTimePicker
                              selected={departureTimeDate}
                              onChange={(time) => {
                                setDepartureTimeDate(time);
                                if (time) {
                                  const hours = time.getHours().toString().padStart(2, '0');
                                  const minutes = time.getMinutes().toString().padStart(2, '0');
                                  setFormData(prev => ({ ...prev, departureTime: `${hours}:${minutes}` }));
                                }
                              }}
                              placeholder="Select departure time"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="arrivalFlightNumber">Arrival Flight Number</Label>
                            <Input
                              id="arrivalFlightNumber"
                              name="arrivalFlightNumber"
                              value={formData.arrivalFlightNumber}
                              onChange={handleChange}
                              placeholder="e.g., NZ456"
                              className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Arrival Time</Label>
                            <CustomTimePicker
                              selected={arrivalTimeDate}
                              onChange={(time) => {
                                setArrivalTimeDate(time);
                                if (time) {
                                  const hours = time.getHours().toString().padStart(2, '0');
                                  const minutes = time.getMinutes().toString().padStart(2, '0');
                                  setFormData(prev => ({ ...prev, arrivalTime: `${hours}:${minutes}` }));
                                }
                              }}
                              placeholder="Select arrival time"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Passengers */}
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="passengers" className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gold" />
                          <span>Number of Passengers *</span>
                        </Label>
                        <Select 
                          value={formData.passengers}
                          onValueChange={(value) => handleSelectChange('passengers', value)} 
                          required
                        >
                          <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-gold">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8,9,10,11].map(num => (
                              <SelectItem key={num} value={num.toString()}>{num} {num === 1 ? 'Passenger' : 'Passengers'}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">1st passenger included, $5 per additional passenger</p>
                      </div>

                      {/* VIP Airport Pickup Service */}
                      <div className="mb-6 bg-gold/5 p-4 rounded-lg border border-gold/20">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="vipAirportPickup"
                            name="vipAirportPickup"
                            checked={formData.vipAirportPickup}
                            onChange={(e) => setFormData(prev => ({ ...prev, vipAirportPickup: e.target.checked }))}
                            className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="vipAirportPickup" className="cursor-pointer font-semibold text-gray-900">
                              VIP Airport Pickup Service - $15
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">
                              VIP parking close to door eleven
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Oversized Luggage Service */}
                      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="oversizedLuggage"
                            name="oversizedLuggage"
                            checked={formData.oversizedLuggage}
                            onChange={(e) => setFormData(prev => ({ ...prev, oversizedLuggage: e.target.checked }))}
                            className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="oversizedLuggage" className="cursor-pointer font-semibold text-gray-900">
                              Oversized Luggage Service - $25
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">
                              For skis, snowboards, surfboards, golf clubs, bikes, or extra-large suitcases
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Return Trip Option */}
                      <div className="mb-6">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="bookReturn"
                            name="bookReturn"
                            checked={formData.bookReturn}
                            onChange={(e) => setFormData(prev => ({ ...prev, bookReturn: e.target.checked }))}
                            className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold"
                          />
                          <Label htmlFor="bookReturn" className="cursor-pointer">
                            Book a return trip
                          </Label>
                        </div>
                      </div>

                      {/* Return Trip Details - Conditional */}
                      {formData.bookReturn && (
                        <div className="bg-gold/10 p-6 rounded-lg mb-6 border-2 border-gold/30">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Trip Details</h3>
                          
                          {/* Return Date and Time */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gold" />
                                <span>Return Date *</span>
                              </Label>
                              <CustomDatePicker
                                selected={returnDatePicker}
                                onChange={(date) => {
                                  setReturnDatePicker(date);
                                  if (date) {
                                    // Use local date to avoid timezone issues
                                    const year = date.getFullYear();
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const formattedDate = `${year}-${month}-${day}`;
                                    setFormData(prev => ({ ...prev, returnDate: formattedDate }));
                                  }
                                }}
                                placeholder="Select return date"
                                minDate={pickupDate || new Date()}
                                required={formData.bookReturn}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gold" />
                                <span>Return Time *</span>
                              </Label>
                              <CustomTimePicker
                                selected={returnTimePicker}
                                onChange={(time) => {
                                  setReturnTimePicker(time);
                                  if (time) {
                                    const hours = time.getHours().toString().padStart(2, '0');
                                    const minutes = time.getMinutes().toString().padStart(2, '0');
                                    setFormData(prev => ({ ...prev, returnTime: `${hours}:${minutes}` }));
                                  }
                                }}
                                placeholder="Select return time"
                                required={formData.bookReturn}
                              />
                            </div>
                          </div>

                          {/* Return Flight Information */}
                          <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">
                              Return Flight Information 
                              <span className="text-red-500 ml-1">*</span>
                              <span className="text-sm font-normal text-gray-500 ml-2">(Required for return trips)</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="returnDepartureFlightNumber">
                                  Return Flight Number <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  id="returnDepartureFlightNumber"
                                  name="returnDepartureFlightNumber"
                                  value={formData.returnDepartureFlightNumber}
                                  onChange={handleChange}
                                  placeholder="e.g., NZ123"
                                  required={formData.bookReturn}
                                  className={`transition-all duration-200 focus:ring-2 focus:ring-gold ${!formData.returnDepartureFlightNumber && formData.bookReturn ? 'border-red-300 bg-red-50' : ''}`}
                                />
                                {!formData.returnDepartureFlightNumber && formData.bookReturn && (
                                  <p className="text-xs text-red-500 font-medium">⚠️ Flight number is mandatory for return trips. Bookings without flight numbers may face cancellation.</p>
                                )}
                              </div>
                              <div className="space-y-2">
                                <Label>Departure Time</Label>
                                <CustomTimePicker
                                  selected={returnDepartureTimeDate}
                                  onChange={(time) => {
                                    setReturnDepartureTimeDate(time);
                                    if (time) {
                                      const hours = time.getHours().toString().padStart(2, '0');
                                      const minutes = time.getMinutes().toString().padStart(2, '0');
                                      setFormData(prev => ({ ...prev, returnDepartureTime: `${hours}:${minutes}` }));
                                    }
                                  }}
                                  placeholder="Select departure time"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="returnArrivalFlightNumber">Arrival Flight Number (Optional)</Label>
                                <Input
                                  id="returnArrivalFlightNumber"
                                  name="returnArrivalFlightNumber"
                                  value={formData.returnArrivalFlightNumber}
                                  onChange={handleChange}
                                  placeholder="e.g., NZ456"
                                  className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Arrival Time</Label>
                                <CustomTimePicker
                                  selected={returnArrivalTimeDate}
                                  onChange={(time) => {
                                    setReturnArrivalTimeDate(time);
                                    if (time) {
                                      const hours = time.getHours().toString().padStart(2, '0');
                                      const minutes = time.getMinutes().toString().padStart(2, '0');
                                      setFormData(prev => ({ ...prev, returnArrivalTime: `${hours}:${minutes}` }));
                                    }
                                  }}
                                  placeholder="Select arrival time"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-4">
                            Return trip will be from <strong>{formData.dropoffAddress || 'drop-off location'}</strong> back to <strong>{formData.pickupAddress || 'pickup location'}</strong>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card className="border-2 border-gray-200 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                        {isReturningCustomer && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 font-medium">👋 Welcome back!</span>
                            <button
                              type="button"
                              onClick={clearSavedCustomer}
                              className="text-xs text-gray-400 hover:text-red-500 underline"
                            >
                              Not you?
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gold" />
                            <span>Full Name *</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            required
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gold" />
                              <span>Email *</span>
                            </Label>
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="john@example.com"
                              required
                              className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gold" />
                              <span>Phone *</span>
                            </Label>
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="+64 21 123 4567"
                              required
                              className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                            />
                          </div>
                        </div>

                        {/* Notification Preference */}
                        <div className="space-y-3">
                          <Label className="text-base font-medium">How would you like to receive confirmations?</Label>
                          <div className="flex flex-wrap gap-3">
                            {[
                              { value: 'both', label: '📧 Email & SMS', desc: 'Get both' },
                              { value: 'sms', label: '📱 SMS Only', desc: 'Text messages only' },
                              { value: 'email', label: '✉️ Email Only', desc: 'No text messages' }
                            ].map((option) => (
                              <label
                                key={option.value}
                                className={`flex-1 min-w-[140px] cursor-pointer rounded-lg border-2 p-3 transition-all ${
                                  formData.notificationPreference === option.value
                                    ? 'border-gold bg-gold/10'
                                    : 'border-gray-200 hover:border-gold/50'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="notificationPreference"
                                  value={option.value}
                                  checked={formData.notificationPreference === option.value}
                                  onChange={handleChange}
                                  className="sr-only"
                                />
                                <span className="block text-sm font-medium">{option.label}</span>
                                <span className="block text-xs text-gray-500">{option.desc}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Special Requests / Notes</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder="Any special requirements or notes..."
                            rows={3}
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Price Summary - Right Side */}
                <div className="lg:col-span-1">
                  <Card className="border-2 border-gold/30 sticky top-24 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-2 mb-6">
                        <DollarSign className="w-6 h-6 text-gold" />
                        <h2 className="text-2xl font-bold text-gray-900">Price Estimate</h2>
                      </div>

                      {pricing.calculating ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                          <p className="text-gray-600">Calculating your quote...</p>
                        </div>
                      ) : pricing.totalPrice > 0 ? (
                        <div className="space-y-4">
                          <div className="text-center py-6">
                            <p className="text-gray-600 mb-2">Your Quote</p>
                            <span className="text-5xl font-bold text-gold">${finalTotal.toFixed(2)}</span>
                            <p className="text-gray-500 text-sm mt-2">NZD - Fixed Price, No Hidden Fees</p>
                            {promoApplied && (
                              <p className="text-xs text-green-600 mt-1 font-medium">
                                🎉 You saved ${promoApplied.discountAmount.toFixed(2)} with {promoApplied.code}!
                              </p>
                            )}
                          </div>
                          
                          {/* Price Breakdown */}
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Trip fare</span>
                              <span className={`font-medium ${promoApplied ? 'line-through text-gray-400' : ''}`}>
                                ${pricing.subtotal?.toFixed(2) || pricing.basePrice?.toFixed(2)}
                              </span>
                            </div>
                            {pricing.stripeFee > 0 && (
                              <div className="flex justify-between text-gray-500">
                                <span>Card processing fee</span>
                                <span>${pricing.stripeFee.toFixed(2)}</span>
                              </div>
                            )}
                            {addOnsTotal > 0 && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Add-ons</span>
                                <span className="font-medium">${addOnsTotal.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t pt-2 font-semibold">
                              <span>Total</span>
                              <span className="text-gold">${finalTotal.toFixed(2)}</span>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600">
                              {formData.bookReturn ? `${pricing.distance / 2} km each way` : `${pricing.distance} km`} • {formData.passengers} passenger{parseInt(formData.passengers) > 1 ? 's' : ''}
                              {formData.bookReturn && ' • Round trip (both ways)'}
                            </p>
                          </div>

                          {/* Price Comparison - Show savings vs Uber/Taxi */}
                          <PriceComparison 
                            bookaridePrice={finalTotal} 
                            distance={pricing.distance} 
                          />

                          {/* Booking Add-ons */}
                          <div className="pt-4 border-t border-gray-200">
                            <BookingAddOns
                              selectedAddOns={selectedAddOns}
                              onAddOnChange={setSelectedAddOns}
                              showAll={false}
                            />
                          </div>
                          
                          {/* Currency Converter */}
                          <div className="mt-6">
                            <CurrencyConverter nzdPrice={finalTotal} />
                          </div>

                          {/* Trip Cost Splitter - for group bookings */}
                          {formData.passengers > 1 && (
                            <div className="mt-4">
                              <TripCostSplitter 
                                totalPrice={finalTotal} 
                                passengers={parseInt(formData.passengers) || 2} 
                              />
                            </div>
                          )}

                          {/* Weather at Destination */}
                          <div className="mt-4">
                            <WeatherWidget location={formData.dropoffAddress || 'Auckland'} />
                          </div>

                          {/* Social Proof */}
                          <div className="mt-6">
                            <SocialProofCounter variant="urgency" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-500 mb-4">Enter addresses to see price estimate</p>
                        </div>
                      )}

                      {/* Trust Badges */}
                      <div className="mt-6">
                        <TrustBadges variant="payment" />
                      </div>

                      {/* Secure Payment Info */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            <path d="M9 12l2 2 4-4"/>
                          </svg>
                          <span className="font-semibold text-gray-800">Secure Payment</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Pay securely with credit/debit card via Stripe
                        </p>
                        <div className="flex items-center gap-2">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/100px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6 object-contain" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/100px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6 object-contain" />
                          <span className="text-xs text-gray-400 ml-2">Powered by Stripe</span>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full mt-6 bg-gold hover:bg-gold/90 text-black font-semibold py-6 text-lg transition-colors duration-200"
                        disabled={pricing.calculating || pricing.totalPrice === 0}
                      >
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookNow;
