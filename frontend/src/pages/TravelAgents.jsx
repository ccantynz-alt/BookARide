import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Users, Globe, DollarSign, Clock, Shield, 
  CheckCircle, ArrowRight, Phone, Mail, Building2, 
  Plane, Ship, Bus, Star, Award, Headphones
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import SEO from '../components/SEO';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TravelAgents = () => {
  const [formData, setFormData] = useState({
    agencyName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    monthlyBookings: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.post(`${API}/contact`, {
        name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        subject: `Travel Agent Partnership Inquiry - ${formData.agencyName}`,
        message: `Agency: ${formData.agencyName}\nWebsite: ${formData.website}\nMonthly Bookings: ${formData.monthlyBookings}\n\n${formData.message}`
      });
      
      toast.success('Thank you! Our partnerships team will contact you within 24 hours.');
      setFormData({
        agencyName: '', contactName: '', email: '', phone: '', website: '', monthlyBookings: '', message: ''
      });
    } catch (error) {
      toast.error('Failed to submit. Please email us at partners@bookaride.co.nz');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: DollarSign, title: 'Competitive Commission', desc: 'Earn up to 15% commission on every booking. Volume-based tiers available.' },
    { icon: Clock, title: 'Real-Time Availability', desc: 'Instant booking confirmation. No waiting for availability checks.' },
    { icon: Shield, title: 'Reliable Service', desc: '99.8% on-time rate. Your clients are in safe hands.' },
    { icon: Headphones, title: 'Dedicated Support', desc: '24/7 agent support line. Direct access to our partnerships team.' },
    { icon: Globe, title: 'Multi-Language Drivers', desc: 'Drivers fluent in English, Mandarin, Korean, Japanese & more.' },
    { icon: Award, title: 'Quality Guaranteed', desc: 'Modern fleet, professional drivers, comprehensive insurance.' }
  ];

  const services = [
    { icon: Plane, title: 'Airport Transfers', desc: 'Auckland, Hamilton, Rotorua airports. Flight tracking included.' },
    { icon: Ship, title: 'Cruise Ship Transfers', desc: 'All Auckland cruise terminals. Meet & greet service.' },
    { icon: Bus, title: 'Group Transport', desc: '8-50+ passengers. Perfect for tour groups.' },
    { icon: Building2, title: 'Hobbiton & Day Tours', desc: 'Transport to NZ\'s top attractions.' }
  ];

  const testimonials = [
    { name: 'Sarah Chen', company: 'Pacific Tours NZ', text: 'BookaRide has been our trusted ground transport partner for 3 years. Reliable, professional, and our clients love them.' },
    { name: 'Michael Thompson', company: 'Auckland Inbound Tours', text: 'The commission structure is excellent and their real-time booking system saves us hours every week.' },
    { name: 'Emma Williams', company: 'Kiwi Experience Travel', text: 'Best airport transfer partner in Auckland. 24/7 support means we can always assist our international clients.' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Travel Agent Partnerships | BookaRide NZ Ground Transport Partner"
        description="Partner with BookaRide for reliable Auckland airport transfers. Competitive agent commissions, real-time booking, 24/7 support. New Zealand's trusted ground transport for travel agents and tour operators."
        keywords="travel agent airport transfers NZ, tour operator ground transport, travel trade NZ, inbound tour operator transport, Auckland travel agent partnerships, commission airport transfers, wholesale transfers NZ"
        canonical="https://bookaride.co.nz/travel-agents"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Briefcase className="w-4 h-4" />
              Travel Trade Program
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your Trusted Ground Transport Partner in New Zealand
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join 200+ travel agents and tour operators who trust BookaRide for reliable airport transfers, cruise transfers, and group transport across Auckland.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gold hover:bg-gold/90 text-black font-semibold px-8"
                onClick={() => document.getElementById('partner-form').scrollIntoView({ behavior: 'smooth' })}
              >
                Become a Partner <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <a href="tel:+6421339030">
                  <Phone className="mr-2 w-5 h-5" /> Call Partnerships Team
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-gold py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-black">
            <div>
              <div className="text-3xl font-bold">200+</div>
              <div className="text-sm">Partner Agencies</div>
            </div>
            <div>
              <div className="text-3xl font-bold">50,000+</div>
              <div className="text-sm">Annual Transfers</div>
            </div>
            <div>
              <div className="text-3xl font-bold">99.8%</div>
              <div className="text-sm">On-Time Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm">Agent Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Partner With BookaRide?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make it easy for travel agents and tour operators to provide reliable ground transport for their clients.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Services for Your Clients</h2>
            <p className="text-lg text-gray-600">Comprehensive ground transport solutions across New Zealand</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <div key={idx} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                <service.icon className="w-10 h-10 text-gold mb-4" />
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-400 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure - REMOVED - Requires approval */}
      {/* Contact for partnership details */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Partnership Benefits</h2>
            <p className="text-gray-400">Contact us to discuss partnership terms tailored to your agency</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-gold text-4xl font-bold mb-2">
                <Users className="w-10 h-10 mx-auto" />
              </div>
              <div className="text-xl font-semibold mb-4">Small Agencies</div>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>Online booking portal</li>
                <li>Standard support</li>
                <li>Competitive rates</li>
              </ul>
            </div>
            <div className="bg-gold text-black rounded-xl p-6 text-center transform scale-105">
              <div className="text-4xl font-bold mb-2">
                <Building2 className="w-10 h-10 mx-auto" />
              </div>
              <div className="text-xl font-semibold mb-4">Growing Partners</div>
              <ul className="text-gray-800 text-sm space-y-2">
                <li>Priority support</li>
                <li>Dedicated account manager</li>
                <li>Volume-based terms</li>
              </ul>
            </div>
            <div className="bg-gray-800 rounded-xl p-6 text-center">
              <div className="text-gold text-4xl font-bold mb-2">
                <Award className="w-10 h-10 mx-auto" />
              </div>
              <div className="text-xl font-semibold mb-4">Premier Partners</div>
              <ul className="text-gray-400 text-sm space-y-2">
                <li>24/7 direct line</li>
                <li>Custom solutions</li>
                <li>Exclusive terms</li>
              </ul>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <p className="text-gray-400">Contact our partnerships team to discuss rates and terms</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Partners Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex gap-1 text-gold mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                </div>
                <p className="text-gray-600 mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Form */}
      <section id="partner-form" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Become a Partner</h2>
              <p className="text-gray-600">Fill out the form below and our partnerships team will contact you within 24 hours.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agency Name *</label>
                  <Input
                    required
                    value={formData.agencyName}
                    onChange={(e) => setFormData({...formData, agencyName: e.target.value})}
                    placeholder="Your travel agency name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name *</label>
                  <Input
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <Input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@agency.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <Input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+64 21 xxx xxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="www.youragency.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Est. Monthly Bookings</label>
                  <Input
                    value={formData.monthlyBookings}
                    onChange={(e) => setFormData({...formData, monthlyBookings: e.target.value})}
                    placeholder="e.g. 20-50"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <Textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us about your agency and how we can help..."
                  rows={4}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full mt-6 bg-gold hover:bg-gold/90 text-black font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Partnership Inquiry'}
              </Button>
            </form>
            
            <div className="mt-8 text-center text-gray-600">
              <p className="mb-2">Prefer to talk? Contact our partnerships team directly:</p>
              <div className="flex justify-center gap-6">
                <a href="tel:+6421339030" className="flex items-center gap-2 text-gold hover:underline">
                  <Phone className="w-4 h-4" /> +64 21 339 030
                </a>
                <a href="mailto:partners@bookaride.co.nz" className="flex items-center gap-2 text-gold hover:underline">
                  <Mail className="w-4 h-4" /> partners@bookaride.co.nz
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">Ready to Partner With Us?</h2>
          <p className="text-black/80 mb-8 max-w-xl mx-auto">
            Join New Zealand&apos;s most trusted ground transport network and give your clients the best travel experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-black text-white hover:bg-gray-800" asChild>
              <Link to="/book-now">Book a Test Transfer</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-black text-black hover:bg-black/10" asChild>
              <a href="/BookaRide-Agent-Kit.pdf" download>Download Agent Kit</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TravelAgents;
