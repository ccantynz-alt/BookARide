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
import SEO from '../components/SEO';
import { FAQSchema } from '../components/SchemaMarkup';

const API = process.env.REACT_APP_BACKEND_URL;

// True gold color matching BookaRide branding
const goldColor = '#D4AF37';
const goldLight = '#E8D48A';
const goldDark = '#B8972E';

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
    { icon: DollarSign, title: "Earn What You're Worth", desc: "Competitive rates on every trip. Airport runs and corporate transfers pay premium rates." },
    { icon: Clock, title: "Flexible Schedule", desc: "Work when you want. Morning, evening, weekends - you choose your hours." },
    { icon: Shield, title: "Reliable Bookings", desc: "Pre-booked jobs mean no waiting around. Know your schedule in advance." },
    { icon: MapPin, title: "Local Routes", desc: "Serve the Auckland region you know best. Hibiscus Coast to Airport and beyond." },
    { icon: Users, title: "Quality Customers", desc: "Professional clientele. Tourists, business travelers, and families." },
    { icon: Zap, title: "Prompt Payments", desc: "Get paid on time. No chasing payments or dealing with no-shows." }
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
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white">
        {/* Gold decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2" style={{background: `linear-gradient(90deg, ${goldColor}, ${goldLight}, ${goldColor})`}}></div>
          <div className="absolute top-20 right-10 w-64 h-64 rounded-full filter blur-3xl" style={{backgroundColor: `${goldColor}15`}}></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full filter blur-3xl" style={{backgroundColor: `${goldColor}10`}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" style={{border: `1px solid ${goldColor}20`}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{border: `1px solid ${goldColor}15`}}></div>
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
          <div 
            className="inline-flex items-center gap-2 text-white rounded-full px-6 py-2 mb-8 shadow-lg"
            style={{background: `linear-gradient(135deg, ${goldColor}, ${goldDark})`}}
          >
            <Car className="w-5 h-5" />
            <span className="font-semibold">Now Recruiting Drivers</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-gray-900">
            Earn More.<br />
            <span style={{color: goldColor}}>Drive Premium.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
            Join Auckland's premium shuttle service. Professional bookings, premium customers, and earnings that match your effort.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={() => document.getElementById('apply-form').scrollIntoView({ behavior: 'smooth' })}
              className="text-black font-bold text-lg px-10 py-6 shadow-xl"
              style={{background: `linear-gradient(135deg, ${goldColor}, ${goldLight})`, boxShadow: `0 10px 40px ${goldColor}40`}}
            >
              Apply Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              variant="outline"
              className="font-semibold text-lg px-10 py-6"
              style={{borderColor: goldColor, borderWidth: '2px', color: goldDark}}
              onClick={() => document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg" style={{border: `2px solid ${goldColor}30`}}>
              <div className="text-4xl font-bold" style={{color: goldColor}}>Great</div>
              <div className="text-gray-500 text-sm mt-1">Earning Potential</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg" style={{border: `2px solid ${goldColor}30`}}>
              <div className="text-4xl font-bold" style={{color: goldColor}}>100%</div>
              <div className="text-gray-500 text-sm mt-1">Flexible Hours</div>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg" style={{border: `2px solid ${goldColor}30`}}>
              <div className="text-4xl font-bold" style={{color: goldColor}}>24hr</div>
              <div className="text-gray-500 text-sm mt-1">Support</div>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full flex justify-center pt-2" style={{border: `2px solid ${goldColor}`}}>
            <div className="w-1 h-3 rounded-full" style={{background: goldColor}}></div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{backgroundColor: `${goldColor}15`, color: goldDark}}>WHY CHOOSE US</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Drive With <span style={{color: goldColor}}>BookaRide?</span></h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              We're not another rideshare app. We're a premium shuttle service that values our drivers.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white rounded-3xl p-8 hover:shadow-xl transition-all duration-300 group"
                style={{border: `2px solid ${goldColor}25`}}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform"
                  style={{background: `linear-gradient(135deg, ${goldColor}, ${goldDark})`}}
                >
                  <benefit.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-500">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24" style={{background: `linear-gradient(180deg, ${goldColor}08, white, ${goldColor}05)`}}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{backgroundColor: `${goldColor}15`, color: goldDark}}>GET STARTED</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Start in <span style={{color: goldColor}}>3 Simple Steps</span></h2>
            <p className="text-gray-500 text-lg">No complicated processes. We make it easy to join the team.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="text-[120px] font-bold absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 select-none" style={{color: `${goldColor}15`}}>{step.num}</div>
                <div className="relative z-10 pt-16">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
                    style={{background: `linear-gradient(135deg, ${goldColor}, ${goldDark})`, boxShadow: `0 8px 30px ${goldColor}40`}}
                  >
                    <span className="text-2xl font-bold text-white">{index + 1}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-500">{step.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-32 right-0 transform translate-x-1/2">
                    <ArrowRight className="w-8 h-8" style={{color: `${goldColor}50`}} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{backgroundColor: `${goldColor}15`, color: goldDark}}>TESTIMONIALS</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our <span style={{color: goldColor}}>Drivers Say</span></h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="bg-white rounded-3xl p-8 hover:shadow-xl transition-shadow"
                style={{border: `2px solid ${goldColor}20`}}
              >
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6" style={{color: goldColor, fill: goldColor}} />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 text-lg italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                    style={{background: `linear-gradient(135deg, ${goldColor}, ${goldDark})`}}
                  >
                    <span className="text-white font-bold text-lg">{testimonial.name[0]}</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply-form" className="py-24" style={{background: `linear-gradient(180deg, ${goldColor}08, white, ${goldColor}05)`}}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-1 rounded-full text-sm font-medium mb-4" style={{backgroundColor: `${goldColor}15`, color: goldDark}}>JOIN US</div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Ready to <span style={{color: goldColor}}>Get Started?</span></h2>
            <p className="text-gray-500 text-lg">Fill out the form below and we'll be in touch within 24 hours.</p>
          </div>
          
          {submitted ? (
            <div className="bg-white border-2 border-green-200 rounded-3xl p-12 text-center shadow-xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Application Received!</h3>
              <p className="text-gray-500 mb-8">Thanks for your interest in driving with BookaRide. We'll review your application and call you within 24 hours.</p>
              <Link to="/">
                <Button className="text-black px-8 py-3" style={{background: `linear-gradient(135deg, ${goldColor}, ${goldLight})`}}>Back to Home</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-10 shadow-xl" style={{border: `2px solid ${goldColor}20`}}>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Full Name *</Label>
                  <Input
                    required
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                    style={{'--tw-ring-color': goldColor}}
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Phone Number *</Label>
                  <Input
                    required
                    type="tel"
                    placeholder="021 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Email Address *</Label>
                  <Input
                    required
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Your Suburb *</Label>
                  <Input
                    required
                    placeholder="e.g. Orewa, Albany, Whangaparaoa"
                    value={formData.suburb}
                    onChange={(e) => setFormData({...formData, suburb: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Vehicle Type *</Label>
                  <Input
                    required
                    placeholder="e.g. Toyota Camry, SUV, Van"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div>
                  <Label className="text-gray-700 font-medium mb-2 block">Vehicle Year *</Label>
                  <Input
                    required
                    placeholder="e.g. 2020"
                    value={formData.vehicleYear}
                    onChange={(e) => setFormData({...formData, vehicleYear: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-700 font-medium mb-2 block">Driving Experience</Label>
                  <Input
                    placeholder="e.g. 5 years, previous rideshare experience"
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-700 font-medium mb-2 block">Availability</Label>
                  <Input
                    placeholder="e.g. Weekdays, mornings, full-time"
                    value={formData.availability}
                    onChange={(e) => setFormData({...formData, availability: e.target.value})}
                    className="border-2 border-gray-200 focus:border-gold rounded-xl py-3"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-700 font-medium mb-2 block">Anything else you'd like us to know?</Label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about yourself..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full border-2 border-gray-200 focus:border-gold rounded-xl p-4 focus:outline-none focus:ring-2"
                    style={{'--tw-ring-color': `${goldColor}40`}}
                  />
                </div>
              </div>
              
              <div className="mt-8">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full text-black font-bold text-lg py-6 rounded-xl shadow-xl"
                  style={{background: `linear-gradient(135deg, ${goldColor}, ${goldLight})`, boxShadow: `0 10px 40px ${goldColor}30`}}
                >
                  {submitting ? 'Submitting...' : 'Submit Application'} 
                  {!submitting && <ArrowRight className="ml-2 w-5 h-5" />}
                </Button>
                <p className="text-center text-gray-400 text-sm mt-4">
                  By submitting, you agree to be contacted about driving opportunities.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{background: `linear-gradient(135deg, ${goldColor}, ${goldDark})`}}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Questions? Let's Talk.
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Not sure if driving with us is right for you? Give us a call.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-2 bg-white px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg" style={{color: goldDark}}>
              <Mail className="w-5 h-5" /> Contact Us
            </Link>
            <a href="mailto:info@bookaride.co.nz" className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur text-white border-2 border-white/50 px-8 py-4 rounded-xl font-bold hover:bg-white/30 transition-colors">
              <Mail className="w-5 h-5" /> info@bookaride.co.nz
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: `linear-gradient(135deg, ${goldColor}, ${goldDark})`}}>
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BookaRide</span>
          </div>
          <p>&copy; {new Date().getFullYear()} BookaRide NZ. All rights reserved.</p>
          <div className="mt-3">
            <Link to="/" className="hover:opacity-70 transition-colors" style={{color: goldColor}}>Home</Link>
            <span className="mx-3 text-gray-300">|</span>
            <Link to="/book-now" className="hover:opacity-70 transition-colors" style={{color: goldColor}}>Book a Ride</Link>
            <span className="mx-3 text-gray-300">|</span>
            <Link to="/contact" className="hover:opacity-70 transition-colors" style={{color: goldColor}}>Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DriveWithUs;
