import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { companyInfo } from '../mock';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: '',
    pickupLocation: '',
    dropoffLocation: '',
    date: '',
    time: '',
    passengers: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock submission - will be connected to backend later
    console.log('Booking submitted:', formData);
    toast.success("Booking Request Received!", {
      description: "We'll contact you shortly to confirm your booking.",
    });
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      serviceType: '',
      pickupLocation: '',
      dropoffLocation: '',
      date: '',
      time: '',
      passengers: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Book Your Ride
            </h1>
            <p className="text-xl text-white/80">
              Fill out the form below and we'll get back to you shortly to confirm your booking.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Phone</div>
                        <a href={`tel:${companyInfo.phone}`} className="text-sm text-gray-600 hover:text-gold transition-colors duration-200">
                          {companyInfo.phone}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Email</div>
                        <a href={`mailto:${companyInfo.email}`} className="text-sm text-gray-600 hover:text-gold transition-colors duration-200">
                          {companyInfo.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Address</div>
                        <p className="text-sm text-gray-600">{companyInfo.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900 mb-2">Hours</div>
                        <p className="text-sm text-gray-600">24/7 Service Available</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30 bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="p-8">
                  <h4 className="font-semibold text-gray-900 mb-3">Need Help Right Away?</h4>
                  <p className="text-sm text-gray-600 mb-6">Call us now for instant booking and support.</p>
                  <a href={`tel:${companyInfo.phone}`}>
                    <Button className="w-full bg-gold hover:bg-gold/90 text-black font-semibold transition-colors duration-200">
                      Call Now
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-10">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8">Booking Form</h3>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
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
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type *</Label>
                        <Select onValueChange={(value) => handleSelectChange('serviceType', value)} required>
                          <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-gold">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="airport">Airport Transfer</SelectItem>
                            <SelectItem value="corporate">Corporate Travel</SelectItem>
                            <SelectItem value="city">City Ride</SelectItem>
                            <SelectItem value="event">Special Event</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="pickupLocation">Pickup Location *</Label>
                        <Input
                          id="pickupLocation"
                          name="pickupLocation"
                          value={formData.pickupLocation}
                          onChange={handleChange}
                          placeholder="123 Main Street, Auckland"
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dropoffLocation">Drop-off Location *</Label>
                        <Input
                          id="dropoffLocation"
                          name="dropoffLocation"
                          value={formData.dropoffLocation}
                          onChange={handleChange}
                          placeholder="Auckland Airport"
                          required
                          className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="date">Date *</Label>
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
                        <Label htmlFor="time">Time *</Label>
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
                      <div className="space-y-2">
                        <Label htmlFor="passengers">Passengers *</Label>
                        <Select onValueChange={(value) => handleSelectChange('passengers', value)} required>
                          <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-gold">
                            <SelectValue placeholder="Number" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Passenger</SelectItem>
                            <SelectItem value="2">2 Passengers</SelectItem>
                            <SelectItem value="3">3 Passengers</SelectItem>
                            <SelectItem value="4">4 Passengers</SelectItem>
                            <SelectItem value="5+">5+ Passengers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Additional Information</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Any special requirements or notes..."
                        rows={4}
                        className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black font-semibold text-lg py-7 transition-colors duration-200">
                      Submit Booking Request
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
