import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import { companyInfo } from '../mock';
import SEO from '../components/SEO';

export const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    console.log('Contact form submitted:', formData);
    toast.success("Message Sent!", {
      description: "We'll get back to you as soon as possible.",
    });
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: ''
    });
  };

  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title="Contact Us - Book Your Airport Shuttle Today"
        description="Contact Book A Ride NZ for airport shuttle bookings and inquiries. Available 24/7 for Auckland, Hamilton, and Whangarei airport transfers. Quick online booking, instant quotes, professional service."
        keywords="book airport shuttle, contact airport shuttle, airport shuttle booking, airport shuttle Auckland contact, shuttle service booking, airport transfer contact, book shuttle online"
        canonical="/contact"
      />
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
                        <p className="text-sm text-gray-600">
                          {companyInfo.phone}
                        </p>
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
                  <p className="text-sm text-gray-600 mb-4">Call us for instant booking and support.</p>
                  <p className="text-lg font-bold text-gray-900 mb-6">{companyInfo.phone}</p>
                  <p className="text-xs text-gray-500">Available 24/7</p>
                </CardContent>
              </Card>
            </div>

            {/* Contact & Inquiry Form */}
            <div className="lg:col-span-2">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-10">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Send Us a Message</h3>
                  <p className="text-gray-600 mb-8">Have questions? Need a custom quote? We're here to help!</p>
                  
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

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+64 21 123 4567"
                        className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your transfer needs, ask a question, or request a custom quote..."
                        rows={6}
                        required
                        className="transition-all duration-200 focus:ring-2 focus:ring-gold"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-gold hover:bg-gold/90 text-black font-semibold text-lg py-6 transition-colors duration-200">
                      Send Message
                    </Button>
                  </form>

                  {/* Book Online CTA */}
                  <div className="mt-8 pt-8 border-t border-gray-200 text-center">
                    <p className="text-gray-700 mb-4 font-medium">Ready to book your transfer?</p>
                    <Link to="/book-now">
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-10 py-6 text-lg">
                        Book Online Now
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </Button>
                    </Link>
                    <p className="text-sm text-gray-500 mt-3">Get instant pricing and confirmation</p>
                  </div>
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
