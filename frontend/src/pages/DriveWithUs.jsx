import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, DollarSign, Clock, Shield, MapPin, CheckCircle, 
  ArrowRight, Phone, Mail, Star, Users, Calendar, Zap
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const DriveWithUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    suburb: '',
    vehicleType: '',
    vehicleYear: '',
    experience: '',
    availability: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await axios.post(`${API}/driver-applications`, formData);
      setSubmitted(true);
      toast.success('Application submitted successfully! We\'ll be in touch soon.');
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const benefits = [
    { icon: DollarSign, title: "Competitive Earnings", desc: "Earn top rates on every trip. Airport runs and corporate transfers pay premium." },
    { icon: Clock, title: "Flexible Schedule", desc: "Work when you want. Morning, evening, weekends - you choose your hours." },
    { icon: Shield, title: "Reliable Bookings", desc: "Pre-booked jobs mean no waiting around. Know your schedule in advance." },
    { icon: MapPin, title: "Local Routes", desc: "Serve the Auckland region you know best. Hibiscus Coast to Airport and beyond." },
    { icon: Users, title: "Premium Customers", desc: "Professional clientele. Tourists, business travelers, and families." },
    { icon: Zap, title: "Quick Payments", desc: "Get paid promptly. No chasing payments or dealing with no-shows." }
  ];

  const steps = [
    { num: "01", title: "Apply Online", desc: "Fill out our simple application form below" },
    { num: "02", title: "Quick Chat", desc: "We'll call you for a brief introduction" },
    { num: "03", title: "Start Driving", desc: "Get approved and start accepting bookings" }
  ];

  const testimonials = [
    { name: "Tony H.", location: "Orewa", quote: "Best decision I made. Flexible hours and great customers. The airport runs are gold.", rating: 5 },
    { name: "Sarah M.", location: "Albany", quote: "Finally a company that respects drivers. Professional setup and reliable bookings.", rating: 5 },
    { name: "Mike R.", location: "Whangaparaoa", quote: "I was doing rideshare before - this is so much better. Premium fares, premium service.", rating: 5 }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gold/30 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/20 rounded-full filter blur-3xl"></div>
          </div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6">
            <Car className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm font-medium">Now Recruiting Drivers</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Earn More.<br />
            <span className="text-gold">Drive Premium.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join Auckland's premium shuttle service. Professional bookings, premium customers, and earnings that match your effort.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => document.getElementById('apply-form').scrollIntoView({ behavior: 'smooth' })}
              className="bg-gold hover:bg-gold/90 text-black font-bold text-lg px-8 py-6"
            >
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
              onClick={() => document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-gold">$1000+</div>
              <div className="text-gray-400 text-sm">Weekly Potential</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gold">100%</div>
              <div className="text-gray-400 text-sm">Flexible Hours</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gold">24hr</div>
              <div className="text-gray-400 text-sm">Support</div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-gold rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Drive With <span className="text-gold">BookaRide?</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We're not another rideshare app. We're a premium shuttle service that values our drivers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-gold/50 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-gold/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-400">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Get Started in <span className="text-gold">3 Simple Steps</span></h2>
            <p className="text-gray-400 text-lg">No complicated processes. We make it easy to join the team.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-8xl font-bold text-gold/10 absolute -top-4 left-0">{step.num}</div>
                <div className="relative z-10 pt-8">
                  <h3 className="text-2xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-gold/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-black">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our <span className="text-gold">Drivers Say</span></h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/20 rounded-full flex items-center justify-center">
                    <span className="text-gold font-bold">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply-form" className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Ready to <span className="text-gold">Join Us?</span></h2>
            <p className="text-gray-400 text-lg">Fill out the form below and we'll be in touch within 24 hours.</p>
          </div>
          
          {submitted ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-12 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">Application Received!</h3>
              <p className="text-gray-400 mb-6">Thanks for your interest in driving with BookaRide. We'll review your application and call you within 24 hours.</p>
              <Link to="/">
                <Button className="bg-gold hover:bg-gold/90 text-black">Back to Home</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-white mb-2 block">Full Name *</Label>
                  <Input
                    required
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Phone Number *</Label>
                  <Input
                    required
                    type="tel"
                    placeholder="021 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Your Suburb *</Label>
                  <Input
                    required
                    placeholder="e.g. Orewa, Albany, Whangaparaoa"
                    value={formData.suburb}
                    onChange={(e) => setFormData({...formData, suburb: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Vehicle Type *</Label>
                  <Input
                    required
                    placeholder="e.g. Toyota Camry, SUV, Van"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2 block">Vehicle Year *</Label>
                  <Input
                    required
                    placeholder="e.g. 2020"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white mb-2 block">Driving Experience</Label>
                  <Input
                    placeholder="e.g. 5 years, previous rideshare experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white mb-2 block">Availability</Label>
                  <Input
                    placeholder="e.g. Weekdays, mornings, full-time"
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white mb-2 block">Anything else you'd like us to know?</Label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about yourself..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-gray-500 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-gold"
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-bold text-lg py-6"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'} 
                  {!submitting && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
                <p className="text-center text-gray-500 text-sm mt-4">
                  By submitting, you agree to be contacted about driving opportunities.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
            Questions? Let's Talk.
          </h2>
          <p className="text-black/70 text-lg mb-6">
            Not sure if driving with us is right for you? Give us a call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:+64217433210" className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors">
              <Phone className="w-5 h-5" /> +64 21 743 321
            </a>
            <a href="mailto:info@bookaride.co.nz" className="inline-flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors">
              <Mail className="w-5 h-5" /> info@bookaride.co.nz
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} BookaRide NZ. All rights reserved.</p>
          <div className="mt-2">
            <Link to="/" className="hover:text-gold transition-colors">Home</Link>
            <span className="mx-2">|</span>
            <Link to="/book-now" className="hover:text-gold transition-colors">Book a Ride</Link>
            <span className="mx-2">|</span>
            <Link to="/contact" className="hover:text-gold transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DriveWithUs;
