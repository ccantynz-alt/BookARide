import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  CreditCard, 
  Check, 
  ChevronRight,
  Plane,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingDown,
  Shield,
  Star,
  Phone,
  Mail
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Pricing tiers - $200 minimum, price decreases as more passengers book
const PRICING_TIERS = {
  1: 100, 2: 100,  // $100 each = $100-200 total
  3: 70,           // $70 each = $210 total
  4: 55,           // $55 each = $220 total
  5: 45,           // $45 each = $225 total
  6: 40,           // $40 each = $240 total
  7: 35,           // $35 each = $245 total
  8: 32,           // $32 each = $256 total
  9: 30,           // $30 each = $270 total
  10: 28,          // $28 each = $280 total
  11: 25,          // $25 each = $275+ total
};

const getPricePerPerson = (totalPassengers) => {
  if (totalPassengers >= 11) return 25;
  return PRICING_TIERS[totalPassengers] || 100;
};

// Shuttle departure times (6am - 10pm, every 2 hours)
const DEPARTURE_TIMES = [
  '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'
];

const formatTime = (time24) => {
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const SharedShuttle = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Form state
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  
  // UI state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shuttleData, setShuttleData] = useState({});
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Fetch shuttle availability when date/time changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      fetchShuttleData();
    }
  }, [selectedDate, selectedTime]);
  
  const fetchShuttleData = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.get(`${API}/shuttle/availability`, {
        params: { date: dateStr, time: selectedTime }
      });
      setShuttleData(response.data);
    } catch (error) {
      console.error('Error fetching shuttle data:', error);
    }
  };
  
  // Calculate pricing based on current bookings + new passengers
  const currentBookings = shuttleData.currentPassengers || 0;
  const totalAfterBooking = currentBookings + passengers;
  const pricePerPerson = getPricePerPerson(totalAfterBooking);
  const totalPrice = pricePerPerson * passengers;
  
  // Price comparison (what they'd pay if first vs what they pay now)
  const maxPrice = getPricePerPerson(passengers); // If they were alone
  const savings = maxPrice > pricePerPerson ? (maxPrice - pricePerPerson) * passengers : 0;
  
  // Handle address autocomplete
  const handleAddressChange = async (value) => {
    setPickupAddress(value);
    if (value.length > 3) {
      try {
        const response = await axios.get(`${API}/places/autocomplete`, {
          params: { input: value, types: 'address', region: 'nz' }
        });
        setAddressSuggestions(response.data.predictions || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Autocomplete error:', error);
      }
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  const selectAddress = (address) => {
    setPickupAddress(address);
    setShowSuggestions(false);
  };
  
  // Check if booking is for tomorrow or later
  const isSameDayBooking = useMemo(() => {
    const today = startOfDay(new Date());
    const bookingDate = startOfDay(selectedDate);
    return !isBefore(today, bookingDate);
  }, [selectedDate]);
  
  const handleSubmit = async () => {
    // Validation
    if (!selectedDate || !selectedTime) {
      toast.error('Please select a date and departure time');
      return;
    }
    if (!pickupAddress) {
      toast.error('Please enter your pickup address');
      return;
    }
    if (!name || !email || !phone) {
      toast.error('Please fill in all contact details');
      return;
    }
    
    setLoading(true);
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const response = await axios.post(`${API}/shuttle/book`, {
        date: dateStr,
        departureTime: selectedTime,
        pickupAddress,
        passengers,
        name,
        email,
        phone,
        notes,
        flightNumber,
        estimatedPrice: pricePerPerson,
        needsApproval: isSameDayBooking
      });
      
      if (response.data.checkoutUrl) {
        // Redirect to Stripe for card authorization
        window.location.href = response.data.checkoutUrl;
      } else {
        toast.success('Booking submitted! We\'ll confirm your pickup shortly.');
        navigate('/payment-success?type=shuttle');
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Shared Airport Shuttle | Auckland CBD to Airport | Book A Ride NZ</title>
        <meta name="description" content="Save money with our shared shuttle service from Auckland CBD to the International Airport. Runs every 2 hours, the more passengers the cheaper it gets!" />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-20">
        {/* Hero Section */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/shuttle-hero.jpg')] bg-cover bg-center opacity-20" />
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full mb-6">
                <Bus className="w-5 h-5" />
                <span className="font-medium">Shared Shuttle Service</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Auckland CBD to Airport
              </h1>
              <p className="text-xl text-gray-300 mb-6">
                Share the ride, share the savings! The more passengers, the cheaper it gets.
              </p>
              
              {/* Dynamic Pricing Display */}
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-yellow-500/30">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                  Dynamic Pricing - Save More Together!
                </h3>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 text-sm">
                  {Object.entries(PRICING_TIERS).slice(0, 6).map(([pax, price]) => (
                    <div key={pax} className={`p-2 rounded-lg ${
                      totalAfterBooking >= parseInt(pax) ? 'bg-green-500/20 border border-green-500' : 'bg-gray-700/50'
                    }`}>
                      <div className="text-gray-400">{pax} pax</div>
                      <div className="text-white font-bold">${price}</div>
                    </div>
                  ))}
                </div>
                <p className="text-gray-400 text-sm mt-4">
                  * Price per person decreases as more passengers book the same departure
                </p>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Booking Form */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
                {/* Progress Steps */}
                <div className="flex border-b border-gray-700">
                  {[
                    { num: 1, label: 'Schedule', icon: Calendar },
                    { num: 2, label: 'Details', icon: MapPin },
                    { num: 3, label: 'Contact', icon: Users },
                    { num: 4, label: 'Confirm', icon: Check }
                  ].map(({ num, label, icon: Icon }) => (
                    <button
                      key={num}
                      onClick={() => step > num && setStep(num)}
                      className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 transition-all ${
                        step === num 
                          ? 'bg-yellow-500/20 text-yellow-400 border-b-2 border-yellow-500' 
                          : step > num 
                            ? 'text-green-400 cursor-pointer hover:bg-gray-700/50' 
                            : 'text-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>
                
                <div className="p-6 md:p-8">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Schedule Selection */}
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h2 className="text-2xl font-bold text-white mb-6">
                          Choose Your Departure
                        </h2>
                        
                        {/* Date Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Calendar className="w-4 h-4 inline mr-2" />
                            Departure Date
                          </label>
                          <DatePicker
                            selected={selectedDate}
                            onChange={setSelectedDate}
                            minDate={new Date()}
                            dateFormat="EEEE, MMMM d, yyyy"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                          {isSameDayBooking && (
                            <p className="mt-2 text-amber-400 text-sm flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              Same-day bookings require admin approval
                            </p>
                          )}
                        </div>
                        
                        {/* Time Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Departure Time
                          </label>
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                            {DEPARTURE_TIMES.map((time) => {
                              const timeData = shuttleData.departures?.[time] || { passengers: 0, available: true };
                              const spotsLeft = 11 - timeData.passengers;
                              
                              return (
                                <button
                                  key={time}
                                  onClick={() => setSelectedTime(time)}
                                  disabled={!timeData.available || spotsLeft < passengers}
                                  className={`p-3 rounded-lg border transition-all ${
                                    selectedTime === time
                                      ? 'bg-yellow-500 border-yellow-500 text-black'
                                      : timeData.available && spotsLeft >= passengers
                                        ? 'bg-gray-700 border-gray-600 text-white hover:border-yellow-500'
                                        : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="font-bold">{formatTime(time)}</div>
                                  {timeData.passengers > 0 && (
                                    <div className="text-xs mt-1 opacity-75">
                                      {timeData.passengers} booked
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Passengers */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Users className="w-4 h-4 inline mr-2" />
                            Number of Passengers
                          </label>
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => setPassengers(Math.max(1, passengers - 1))}
                              className="w-12 h-12 rounded-lg bg-gray-700 text-white text-xl font-bold hover:bg-gray-600"
                            >
                              -
                            </button>
                            <span className="text-2xl font-bold text-white w-12 text-center">
                              {passengers}
                            </span>
                            <button
                              onClick={() => setPassengers(Math.min(11, passengers + 1))}
                              className="w-12 h-12 rounded-lg bg-gray-700 text-white text-xl font-bold hover:bg-gray-600"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        {/* Price Preview */}
                        {selectedTime && (
                          <div className="bg-gray-700/50 rounded-xl p-4 border border-yellow-500/30">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-gray-400 text-sm">Your price per person</div>
                                <div className="text-3xl font-bold text-yellow-400">
                                  ${pricePerPerson}
                                </div>
                                {savings > 0 && (
                                  <div className="text-green-400 text-sm">
                                    Save ${savings} with group discount!
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-gray-400 text-sm">Total for {passengers} pax</div>
                                <div className="text-2xl font-bold text-white">
                                  ${totalPrice}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                              💳 Your card will be authorized but NOT charged until arrival at the airport
                            </p>
                          </div>
                        )}
                        
                        <button
                          onClick={() => setStep(2)}
                          disabled={!selectedDate || !selectedTime}
                          className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                        >
                          Continue
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}
                    
                    {/* Step 2: Pickup Details */}
                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h2 className="text-2xl font-bold text-white mb-6">
                          Pickup Location
                        </h2>
                        
                        {/* Pickup Address */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            CBD Pickup Address
                          </label>
                          <input
                            type="text"
                            value={pickupAddress}
                            onChange={(e) => handleAddressChange(e.target.value)}
                            onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                            placeholder="Enter hotel or address in Auckland CBD"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                          
                          {/* Address Suggestions */}
                          {showSuggestions && addressSuggestions.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                              {addressSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => selectAddress(suggestion.description)}
                                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 border-b border-gray-700 last:border-0"
                                >
                                  {suggestion.description}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Flight Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Plane className="w-4 h-4 inline mr-2" />
                            Flight Number (Optional)
                          </label>
                          <input
                            type="text"
                            value={flightNumber}
                            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                            placeholder="e.g. NZ123"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                          <p className="text-gray-500 text-sm mt-1">
                            We'll track your flight to ensure you don't miss your shuttle
                          </p>
                        </div>
                        
                        {/* Notes */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Special Requirements (Optional)
                          </label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Large luggage, wheelchair access, etc."
                            rows={3}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setStep(3)}
                            disabled={!pickupAddress}
                            className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            Continue
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Step 3: Contact Details */}
                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h2 className="text-2xl font-bold text-white mb-6">
                          Your Contact Details
                        </h2>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="John Smith"
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <Phone className="w-4 h-4 inline mr-2" />
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="021 123 4567"
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={() => setStep(4)}
                            disabled={!name || !email || !phone}
                            className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            Review Booking
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Step 4: Confirmation */}
                    {step === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <h2 className="text-2xl font-bold text-white mb-6">
                          Confirm Your Booking
                        </h2>
                        
                        {/* Booking Summary */}
                        <div className="bg-gray-700/50 rounded-xl p-6 space-y-4">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date</span>
                            <span className="text-white font-medium">
                              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Departure Time</span>
                            <span className="text-white font-medium">{formatTime(selectedTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pickup</span>
                            <span className="text-white font-medium text-right max-w-[60%]">{pickupAddress}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Destination</span>
                            <span className="text-white font-medium">Auckland International Airport</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Passengers</span>
                            <span className="text-white font-medium">{passengers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Contact</span>
                            <span className="text-white font-medium">{name}</span>
                          </div>
                          
                          <hr className="border-gray-600" />
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Price per person</span>
                            <span className="text-yellow-400 font-bold text-xl">${pricePerPerson}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">Total</span>
                            <span className="text-yellow-400 font-bold text-2xl">${totalPrice}</span>
                          </div>
                        </div>
                        
                        {/* Payment Notice */}
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                          <div className="flex gap-3">
                            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />
                            <div>
                              <h4 className="text-white font-medium mb-1">Secure Payment Hold</h4>
                              <p className="text-gray-400 text-sm">
                                Your card will be <strong>authorized but NOT charged</strong> until we reach the airport. 
                                This ensures we know the final passenger count and you get the best possible price!
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Same-day notice */}
                        {isSameDayBooking && (
                          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                            <div className="flex gap-3">
                              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                              <div>
                                <h4 className="text-white font-medium mb-1">Same-Day Booking</h4>
                                <p className="text-gray-400 text-sm">
                                  This booking requires approval as it's for today. We'll contact you shortly to confirm availability.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-4">
                          <button
                            onClick={() => setStep(3)}
                            className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-all"
                          >
                            Back
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-600 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                          >
                            {loading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="w-5 h-5" />
                                Authorize Card & Book
                              </>
                            )}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <Shield className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-white font-medium text-sm">Pay on Arrival</div>
                  <div className="text-gray-500 text-xs">Card held, not charged</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-white font-medium text-sm">5-Star Service</div>
                  <div className="text-gray-500 text-xs">Professional drivers</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <TrendingDown className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-medium text-sm">Dynamic Pricing</div>
                  <div className="text-gray-500 text-xs">More riders = lower price</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-16 bg-gray-800/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              How It Works
            </h2>
            <div className="grid md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Calendar, title: 'Choose Time', desc: 'Select your preferred departure time' },
                { icon: MapPin, title: 'Enter Pickup', desc: 'Any CBD address or hotel' },
                { icon: CreditCard, title: 'Authorize Card', desc: 'Card held but not charged yet' },
                { icon: Plane, title: 'Pay on Arrival', desc: 'Final price based on total passengers' }
              ].map((item, idx) => (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default SharedShuttle;
