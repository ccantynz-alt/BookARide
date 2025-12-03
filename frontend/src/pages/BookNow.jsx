import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, DollarSign, Clock, Mail, Phone, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const BookNow = () => {
  const [formData, setFormData] = useState({
    serviceType: '',
    pickupAddress: '',
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    departureFlightNumber: '',
    departureTime: '',
    arrivalFlightNumber: '',
    arrivalTime: '',
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  const [pricing, setPricing] = useState({
    distance: 0,
    basePrice: 0,
    airportFee: 0,
    passengerFee: 0,
    totalPrice: 0,
    calculating: false
  });

  const serviceOptions = [
    { value: 'auckland-airport', label: 'Auckland International Airport' },
    { value: 'hamilton-airport', label: 'Hamilton Airport' },
    { value: 'whangarei-airport', label: 'Whangarei Airport' },
    { value: 'private-auckland', label: 'Private Auckland Transfer' }
  ];

  // Calculate price when addresses or passengers change
  useEffect(() => {
    if (formData.pickupAddress && formData.dropoffAddress && formData.serviceType) {
      calculatePrice();
    }
  }, [formData.pickupAddress, formData.dropoffAddress, formData.passengers, formData.serviceType]);

  const calculatePrice = async () => {
    setPricing(prev => ({ ...prev, calculating: true }));

    try {
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: formData.serviceType,
        pickupAddress: formData.pickupAddress,
        dropoffAddress: formData.dropoffAddress,
        passengers: parseInt(formData.passengers)
      });

      setPricing({
        ...response.data,
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

      await axios.post(`${API}/bookings`, bookingData);

      toast.success('Booking Request Submitted!', {
        description: `Estimated cost: $${pricing.totalPrice.toFixed(2)}. We'll contact you shortly to confirm.`
      });

      // Reset form
      setFormData({
        serviceType: '',
        pickupAddress: '',
        dropoffAddress: '',
        date: '',
        time: '',
        passengers: '1',
        name: '',
        email: '',
        phone: '',
        notes: ''
      });
      setPricing({
        distance: 0,
        basePrice: 0,
        airportFee: 0,
        passengerFee: 0,
        totalPrice: 0,
        calculating: false
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Failed to submit booking. Please try again.');
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-white">
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
                          id="pickupAddress"
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={handleChange}
                          placeholder="Enter full pickup address"
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
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
                          placeholder="Enter full drop-off address"
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
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
                            required
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold"
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
                            className="transition-all duration-200 focus:ring-2 focus:ring-gold"
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
                              <span className="text-gray-600">Airport Pickup Fee</span>
                              <span className="font-semibold text-gray-900">${pricing.airportFee.toFixed(2)}</span>
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
