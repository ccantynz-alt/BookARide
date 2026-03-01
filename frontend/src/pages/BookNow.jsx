import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, Users, DollarSign, Clock, Mail, Phone, User, Wrench, Plane } from 'lucide-react';
import siteConfig from '../config/siteConfig';
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
import { CustomDatePicker, CustomTimePicker } from '../components/DateTimePicker';
import PriceComparison from '../components/PriceComparison';
import TrustBadges from '../components/TrustBadges';
import SocialProofCounter from '../components/SocialProofCounter';
import { API } from '../config/api';

const DROPOFF_QUICK_ADDRESSES = [
  { label: 'Auckland Airport', address: 'Auckland Airport, Ray Emery Drive, Mangere, Auckland 2022, New Zealand' },
  { label: 'Auckland Domestic', address: 'Auckland Airport, Ray Emery Drive, Mangere, Auckland 2022, New Zealand' },
];

export const BookNow = () => {
  const { i18n } = useTranslation();

  const [formData, setFormData] = useState({
    serviceType: '',
    pickupAddress: '',
    pickupAddresses: [],
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    vipAirportPickup: false,
    oversizedLuggage: false,
    // Single flight number field for outbound
    flightNumber: '',
    // Return trip - simplified to just date, time, and one flight number
    returnDate: '',
    returnTime: '',
    returnFlightNumber: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    paymentMethod: 'card',
    notificationPreference: 'both'
  });

  // Returning customer
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

  const saveCustomerDetails = () => {
    if (formData.name && formData.email) {
      localStorage.setItem('bookaride_customer', JSON.stringify({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        lastBooking: new Date().toISOString()
      }));
    }
  };

  const clearSavedCustomer = () => {
    localStorage.removeItem('bookaride_customer');
    setFormData(prev => ({ ...prev, name: '', email: '', phone: '' }));
    setIsReturningCustomer(false);
  };

  // Date/Time picker states - simplified from 8 to 4
  const [pickupDate, setPickupDate] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  const [returnDatePicker, setReturnDatePicker] = useState(null);
  const [returnTimePicker, setReturnTimePicker] = useState(null);

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

  useEffect(() => {
    const savedPromo = localStorage.getItem('promoCode');
    if (savedPromo) {
      setPromoCode(savedPromo);
      setHasPromoFromPopup(true);
      localStorage.removeItem('promoCode');
    }
  }, []);

  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Address autocomplete
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  const [showDropoffSuggestions, setShowDropoffSuggestions] = useState(false);

  const fetchAddressSuggestions = async (query, setter, showSetter) => {
    if (query.length < 3) { setter([]); showSetter(false); return; }
    try {
      const res = await axios.get(`${API}/places/autocomplete`, { params: { input: query } });
      const predictions = res.data?.predictions || [];
      setter(predictions);
      showSetter(predictions.length > 0);
    } catch { setter([]); showSetter(false); }
  };

  const finalTotal = pricing.totalPrice;

  const serviceOptions = [
    { value: 'airport-shuttle', label: 'Airport Shuttle' },
    { value: 'private-transfer', label: 'Private Shuttle Transfer' }
  ];

  // Calculate price when key fields change
  useEffect(() => {
    if (formData.pickupAddress && formData.dropoffAddress && formData.serviceType) {
      calculatePrice();
    }
  }, [formData.pickupAddress, formData.dropoffAddress, formData.pickupAddresses, formData.passengers, formData.serviceType, formData.returnDate, formData.returnTime, formData.vipAirportPickup, formData.oversizedLuggage]);

  const calculatePrice = async () => {
    setPricing(prev => ({ ...prev, calculating: true }));

    try {
      const hasReturnTrip = !!(formData.returnDate && formData.returnTime);
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: formData.serviceType,
        pickupAddress: formData.pickupAddress,
        pickupAddresses: formData.pickupAddresses.filter(addr => addr.trim()),
        dropoffAddress: formData.dropoffAddress,
        passengers: parseInt(formData.passengers),
        vipAirportPickup: formData.vipAirportPickup,
        oversizedLuggage: formData.oversizedLuggage,
        bookReturn: hasReturnTrip
      });

      const data = response.data;
      setPricing({
        distance: data.distance,
        basePrice: data.basePrice,
        airportFee: data.airportFee,
        oversizedLuggageFee: data.oversizedLuggageFee,
        passengerFee: data.passengerFee,
        stripeFee: data.stripeFee ?? Math.round(((data.subtotal * 0.029) + 0.30) * 100) / 100,
        subtotal: data.subtotal,
        totalPrice: data.totalPrice,
        calculating: false
      });

      if (promoCode.trim() && !promoApplied) {
        setTimeout(() => {
          handleApplyPromoWithSubtotal(promoCode.trim(), data.subtotal);
        }, 100);
      } else {
        setPromoApplied(null);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setPricing(prev => ({ ...prev, calculating: false }));
      toast.error('Unable to calculate distance. Please check addresses.');
    }
  };

  const handleApplyPromoWithSubtotal = async (code, subtotal) => {
    setApplyingPromo(true);
    setPromoError('');
    try {
      const response = await axios.post(`${API}/validate-promo`, { code, subtotal });
      setPromoApplied(response.data);
      toast.success(`Promo code applied! You saved $${response.data.discountAmount.toFixed(2)}`);
    } catch (error) {
      setPromoError(error.response?.data?.detail || 'Invalid promo code');
      setPromoApplied(null);
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { setPromoError('Please enter a promo code'); return; }
    if (pricing.subtotal <= 0) { setPromoError('Get a quote first, then your code will be applied automatically'); return; }

    setApplyingPromo(true);
    setPromoError('');
    try {
      const response = await axios.post(`${API}/validate-promo`, { code: promoCode.trim(), subtotal: pricing.subtotal });
      setPromoApplied(response.data);
      toast.success(`Promo code applied! You saved $${response.data.discountAmount.toFixed(2)}`);
    } catch (error) {
      setPromoError(error.response?.data?.detail || 'Invalid promo code');
      setPromoApplied(null);
    } finally {
      setApplyingPromo(false);
    }
  };

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
    setFormData(prev => ({ ...prev, pickupAddresses: [...prev.pickupAddresses, ''] }));
  };

  const handleRemovePickup = (index) => {
    setFormData(prev => ({ ...prev, pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index) }));
  };

  const handlePickupAddressChange = (index, value) => {
    setFormData(prev => ({ ...prev, pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.serviceType) { toast.error('Please select a service type'); return; }
    if (!formData.pickupAddress || !formData.dropoffAddress) { toast.error('Please enter both pickup and drop-off addresses'); return; }
    if (!formData.date || !formData.time) { toast.error('Please select pickup date and time'); return; }
    if (!formData.name || !formData.email || !formData.phone) { toast.error('Please fill in all contact information'); return; }

    // Validate return flight number for airport shuttle return bookings
    const hasReturnTrip = !!(formData.returnDate && formData.returnTime);
    const isAirportShuttle = formData.serviceType?.toLowerCase().includes('airport') ||
                            formData.serviceType?.toLowerCase().includes('shuttle');
    if (isAirportShuttle && hasReturnTrip) {
      if (!formData.returnFlightNumber || !formData.returnFlightNumber.trim()) {
        toast.error('Flight number is mandatory for return trips. Bookings without flight numbers may face cancellation.');
        return;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) { toast.error('Please enter a valid email address'); return; }
    if (pricing.totalPrice === 0) { toast.error('Please wait for price calculation to complete'); return; }

    setIsProcessingPayment(true);

    try {
      // Map simplified fields to backend-expected fields for compatibility
      const bookingData = {
        ...formData,
        bookReturn: hasReturnTrip,
        // Map flightNumber to both fields the backend expects
        departureFlightNumber: formData.flightNumber,
        arrivalFlightNumber: formData.flightNumber,
        // Map returnFlightNumber to the field the backend expects
        returnDepartureFlightNumber: formData.returnFlightNumber,
        returnFlightNumber: formData.returnFlightNumber,
        pricing: pricing,
        status: 'pending',
        language: i18n.language,
        createdAt: new Date()
      };

      const bookingResponse = await axios.post(`${API}/bookings`, bookingData);
      const booking = bookingResponse.data;

      saveCustomerDetails();

      try {
        if (formData.paymentMethod === 'afterpay') {
          const afterpayResponse = await axios.post(`${API}/afterpay/create-checkout`, {
            booking_id: booking.id,
            redirect_confirm_url: `${window.location.origin}/payment-success?method=afterpay`,
            redirect_cancel_url: `${window.location.origin}/book-now`
          });
          if (afterpayResponse.data.redirect_url) {
            window.location.href = afterpayResponse.data.redirect_url;
          } else {
            setIsProcessingPayment(false);
            toast.error('Unable to redirect to Afterpay');
          }
        } else {
          const checkoutResponse = await axios.post(`${API}/payment/create-checkout`, {
            booking_id: booking.id,
            origin_url: window.location.origin
          });
          if (checkoutResponse.data?.url) {
            window.location.href = checkoutResponse.data.url;
          } else {
            setIsProcessingPayment(false);
            toast.success(`Booking #${booking.referenceNumber || booking.id?.slice(0, 8)} created! We'll email you a payment link shortly.`);
          }
        }
      } catch (paymentError) {
        setIsProcessingPayment(false);
        const ref = booking?.referenceNumber || booking?.id?.slice(0, 8);
        toast.success(`Booking #${ref} created! Payment redirect failed - we'll contact you with payment details.`);
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setIsProcessingPayment(false);
      const status = error.response?.status;
      const data = error.response?.data || {};
      const detail = data.detail ?? data.message ?? data.error;
      let msg = 'Failed to submit booking. Please try again.';
      if (!error.response) {
        msg = 'Cannot reach server. Check your connection or try again later.';
      } else if (Array.isArray(detail)) {
        const parts = detail.map((e) => {
          const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null;
          return field && e.msg ? `${field}: ${e.msg}` : (e.msg || e.loc?.join('.'));
        }).filter(Boolean);
        msg = parts.length ? parts.slice(0, 3).join('. ') : msg;
      } else if (typeof detail === 'string' && detail.trim()) {
        msg = detail;
      } else if (status === 404) {
        msg = 'Booking service unavailable. Please contact us.';
      } else if (status) {
        msg = `Booking failed (${status}). ${typeof detail === 'string' ? detail : 'Please try again.'}`;
      }
      toast.error(msg);
    }
  };

  if (siteConfig.maintenanceMode === true) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <SEO title="Under Maintenance - Book A Ride NZ" description="Online booking is temporarily under maintenance." canonical="/book-now" />
        <div className="max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 mb-8">
            <Wrench className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Under Maintenance</h1>
          <p className="text-xl text-gray-300 mb-8">
            Online booking is temporarily unavailable while we update our systems. Please call or email us to make your booking.
          </p>
          <div className="space-y-4 text-gray-400">
            <p><a href={`mailto:${siteConfig.email}`} className="text-gold hover:underline">{siteConfig.email}</a></p>
            {siteConfig.phone && <p><a href={`tel:${siteConfig.phone}`} className="text-gold hover:underline">{siteConfig.phone}</a></p>}
          </div>
          <Link to="/" className="inline-block mt-10 px-8 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {isProcessingPayment && <LoadingSpinner message="Processing your booking..." />}
      <SEO
        title="Book Your Airport Shuttle Now - Instant Quote & Online Booking"
        description="Book your airport shuttle online with instant live pricing. Auckland, Hamilton, Whangarei airport transfers. Easy online booking, secure payment, live price calculator. Book your shuttle service now!"
        keywords="book airport shuttle, book airport transfer, online shuttle booking, airport shuttle booking online, instant quote shuttle, book shuttle Auckland, airport transfer booking, shuttle service booking"
        canonical="/book-now"
      />
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
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
                INSTANT ONLINE BOOKING
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Book Your <span className="text-gold">Ride</span>
            </h1>
            <p className="text-xl text-white/80">
              Get instant pricing with our live calculator - No hidden fees
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
                {/* Main Form */}
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
                      <div className="space-y-2 mb-6 relative">
                        <Label htmlFor="pickupAddress" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Pickup Location 1 *</span>
                        </Label>
                        <Input
                          id="pickupAddress"
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, pickupAddress: val }));
                            fetchAddressSuggestions(val, setPickupSuggestions, setShowPickupSuggestions);
                          }}
                          onBlur={() => setTimeout(() => setShowPickupSuggestions(false), 200)}
                          placeholder="Start typing your address..."
                          required
                          autoComplete="off"
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                        {showPickupSuggestions && pickupSuggestions.length > 0 && (
                          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {pickupSuggestions.map((s, i) => (
                              <li key={i} className="px-4 py-2.5 hover:bg-gold/10 cursor-pointer text-sm border-b last:border-b-0"
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  setFormData(prev => ({ ...prev, pickupAddress: s.description }));
                                  setShowPickupSuggestions(false);
                                }}>
                                {s.description}
                              </li>
                            ))}
                          </ul>
                        )}
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
                              placeholder="Additional pickup address..."
                              className="flex-1"
                            />
                            <Button type="button" variant="outline" size="sm" onClick={() => handleRemovePickup(index)} className="text-red-500 hover:text-red-700">Remove</Button>
                          </div>
                        </div>
                      ))}

                      {formData.pickupAddresses.length < 3 && (
                        <Button type="button" variant="outline" onClick={handleAddPickup} className="mb-6 text-sm">
                          + Add another pickup location
                        </Button>
                      )}

                      {/* Drop-off Address */}
                      <div className="space-y-2 mb-6 relative">
                        <Label htmlFor="dropoffAddress" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Drop-off Location *</span>
                        </Label>
                        {/* Quick address buttons */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {DROPOFF_QUICK_ADDRESSES.map((qa, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, dropoffAddress: qa.address }))}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                formData.dropoffAddress === qa.address
                                  ? 'bg-gold text-black border-gold'
                                  : 'bg-white text-gray-600 border-gray-300 hover:border-gold hover:text-gold'
                              }`}
                            >
                              {qa.label}
                            </button>
                          ))}
                        </div>
                        <Input
                          id="dropoffAddress"
                          name="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({ ...prev, dropoffAddress: val }));
                            fetchAddressSuggestions(val, setDropoffSuggestions, setShowDropoffSuggestions);
                          }}
                          onBlur={() => setTimeout(() => setShowDropoffSuggestions(false), 200)}
                          placeholder="Start typing destination..."
                          required
                          autoComplete="off"
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                        {showDropoffSuggestions && dropoffSuggestions.length > 0 && (
                          <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                            {dropoffSuggestions.map((s, i) => (
                              <li key={i} className="px-4 py-2.5 hover:bg-gold/10 cursor-pointer text-sm border-b last:border-b-0"
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  setFormData(prev => ({ ...prev, dropoffAddress: s.description }));
                                  setShowDropoffSuggestions(false);
                                }}>
                                {s.description}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Date & Time */}
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
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
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

                      {/* Flight Number - Single field */}
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Flight Information</h3>
                        <p className="text-sm text-gray-600 mb-2">Enter your flight number so our driver knows which flight to meet.</p>
                        <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mb-4">
                          <strong>Important:</strong> Flight numbers are required for airport pickups so our driver can meet you on time.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="flightNumber" className="flex items-center space-x-2">
                            <Plane className="w-4 h-4 text-gold" />
                            <span>Flight Number</span>
                          </Label>
                          <Input
                            id="flightNumber"
                            name="flightNumber"
                            value={formData.flightNumber}
                            onChange={handleChange}
                            placeholder="e.g., NZ123"
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                          />
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

                      {/* VIP Parking Service */}
                      <div className="mb-6 bg-gold/5 p-4 rounded-lg border border-gold/20">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="vipAirportPickup"
                            checked={formData.vipAirportPickup}
                            onChange={(e) => setFormData(prev => ({ ...prev, vipAirportPickup: e.target.checked }))}
                            className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="vipAirportPickup" className="cursor-pointer font-semibold text-gray-900">
                              VIP Parking Service - $15
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">Driver meets you outside door eleven</p>
                          </div>
                        </div>
                      </div>

                      {/* Oversized Luggage Service */}
                      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="oversizedLuggage"
                            checked={formData.oversizedLuggage}
                            onChange={(e) => setFormData(prev => ({ ...prev, oversizedLuggage: e.target.checked }))}
                            className="w-4 h-4 text-gold border-gray-300 rounded focus:ring-gold mt-1"
                          />
                          <div className="flex-1">
                            <Label htmlFor="oversizedLuggage" className="cursor-pointer font-semibold text-gray-900">
                              Oversized Luggage Service - $25
                            </Label>
                            <p className="text-xs text-gray-600 mt-1">For skis, snowboards, surfboards, golf clubs, bikes, or extra-large suitcases</p>
                          </div>
                        </div>
                      </div>

                      {/* Return Journey - Simplified */}
                      <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Return Journey <span className="text-sm font-normal text-gray-500">(Optional - leave blank for one-way)</span></h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div className="space-y-2">
                            <Label className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gold" />
                              <span>Return Date</span>
                            </Label>
                            <CustomDatePicker
                              selected={returnDatePicker}
                              onChange={(date) => {
                                setReturnDatePicker(date);
                                if (date) {
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  setFormData(prev => ({ ...prev, returnDate: `${year}-${month}-${day}` }));
                                }
                              }}
                              placeholder="Select return date"
                              minDate={pickupDate || new Date()}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gold" />
                              <span>Return Time</span>
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
                            />
                          </div>
                        </div>

                        {/* Single return flight number */}
                        <div className="space-y-2">
                          <Label htmlFor="returnFlightNumber" className="flex items-center space-x-2">
                            <Plane className="w-4 h-4 text-gold" />
                            <span>Return Flight Number <span className="text-sm font-normal text-gray-500">(Required if booking return)</span></span>
                          </Label>
                          <Input
                            id="returnFlightNumber"
                            name="returnFlightNumber"
                            value={formData.returnFlightNumber}
                            onChange={handleChange}
                            placeholder="e.g., NZ456"
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                          />
                        </div>

                        <p className="text-xs text-gray-600 mt-4">
                          Return trip will be from <strong>{formData.dropoffAddress || 'drop-off location'}</strong> back to <strong>{formData.pickupAddress || 'pickup location'}</strong>
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contact Information */}
                  <Card className="border-2 border-gray-200 shadow-lg">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                        {isReturningCustomer && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-green-600 font-medium">Welcome back!</span>
                            <button type="button" onClick={clearSavedCustomer} className="text-xs text-gray-400 hover:text-red-500 underline">Not you?</button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gold" />
                            <span>Full Name *</span>
                          </Label>
                          <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" required className="transition-all duration-200 focus:ring-2 focus:ring-gold" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="email" className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gold" />
                              <span>Email *</span>
                            </Label>
                            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" required className="transition-all duration-200 focus:ring-2 focus:ring-gold" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone" className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gold" />
                              <span>Phone *</span>
                            </Label>
                            <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="021 123 4567" required className="transition-all duration-200 focus:ring-2 focus:ring-gold" />
                          </div>
                        </div>

                        {/* Notification Preference */}
                        <div className="space-y-2">
                          <Label className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gold" />
                            <span>Confirmation Preference</span>
                          </Label>
                          <div className="flex gap-4">
                            {[
                              { value: 'both', label: 'Email + SMS' },
                              { value: 'email', label: 'Email only' },
                              { value: 'sms', label: 'SMS only' }
                            ].map(opt => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="notificationPreference"
                                  value={opt.value}
                                  checked={formData.notificationPreference === opt.value}
                                  onChange={handleChange}
                                  className="text-gold focus:ring-gold"
                                />
                                <span className="text-sm text-gray-700">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Promo Code */}
                        <div className="space-y-2">
                          <Label>Promo Code</Label>
                          <div className="flex gap-2">
                            <Input
                              value={promoCode}
                              onChange={(e) => setPromoCode(e.target.value)}
                              placeholder="Enter promo code"
                              disabled={!!promoApplied}
                              className="flex-1"
                            />
                            {promoApplied ? (
                              <Button type="button" variant="outline" onClick={handleRemovePromo} className="text-red-500">Remove</Button>
                            ) : (
                              <Button type="button" variant="outline" onClick={handleApplyPromo} disabled={applyingPromo}>
                                {applyingPromo ? 'Applying...' : 'Apply'}
                              </Button>
                            )}
                          </div>
                          {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                          {promoApplied && <p className="text-xs text-green-600 font-medium">You saved ${promoApplied.discountAmount.toFixed(2)} with {promoApplied.code}!</p>}
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                          <Label>Payment Method</Label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="paymentMethod" value="card" checked={formData.paymentMethod === 'card'} onChange={handleChange} className="text-gold focus:ring-gold" />
                              <span className="text-sm text-gray-700">Credit/Debit Card</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="paymentMethod" value="afterpay" checked={formData.paymentMethod === 'afterpay'} onChange={handleChange} className="text-gold focus:ring-gold" />
                              <span className="text-sm text-gray-700">Afterpay</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">Special Requests / Notes</Label>
                          <Textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} placeholder="Any special requirements or notes..." rows={3} className="transition-all duration-200 focus:ring-2 focus:ring-gold" />
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
                                You saved ${promoApplied.discountAmount.toFixed(2)} with {promoApplied.code}!
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
                            <div className="flex justify-between border-t pt-2 font-semibold">
                              <span>Total</span>
                              <span className="text-gold">${finalTotal.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-gray-600">
                              {(formData.returnDate && formData.returnTime) ? `${pricing.distance / 2} km each way` : `${pricing.distance} km`} - {formData.passengers} passenger{parseInt(formData.passengers) > 1 ? 's' : ''}
                              {(formData.returnDate && formData.returnTime) && ' - Round trip (both ways)'}
                            </p>
                          </div>

                          <PriceComparison bookaridePrice={finalTotal} distance={pricing.distance} />

                          {/* Route summary */}
                          {formData.pickupAddress && formData.dropoffAddress && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2" data-testid="route-map-container">
                              <p className="text-sm font-medium text-gray-700">Your route</p>
                              <p className="text-sm text-gray-600">Pickup: {formData.pickupAddress}</p>
                              {formData.pickupAddresses?.filter(Boolean).map((addr, i) => (
                                <p key={i} className="text-sm text-gray-600">+ Stop: {addr}</p>
                              ))}
                              <p className="text-sm text-gray-600">Drop-off: {formData.dropoffAddress}</p>
                            </div>
                          )}

                          <div className="mt-4">
                            <SocialProofCounter variant="urgency" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-gray-500 mb-4">Enter addresses to see price estimate</p>
                        </div>
                      )}

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
                        <p className="text-sm text-gray-600 mb-3">Pay securely with credit/debit card via Stripe</p>
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
