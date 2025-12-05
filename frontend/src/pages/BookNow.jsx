import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Calendar, Users, DollarSign, Clock, Mail, Phone, User } from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import SEO from '../components/SEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const libraries = ['places'];

export const BookNow = () => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const pickupRef = useRef(null);
  const dropoffRef = useRef(null);

  const [formData, setFormData] = useState({
    serviceType: '',
    pickupAddress: '',
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
    notes: ''
  });

  const [pricing, setPricing] = useState({
    distance: 0,
    basePrice: 0,
    airportFee: 0,
    oversizedLuggageFee: 0,
    passengerFee: 0,
    totalPrice: 0,
    calculating: false
  });

  const serviceOptions = [
    { value: 'airport-shuttle', label: 'Airport Shuttle' },
    { value: 'private-transfer', label: 'Private Shuttle Transfer' }
  ];

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!isLoaded) return;

    const pickupAutocomplete = new window.google.maps.places.Autocomplete(pickupRef.current, {
      componentRestrictions: { country: 'nz' }
    });

    const dropoffAutocomplete = new window.google.maps.places.Autocomplete(dropoffRef.current, {
      componentRestrictions: { country: 'nz' }
    });

    pickupAutocomplete.addListener('place_changed', () => {
      const place = pickupAutocomplete.getPlace();
      if (place.formatted_address) {
        setFormData(prev => ({ ...prev, pickupAddress: place.formatted_address }));
      }
    });

    dropoffAutocomplete.addListener('place_changed', () => {
      const place = dropoffAutocomplete.getPlace();
      if (place.formatted_address) {
        setFormData(prev => ({ ...prev, dropoffAddress: place.formatted_address }));
      }
    });
  }, [isLoaded]);

  // Calculate price when addresses, passengers, VIP service, oversized luggage, or return trip changes
  useEffect(() => {
    if (formData.pickupAddress && formData.dropoffAddress && formData.serviceType) {
      calculatePrice();
    }
  }, [formData.pickupAddress, formData.dropoffAddress, formData.passengers, formData.serviceType, formData.bookReturn, formData.vipAirportPickup, formData.oversizedLuggage]);

  const calculatePrice = async () => {
    setPricing(prev => ({ ...prev, calculating: true }));

    try {
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: formData.serviceType,
        pickupAddress: formData.pickupAddress,
        dropoffAddress: formData.dropoffAddress,
        passengers: parseInt(formData.passengers),
        vipAirportPickup: formData.vipAirportPickup,
        oversizedLuggage: formData.oversizedLuggage
      });

      // If return trip is booked, double the price (round trip)
      const multiplier = formData.bookReturn ? 2 : 1;
      
      setPricing({
        distance: response.data.distance * multiplier,
        basePrice: response.data.basePrice * multiplier,
        airportFee: response.data.airportFee * multiplier,
        oversizedLuggageFee: response.data.oversizedLuggageFee * multiplier,
        passengerFee: response.data.passengerFee * multiplier,
        totalPrice: response.data.totalPrice * multiplier,
        calculating: false
      });
    } catch (error) {
      console.error('Error calculating price:', error);
      setPricing(prev => ({ ...prev, calculating: false }));
      toast.error('Unable to calculate distance. Please check addresses.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pricing.totalPrice === 0) {
      toast.error('Please wait for price calculation to complete');
      return;
    }

    try {
      const bookingData = {
        ...formData,
        pricing: pricing,
        status: 'pending',
        createdAt: new Date()
      };

      const bookingResponse = await axios.post(`${API}/bookings`, bookingData);
      const booking = bookingResponse.data;

      // Create Stripe checkout session
      const paymentData = {
        booking_id: booking.id,
        origin_url: window.location.origin
      };

      const checkoutResponse = await axios.post(`${API}/payment/create-checkout`, paymentData);

      // Redirect to Stripe Checkout
      if (checkoutResponse.data.url) {
        window.location.href = checkoutResponse.data.url;
      } else {
        toast.error('Unable to redirect to payment page');
      }

    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title="Book Your Airport Shuttle Now - Instant Quote & Online Booking"
        description="Book your airport shuttle online with instant live pricing. Auckland, Hamilton, Whangarei airport transfers. Easy online booking, secure payment, live price calculator. Book your shuttle service now!"
        keywords="book airport shuttle, book airport transfer, online shuttle booking, airport shuttle booking online, instant quote shuttle, book shuttle Auckland, airport transfer booking, shuttle service booking"
        canonical="/book-now"
      />
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Book Your Ride
            </h1>
            <p className="text-xl text-white/80">
              Get instant pricing with our live calculator
            </p>
          </div>
        </div>
      </section>

      {/* Booking Form */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form - Left Side */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-2 border-gray-200">
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
                          <span>Pickup Address *</span>
                        </Label>
                        <Input
                          ref={pickupRef}
                          id="pickupAddress"
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={handleChange}
                          placeholder="Start typing address..."
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                        <p className="text-xs text-gray-500">Google will suggest addresses as you type</p>
                      </div>

                      {/* Dropoff Address */}
                      <div className="space-y-2 mb-6">
                        <Label htmlFor="dropoffAddress" className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gold" />
                          <span>Drop-off Address *</span>
                        </Label>
                        <Input
                          ref={dropoffRef}
                          id="dropoffAddress"
                          name="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={handleChange}
                          placeholder="Start typing address..."
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                        <p className="text-xs text-gray-500">Google will suggest addresses as you type</p>
                      </div>

                      {/* Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <Label htmlFor="date" className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gold" />
                            <span>Pickup Date *</span>
                          </Label>
                          <Input
                            id="date"
                            name="date"
                            type="date"
                            value={formData.date}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                            onKeyDown={(e) => e.preventDefault()}
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold cursor-pointer"
                            placeholder="Select date"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time" className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-gold" />
                            <span>Pickup Time *</span>
                          </Label>
                          <Input
                            id="time"
                            name="time"
                            type="time"
                            value={formData.time}
                            onChange={handleChange}
                            required
                            onKeyDown={(e) => e.preventDefault()}
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold cursor-pointer"
                            placeholder="Select time"
                          />
                        </div>
                      </div>

                      {/* Flight Information */}
                      <div className="bg-gray-50 p-6 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Flight Information (Optional)</h3>
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
                            <Label htmlFor="departureTime">Departure Time</Label>
                            <Input
                              id="departureTime"
                              name="departureTime"
                              type="time"
                              value={formData.departureTime}
                              onChange={handleChange}
                              className="transition-all duration-200 focus:ring-2 focus:ring-gold"
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
                            <Label htmlFor="arrivalTime">Arrival Time</Label>
                            <Input
                              id="arrivalTime"
                              name="arrivalTime"
                              type="time"
                              value={formData.arrivalTime}
                              onChange={handleChange}
                              className="transition-all duration-200 focus:ring-2 focus:ring-gold"
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
                              <Label htmlFor="returnDate" className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gold" />
                                <span>Return Date *</span>
                              </Label>
                              <Input
                                id="returnDate"
                                name="returnDate"
                                type="date"
                                value={formData.returnDate}
                                onChange={handleChange}
                                min={formData.date || new Date().toISOString().split('T')[0]}
                                required={formData.bookReturn}
                                onKeyDown={(e) => e.preventDefault()}
                                className="transition-all duration-200 focus:ring-2 focus:ring-gold cursor-pointer"
                                placeholder="Select return date"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="returnTime" className="flex items-center space-x-2">
                                <Clock className="w-4 h-4 text-gold" />
                                <span>Return Time *</span>
                              </Label>
                              <Input
                                id="returnTime"
                                name="returnTime"
                                type="time"
                                value={formData.returnTime}
                                onChange={handleChange}
                                required={formData.bookReturn}
                                onKeyDown={(e) => e.preventDefault()}
                                className="transition-all duration-200 focus:ring-2 focus:ring-gold cursor-pointer"
                                placeholder="Select return time"
                              />
                            </div>
                          </div>

                          {/* Return Flight Information */}
                          <div className="bg-white p-4 rounded-lg">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Return Flight Information (Optional)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="returnDepartureFlightNumber">Departure Flight Number</Label>
                                <Input
                                  id="returnDepartureFlightNumber"
                                  name="returnDepartureFlightNumber"
                                  value={formData.returnDepartureFlightNumber}
                                  onChange={handleChange}
                                  placeholder="e.g., NZ123"
                                  className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="returnDepartureTime">Departure Time</Label>
                                <Input
                                  id="returnDepartureTime"
                                  name="returnDepartureTime"
                                  type="time"
                                  value={formData.returnDepartureTime}
                                  onChange={handleChange}
                                  className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="returnArrivalFlightNumber">Arrival Flight Number</Label>
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
                                <Label htmlFor="returnArrivalTime">Arrival Time</Label>
                                <Input
                                  id="returnArrivalTime"
                                  name="returnArrivalTime"
                                  type="time"
                                  value={formData.returnArrivalTime}
                                  onChange={handleChange}
                                  className="transition-all duration-200 focus:ring-2 focus:ring-gold"
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

                  <Card className="border-2 border-gray-200">
                    <CardContent className="p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>

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
                  <Card className="border-2 border-gold/30 sticky top-24">
                    <CardContent className="p-8">
                      <div className="flex items-center space-x-2 mb-6">
                        <DollarSign className="w-6 h-6 text-gold" />
                        <h2 className="text-2xl font-bold text-gray-900">Price Estimate</h2>
                      </div>

                      {pricing.calculating ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
                          <p className="text-gray-600">Calculating...</p>
                        </div>
                      ) : pricing.totalPrice > 0 ? (
                        <div className="space-y-4">
                          <div className="flex justify-between pb-3 border-b border-gray-200">
                            <span className="text-gray-600">Distance</span>
                            <span className="font-semibold text-gray-900">{pricing.distance} km</span>
                          </div>
                          <div className="flex justify-between pb-3 border-b border-gray-200">
                            <span className="text-gray-600">Base Price ($2.50/km)</span>
                            <span className="font-semibold text-gray-900">${pricing.basePrice.toFixed(2)}</span>
                          </div>
                          {pricing.airportFee > 0 && (
                            <div className="flex justify-between pb-3 border-b border-gray-200">
                              <span className="text-gray-600">VIP Airport Pickup</span>
                              <span className="font-semibold text-gray-900">${pricing.airportFee.toFixed(2)}</span>
                            </div>
                          )}
                          {pricing.oversizedLuggageFee > 0 && (
                            <div className="flex justify-between pb-3 border-b border-gray-200">
                              <span className="text-gray-600">Oversized Luggage</span>
                              <span className="font-semibold text-gray-900">${pricing.oversizedLuggageFee.toFixed(2)}</span>
                            </div>
                          )}
                          {pricing.passengerFee > 0 && (
                            <div className="flex justify-between pb-3 border-b border-gray-200">
                              <span className="text-gray-600">Extra Passengers</span>
                              <span className="font-semibold text-gray-900">${pricing.passengerFee.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="flex justify-between pt-4 border-t-2 border-gold/30">
                            <span className="text-xl font-bold text-gray-900">Total</span>
                            <span className="text-3xl font-bold text-gold">${pricing.totalPrice.toFixed(2)}</span>
                          </div>
                          <p className="text-xs text-gray-500 text-center mt-4">
                            *This is an estimate. Final price will be confirmed before your trip.
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>Enter addresses to see price estimate</p>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full mt-8 bg-gold hover:bg-gold/90 text-black font-semibold py-6 text-lg transition-colors duration-200"
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
