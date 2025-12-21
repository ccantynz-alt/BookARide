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
  ChevronDown,
  Plane,
  DollarSign,
  Calendar,
  AlertCircle,
  TrendingDown,
  Shield,
  Star,
  Phone,
  Mail,
  Zap,
  BadgePercent,
  ArrowRight,
  Sparkles,
  ThumbsUp,
  MapPinned,
  Timer
} from 'lucide-react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Shared Shuttle Pricing Model - City to Airport
// Minimum: $100 (covers costs for 1-2 passengers)
// Maximum: $200 (full van with 9 passengers)
// More passengers = cheaper per person, but total increases toward $200
const SHARED_SHUTTLE_PRICING = {
  1: { total: 100, perPerson: 100 },
  2: { total: 100, perPerson: 50 },
  3: { total: 115, perPerson: 38 },
  4: { total: 130, perPerson: 32 },
  5: { total: 145, perPerson: 29 },
  6: { total: 160, perPerson: 27 },
  7: { total: 175, perPerson: 25 },
  8: { total: 188, perPerson: 24 },
  9: { total: 200, perPerson: 22 },
};

const getSharedShuttlePricing = (passengers) => {
  if (passengers >= 9) return { total: 200, perPerson: 22 };
  return SHARED_SHUTTLE_PRICING[passengers] || { total: 100, perPerson: 100 };
};

// Legacy per-person pricing (kept for backward compatibility)
const PRICING_TIERS = {
  1: 100, 2: 50,
  3: 38,
  4: 32,
  5: 29,
  6: 27,
  7: 25,
  8: 24,
  9: 22,
};

const getPricePerPerson = (totalPassengers) => {
  if (totalPassengers >= 9) return 22;
  return PRICING_TIERS[totalPassengers] || 100;
};

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
  
  const [selectedDate, setSelectedDate] = useState(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [shuttleData, setShuttleData] = useState({});
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  
  useEffect(() => {
    if (selectedDate) {
      fetchShuttleData();
    }
  }, [selectedDate]);
  
  const fetchShuttleData = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await axios.get(`${API}/shuttle/availability`, {
        params: { date: dateStr }
      });
      setShuttleData(response.data);
    } catch (error) {
      console.error('Error fetching shuttle data:', error);
    }
  };
  
  const currentBookings = shuttleData.departures?.[selectedTime]?.passengers || 0;
  const totalAfterBooking = currentBookings + passengers;
  
  // Use new pricing model - total price based on YOUR passengers only
  const pricing = getSharedShuttlePricing(passengers);
  const totalPrice = pricing.total;
  const pricePerPerson = pricing.perPerson;
  
  // Calculate savings compared to private transfer ($200)
  const privateTransferPrice = 200;
  const savings = privateTransferPrice - totalPrice;
  const savingsPercent = Math.round((savings / privateTransferPrice) * 100);
  
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
  
  const isSameDayBooking = useMemo(() => {
    const today = startOfDay(new Date());
    const bookingDate = startOfDay(selectedDate);
    return !isBefore(today, bookingDate);
  }, [selectedDate]);
  
  const handleSubmit = async () => {
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

  const scrollToBooking = () => {
    setShowBookingForm(true);
    setTimeout(() => {
      document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  return (
    <>
      <Helmet>
        <title>From Just $22/Person! Shared Airport Shuttle | Auckland CBD to Airport</title>
        <meta name="description" content="Auckland's CHEAPEST airport transfer! Pay as little as $22 per person with our shared shuttle. More passengers = bigger savings. Minimum $100, Maximum $200 for up to 9 passengers. Book now!" />
      </Helmet>
      
      <Header />
      
      <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 pt-16">
        
        {/* HERO - Sales Focused */}
        <section className="relative py-12 md:py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-transparent to-green-500/10" />
          
          {/* Floating savings badges */}
          <div className="absolute top-20 left-10 hidden lg:block animate-bounce">
            <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              SAVE 75%
            </div>
          </div>
          <div className="absolute top-40 right-16 hidden lg:block animate-pulse">
            <div className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              FROM $22!
            </div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Urgency Banner */}
              <div className="inline-flex items-center gap-2 bg-red-500/90 text-white px-6 py-2 rounded-full mb-6 animate-pulse">
                <Zap className="w-5 h-5" />
                <span className="font-bold">LIMITED SEATS - Book Now & Lock In Your Price!</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
                Auckland CBD to Airport
                <span className="block text-yellow-400 mt-2">
                  From Just <span className="text-5xl md:text-7xl lg:text-8xl">$22</span>/Person!
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
                The <span className="text-green-400 font-bold">MORE people</span> that book, 
                the <span className="text-green-400 font-bold">CHEAPER</span> it gets for everyone!
              </p>
              
              {/* Price Comparison */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-10">
                <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-4 text-center line-through opacity-75">
                  <div className="text-red-400 text-sm">Taxi/Uber from CBD</div>
                  <div className="text-red-300 text-3xl font-bold">$80-120</div>
                </div>
                <div className="text-yellow-400 text-4xl font-bold hidden md:block">→</div>
                <div className="text-yellow-400 text-2xl font-bold md:hidden">↓</div>
                <div className="bg-green-900/50 border-2 border-green-500 rounded-xl p-4 text-center transform scale-110 shadow-xl shadow-green-500/20">
                  <div className="text-green-400 text-sm font-semibold">Our Shared Shuttle</div>
                  <div className="text-green-300 text-4xl font-black">$22-100</div>
                  <div className="text-green-500 text-xs mt-1">Per Person!</div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={scrollToBooking}
                  className="px-10 py-5 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black text-xl font-black rounded-full shadow-xl shadow-yellow-500/30 flex items-center justify-center gap-3"
                >
                  <Bus className="w-6 h-6" />
                  Book Your Seat Now
                  <ArrowRight className="w-6 h-6" />
                </motion.button>
                <a 
                  href="#how-it-works"
                  className="px-8 py-5 bg-white/10 hover:bg-white/20 text-white text-lg font-semibold rounded-full border border-white/30 flex items-center justify-center gap-2"
                >
                  How It Works
                  <ChevronDown className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* DYNAMIC PRICING SHOWCASE */}
        <section className="py-16 bg-gradient-to-b from-gray-800 to-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Watch Your Price <span className="text-green-400">DROP</span> As More People Book!
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                Our revolutionary group pricing means everyone saves. The fuller the shuttle, the cheaper your fare!
              </p>
            </div>
            
            {/* Animated Pricing Slider */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-700">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { pax: '1-2', price: 100, color: 'red', savings: 0 },
                    { pax: '3', price: 38, color: 'orange', savings: 62 },
                    { pax: '4', price: 32, color: 'yellow', savings: 68 },
                    { pax: '5-6', price: 28, color: 'lime', savings: 72 },
                    { pax: '7-8', price: 24, color: 'green', savings: 76 },
                    { pax: '9+', price: 22, color: 'emerald', savings: 78 },
                  ].map((tier, idx) => (
                    <motion.div
                      key={tier.pax}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`relative p-4 rounded-2xl text-center ${
                        tier.color === 'emerald' 
                          ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 ring-4 ring-emerald-400 transform scale-105' 
                          : 'bg-gray-700/50'
                      }`}
                    >
                      {tier.savings >= 60 && (
                        <div className="absolute -top-3 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          -{tier.savings}%
                        </div>
                      )}
                      <div className={`text-sm mb-1 ${tier.color === 'emerald' ? 'text-emerald-200' : 'text-gray-400'}`}>
                        {tier.pax} passengers
                      </div>
                      <div className={`text-3xl font-black ${
                        tier.color === 'emerald' ? 'text-white' : 
                        tier.color === 'green' ? 'text-green-400' :
                        tier.color === 'lime' ? 'text-lime-400' :
                        tier.color === 'yellow' ? 'text-yellow-400' :
                        tier.color === 'orange' ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        ${tier.price}
                      </div>
                      <div className={`text-xs ${tier.color === 'emerald' ? 'text-emerald-200' : 'text-gray-500'}`}>
                        per person
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-8 text-center">
                  <p className="text-gray-400 mb-4">
                    🎯 <span className="text-white font-semibold">Real Example:</span> If 8 people book the 10:00 AM shuttle, 
                    everyone pays just <span className="text-green-400 font-bold">$32 each</span> instead of $100!
                  </p>
                  <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm">
                    <Sparkles className="w-4 h-4" />
                    That's a savings of $68 per person - 68% OFF!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW PAYMENT WORKS - Clear Explanation */}
        <section className="py-16 bg-gradient-to-b from-gray-900 via-blue-900/20 to-gray-900">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  How Payment Works
                </h2>
                <p className="text-xl text-blue-300">
                  Your card is <span className="font-bold underline">HELD</span>, not charged — until we arrive at the airport!
                </p>
              </div>
              
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-3xl p-8 border border-blue-500/30">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-blue-500/30">
                      <CreditCard className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="bg-blue-900/30 text-blue-400 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">WHEN YOU BOOK</div>
                    <h3 className="text-xl font-bold text-white mb-2">$100 Hold</h3>
                    <p className="text-gray-400 text-sm">
                      We place a <span className="text-blue-300 font-semibold">temporary hold</span> of $100 on your card. 
                      <span className="text-yellow-400"> This is NOT a charge!</span>
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center">
                    <div className="flex flex-col items-center">
                      <div className="text-4xl text-yellow-400">→</div>
                      <div className="text-gray-500 text-xs mt-2">More people book...</div>
                      <div className="text-green-400 text-xs">Price drops!</div>
                    </div>
                  </div>
                  <div className="md:hidden flex justify-center my-4">
                    <div className="text-3xl text-yellow-400">↓</div>
                  </div>
                  
                  {/* Step 2 */}
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-green-500/30">
                      <Plane className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="bg-green-900/30 text-green-400 text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">AT THE AIRPORT</div>
                    <h3 className="text-xl font-bold text-white mb-2">Pay Final Price</h3>
                    <p className="text-gray-400 text-sm">
                      When we arrive, we count total passengers and 
                      <span className="text-green-300 font-semibold"> charge everyone the LOWER price!</span>
                    </p>
                  </div>
                </div>
                
                {/* Example Scenario */}
                <div className="mt-8 p-6 bg-gradient-to-r from-yellow-900/30 to-green-900/30 rounded-2xl border border-yellow-500/30">
                  <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Real-World Example
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-300 mb-3">
                        <span className="text-white font-semibold">Sarah</span> books the 10:00 AM shuttle first:
                      </p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2 text-gray-400">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          $100 hold placed on her card
                        </li>
                        <li className="flex items-center gap-2 text-gray-400">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          5 more people book the same shuttle
                        </li>
                        <li className="flex items-center gap-2 text-gray-400">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Now 6 passengers total = $40/person
                        </li>
                      </ul>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-4">
                      <p className="text-gray-400 text-sm mb-2">When shuttle reaches airport:</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-gray-500 text-xs line-through">Hold: $100</div>
                          <div className="text-green-400 font-bold text-2xl">Charged: $40</div>
                        </div>
                        <div className="bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm font-bold">
                          SAVED $60!
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs mt-3">
                        * The $100 hold is released and only $40 is actually charged
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* PRICING TABLE */}
        <section className="py-16 bg-gradient-to-b from-gray-900 to-black">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Group Pricing - The More You Bring, The More You Save!
              </h2>
              <p className="text-xl text-gray-400">
                City to Airport • Fixed Prices • No Hidden Fees
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-800/80 rounded-3xl overflow-hidden border border-yellow-500/30">
                <div className="grid grid-cols-3 bg-yellow-500 text-black font-bold text-center">
                  <div className="p-4">Passengers</div>
                  <div className="p-4">Total Price</div>
                  <div className="p-4">Per Person</div>
                </div>
                {[
                  { passengers: '1-2', total: '$100', perPerson: '$50-100', highlight: false, tag: 'Minimum' },
                  { passengers: '3', total: '$115', perPerson: '$38', highlight: false },
                  { passengers: '4', total: '$130', perPerson: '$32', highlight: false },
                  { passengers: '5', total: '$145', perPerson: '$29', highlight: true, tag: 'Popular!' },
                  { passengers: '6', total: '$160', perPerson: '$27', highlight: false },
                  { passengers: '7', total: '$175', perPerson: '$25', highlight: false },
                  { passengers: '8', total: '$188', perPerson: '$24', highlight: false },
                  { passengers: '9', total: '$200', perPerson: '$22', highlight: true, tag: 'Best Value!' },
                ].map((row, idx) => (
                  <div 
                    key={idx} 
                    className={`grid grid-cols-3 text-center border-b border-gray-700 ${
                      row.highlight ? 'bg-yellow-500/10' : ''
                    }`}
                  >
                    <div className="p-4 text-white font-semibold flex items-center justify-center gap-2">
                      <Users className="w-4 h-4 text-yellow-500" />
                      {row.passengers}
                      {row.tag && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full">{row.tag}</span>}
                    </div>
                    <div className="p-4 text-2xl font-bold text-yellow-400">{row.total}</div>
                    <div className="p-4 text-green-400 font-semibold">{row.perPerson}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center space-y-2">
                <p className="text-gray-400">
                  <Shield className="w-4 h-4 inline mr-2 text-green-500" />
                  Prices include GST • No surge pricing • No booking fees
                </p>
                <p className="text-sm text-gray-500">
                  Maximum 9 passengers per shuttle • Departs from Auckland CBD to Airport
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-16 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Super Simple. Super Cheap.
              </h2>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                { 
                  icon: Calendar, 
                  title: 'Pick Your Time', 
                  desc: 'Shuttles depart every 2 hours from 6am-10pm',
                  color: 'yellow'
                },
                { 
                  icon: MapPinned, 
                  title: 'Enter Your Pickup', 
                  desc: 'Any Auckland CBD address - hotels, apartments, anywhere!',
                  color: 'blue'
                },
                { 
                  icon: CreditCard, 
                  title: 'Reserve Your Seat', 
                  desc: 'Card authorized but NOT charged until we reach the airport',
                  color: 'purple'
                },
                { 
                  icon: BadgePercent, 
                  title: 'Pay Less Together', 
                  desc: 'Final price calculated based on total passengers - more = cheaper!',
                  color: 'green'
                },
              ].map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="relative"
                >
                  <div className="bg-gray-800 rounded-2xl p-6 h-full border border-gray-700 hover:border-yellow-500/50 transition-all">
                    <div className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center ${
                      step.color === 'yellow' ? 'bg-yellow-500/20' :
                      step.color === 'blue' ? 'bg-blue-500/20' :
                      step.color === 'purple' ? 'bg-purple-500/20' :
                      'bg-green-500/20'
                    }`}>
                      <step.icon className={`w-7 h-7 ${
                        step.color === 'yellow' ? 'text-yellow-400' :
                        step.color === 'blue' ? 'text-blue-400' :
                        step.color === 'purple' ? 'text-purple-400' :
                        'text-green-400'
                      }`} />
                    </div>
                    <div className="text-gray-500 text-sm mb-2">Step {idx + 1}</div>
                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-gray-600 text-2xl">
                      →
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>
        
        {/* WHY CHOOSE US - Trust Builders */}
        <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Pay on Arrival</h3>
                <p className="text-gray-400">Your card is only charged when we reach the airport. No upfront payment!</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Timer className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Convenient Times</h3>
                <p className="text-gray-400">Departures every 2 hours from 6am to 10pm. Pick what suits your flight!</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPinned className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Door-to-Door</h3>
                <p className="text-gray-400">We pick you up from your exact CBD location. No walking to bus stops!</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* BOOKING FORM */}
        {showBookingForm && (
          <section id="booking-form" className="py-16 bg-gray-800">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Book Your Seat</h2>
                  <p className="text-gray-400">Secure your spot and lock in group savings!</p>
                </div>
                
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
                  {/* Progress Steps */}
                  <div className="flex border-b border-gray-700">
                    {[
                      { num: 1, label: 'Schedule', icon: Calendar },
                      { num: 2, label: 'Pickup', icon: MapPin },
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
                      {/* Step 1: Schedule */}
                      {step === 1 && (
                        <motion.div
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <h3 className="text-2xl font-bold text-white">Choose Your Departure</h3>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <Calendar className="w-4 h-4 inline mr-2" />
                              Date
                            </label>
                            <DatePicker
                              selected={selectedDate}
                              onChange={setSelectedDate}
                              minDate={new Date()}
                              dateFormat="EEEE, MMMM d, yyyy"
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <Clock className="w-4 h-4 inline mr-2" />
                              Departure Time
                            </label>
                            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                              {DEPARTURE_TIMES.map((time) => {
                                const timeData = shuttleData.departures?.[time] || { passengers: 0 };
                                const spotsLeft = 9 - timeData.passengers;
                                const priceAtTime = getPricePerPerson(timeData.passengers + 1);
                                
                                return (
                                  <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    disabled={spotsLeft < 1}
                                    className={`p-3 rounded-xl border-2 transition-all ${
                                      selectedTime === time
                                        ? 'bg-yellow-500 border-yellow-400 text-black'
                                        : spotsLeft >= 1
                                          ? 'bg-gray-800 border-gray-600 text-white hover:border-yellow-500/50'
                                          : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
                                    }`}
                                  >
                                    <div className="font-bold">{formatTime(time)}</div>
                                    {timeData.passengers > 0 && (
                                      <div className={`text-xs mt-1 ${selectedTime === time ? 'text-black/70' : 'text-green-400'}`}>
                                        {timeData.passengers} booked • ${priceAtTime}
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <Users className="w-4 h-4 inline mr-2" />
                              Passengers
                            </label>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                                className="w-12 h-12 rounded-lg bg-gray-700 text-white text-xl font-bold hover:bg-gray-600"
                              >
                                -
                              </button>
                              <span className="text-3xl font-bold text-white w-12 text-center">{passengers}</span>
                              <button
                                onClick={() => setPassengers(Math.min(9, passengers + 1))}
                                className="w-12 h-12 rounded-lg bg-gray-700 text-white text-xl font-bold hover:bg-gray-600"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          {selectedTime && (
                            <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-5 border border-green-500/30">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-green-400 text-sm font-medium">Your Price</div>
                                  <div className="text-4xl font-black text-white">${pricePerPerson}<span className="text-lg text-gray-400">/person</span></div>
                                  {savings > 0 && (
                                    <div className="text-green-400 text-sm flex items-center gap-1 mt-1">
                                      <TrendingDown className="w-4 h-4" />
                                      Save ${savings} vs private transfer!
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-gray-400 text-sm">Total for {passengers} {passengers === 1 ? 'passenger' : 'passengers'}</div>
                                  <div className="text-3xl font-bold text-yellow-400">${totalPrice}</div>
                                  {passengers < 9 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Add more passengers to save!
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <button
                            onClick={() => setStep(2)}
                            disabled={!selectedTime}
                            className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                          >
                            Continue <ChevronRight className="w-5 h-5" />
                          </button>
                        </motion.div>
                      )}
                      
                      {/* Step 2: Pickup */}
                      {step === 2 && (
                        <motion.div
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <h3 className="text-2xl font-bold text-white">Pickup Location</h3>
                          
                          <div className="relative">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              <MapPin className="w-4 h-4 inline mr-2" />
                              CBD Address
                            </label>
                            <input
                              type="text"
                              value={pickupAddress}
                              onChange={(e) => handleAddressChange(e.target.value)}
                              placeholder="Enter hotel or address in Auckland CBD"
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500"
                            />
                            {showSuggestions && addressSuggestions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
                                {addressSuggestions.map((s, i) => (
                                  <button
                                    key={i}
                                    onClick={() => selectAddress(s.description)}
                                    className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 border-b border-gray-700 last:border-0"
                                  >
                                    {s.description}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          
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
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Notes (Optional)</label>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Special requirements..."
                              rows={2}
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                            />
                          </div>
                          
                          <div className="flex gap-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-4 bg-gray-700 text-white rounded-xl">Back</button>
                            <button
                              onClick={() => setStep(3)}
                              disabled={!pickupAddress}
                              className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                              Continue <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Step 3: Contact */}
                      {step === 3 && (
                        <motion.div
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <h3 className="text-2xl font-bold text-white">Your Details</h3>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Smith"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="021 123 4567"
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="john@example.com"
                              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                            />
                          </div>
                          
                          <div className="flex gap-4">
                            <button onClick={() => setStep(2)} className="flex-1 py-4 bg-gray-700 text-white rounded-xl">Back</button>
                            <button
                              onClick={() => setStep(4)}
                              disabled={!name || !email || !phone}
                              className="flex-1 py-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                              Review <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Step 4: Confirm */}
                      {step === 4 && (
                        <motion.div
                          key="step4"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <h3 className="text-2xl font-bold text-white">Confirm Booking</h3>
                          
                          <div className="bg-gray-800 rounded-xl p-5 space-y-3">
                            <div className="flex justify-between"><span className="text-gray-400">Date</span><span className="text-white">{format(selectedDate, 'EEE, MMM d, yyyy')}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Time</span><span className="text-white">{formatTime(selectedTime)}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Pickup</span><span className="text-white text-right max-w-[60%]">{pickupAddress}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Passengers</span><span className="text-white">{passengers}</span></div>
                            <div className="flex justify-between"><span className="text-gray-400">Contact</span><span className="text-white">{name}</span></div>
                          </div>
                          
                          {/* Clear Payment Explanation */}
                          <div className="bg-gradient-to-r from-blue-900/40 to-green-900/40 rounded-xl p-5 border border-blue-500/30">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                              <CreditCard className="w-5 h-5 text-blue-400" />
                              Payment Summary
                            </h4>
                            <div className="space-y-4">
                              {/* Hold amount */}
                              <div className="flex justify-between items-center p-3 bg-blue-900/30 rounded-lg">
                                <div>
                                  <div className="text-blue-300 font-medium">Card Hold (Not Charged)</div>
                                  <div className="text-blue-400/70 text-xs">Temporary authorization</div>
                                </div>
                                <div className="text-blue-300 font-bold text-xl">${100 * passengers}</div>
                              </div>
                              
                              {/* Estimated final */}
                              <div className="flex justify-between items-center p-3 bg-green-900/30 rounded-lg">
                                <div>
                                  <div className="text-green-300 font-medium">Estimated Final Charge</div>
                                  <div className="text-green-400/70 text-xs">Based on {currentBookings + passengers} passengers currently booked</div>
                                </div>
                                <div className="text-green-400 font-bold text-xl">${totalPrice}</div>
                              </div>
                              
                              {/* Potential savings */}
                              {savings > 0 && (
                                <div className="text-center p-2 bg-yellow-900/30 rounded-lg">
                                  <span className="text-yellow-400 font-semibold">
                                    💰 Already saving ${savings} from group discount!
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* How it works reminder */}
                          <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                            <p className="text-gray-300 text-sm">
                              <span className="text-yellow-400 font-semibold">📌 Remember:</span> We'll hold ${100 * passengers} on your card now. 
                              When we arrive at the airport, we count all passengers and <span className="text-green-400 font-semibold">only charge you the final lower price</span>. 
                              The more people on your shuttle = the more you save!
                            </p>
                          </div>
                          
                          <div className="flex gap-4">
                            <button onClick={() => setStep(3)} className="flex-1 py-4 bg-gray-700 text-white rounded-xl">Back</button>
                            <button
                              onClick={handleSubmit}
                              disabled={loading}
                              className="flex-1 py-4 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold rounded-xl flex items-center justify-center gap-2"
                            >
                              {loading ? (
                                <><div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" /> Processing...</>
                              ) : (
                                <><CreditCard className="w-5 h-5" /> Confirm & Reserve</>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* FINAL CTA */}
        <section className="py-20 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-black mb-4">
              Don't Pay Taxi Prices!
            </h2>
            <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
              Join other smart travellers and save up to 75% on your airport transfer. 
              The more people book, the more everyone saves!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToBooking}
              className="px-12 py-5 bg-black text-yellow-400 text-xl font-black rounded-full shadow-xl flex items-center justify-center gap-3 mx-auto"
            >
              <Bus className="w-6 h-6" />
              Book Now - From $25/Person
              <ArrowRight className="w-6 h-6" />
            </motion.button>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default SharedShuttle;
