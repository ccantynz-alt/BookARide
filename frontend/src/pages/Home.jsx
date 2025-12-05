import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plane, Briefcase, MapPin, Calendar, Star, Check, Shield, Clock, Award, Users, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { services, testimonials, howItWorksSteps } from '../mock';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { AnimatedSection, FadeIn } from '../components/AnimatedSection';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const iconMap = {
  plane: Plane,
  briefcase: Briefcase,
  'map-pin': MapPin,
  calendar: Calendar
};

export const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Affordable Airport Shuttle Auckland - Best Value Transfers"
        description="Affordable airport shuttle service in Auckland. Best value airport transfers for Auckland, Hamilton, and Whangarei airports. Reliable, safe, and budget-friendly shuttle service available 24/7. Book online now!"
        keywords="airport, airport shuttle, cheap airport shuttle, affordable airport transfer, budget shuttle, Auckland shuttles, Auckland airport shuttle, Hamilton airport shuttle, Whangarei airport transfer, airport transfer, airport transportation, shuttle service Auckland, best value shuttle, reliable shuttle"
        canonical="/"
      />
      <StructuredData />
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Background Vehicle Image - Subtle */}
        <div className="absolute inset-0 opacity-15">
          <img 
            src="/shuttle-van.jpg" 
            alt="" 
            className="w-full h-full object-cover object-right"
            style={{ filter: 'brightness(0.4) blur(1px)' }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Affordable Airport Shuttles
              <span className="block mt-2 text-gold">Best Value in Auckland</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Reliable airport transfers at unbeatable prices. Instant online booking, transparent pricing, and professional service - all in 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-base group transition-all duration-200 shadow-lg">
                  Book Your Ride
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-2 border-gold text-gold hover:bg-gold hover:text-black font-semibold px-10 py-6 text-base transition-all duration-200">
                  View Services
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="container mx-auto px-4 mt-20 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '1,000+', label: 'Happy Customers' },
              { icon: Clock, value: '60s', label: 'Book in Seconds' },
              { icon: Shield, value: '100%', label: 'Safe & Insured' },
              { icon: Award, value: '4.9★', label: 'Customer Rating' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-gold/20 hover:bg-white/10 transition-all duration-200">
                  <Icon className="w-8 h-8 text-gold mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="bg-gold text-black text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide">
                ⚡ Instant Online Booking Available
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whatever your transportation needs, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {services.map((service) => {
              const Icon = iconMap[service.icon];
              return (
                <Card key={service.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-200 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold transition-colors duration-200">
                      <Icon className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-200" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">{service.description}</p>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-gold mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Competitive Advantages */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Best value airport shuttles with modern convenience
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <Card className="border-2 border-gold/30 bg-white shadow-xl">
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - Features */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Online Booking</h3>
                        <p className="text-gray-600 text-sm">Book in 60 seconds with live price calculator. No phone calls or email quotes needed.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Triple Auto-Confirmations</h3>
                        <p className="text-gray-600 text-sm">Receive instant email, SMS, and automatic Google Calendar entry for your booking.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">VIP Airport Service</h3>
                        <p className="text-gray-600 text-sm">Premium airport pickup with VIP parking close to terminal doors.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Online Payments</h3>
                        <p className="text-gray-600 text-sm">Fast, secure checkout with Stripe. No cash or bank transfer hassles.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - More Features */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">One-Click Return Trips</h3>
                        <p className="text-gray-600 text-sm">Book your return journey in a single booking. No need for separate reservations.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialist Services</h3>
                        <p className="text-gray-600 text-sm">Dedicated Hobbiton tours and cruise ship transfers. We know these routes inside out.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oversized Luggage Welcome</h3>
                        <p className="text-gray-600 text-sm">Skis, bikes, surfboards, golf clubs - we handle all your oversized gear.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fixed Transparent Pricing</h3>
                        <p className="text-gray-600 text-sm">See your exact price before booking. No surge pricing, no hidden fees.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-10 text-center pt-8 border-t border-gray-200">
                  <p className="text-gray-700 mb-4 font-medium">Ready to experience the difference?</p>
                  <Link to="/book-now">
                    <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
                      Book Your Ride Now
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured: Hobbiton Transfers */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 border-gold/30 bg-gray-900/50 backdrop-blur overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Text Content */}
                  <div className="p-10 lg:p-12 flex flex-col justify-center">
                    <div className="inline-block mb-4">
                      <span className="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Popular Destination
                      </span>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                      Hobbiton Movie Set Transfers
                    </h3>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                      Experience the magic of Middle-earth with our premium transfer service from Auckland to Hobbiton Movie Set in Matamata. 
                      Comfortable, direct, and hassle-free.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        175km scenic journey through Waikato
                      </li>
                      <li className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        Perfect timing for your Hobbiton tour
                      </li>
                      <li className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        Return trips available
                      </li>
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to="/hobbiton-transfers">
                        <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 w-full sm:w-auto">
                          Learn More
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                      <Link to="/book-now">
                        <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black px-8 py-6 w-full sm:w-auto">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Image/Visual */}
                  <div className="bg-gradient-to-br from-gold/20 to-gold/5 p-10 lg:p-12 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl mb-6">🧙‍♂️</div>
                      <p className="text-gold font-bold text-2xl mb-2">From $612.50</p>
                      <p className="text-gray-400 text-sm">Based on distance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Booking a ride is quick and easy
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="text-center relative group">
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-px bg-gold/30 -z-10"></div>
                )}
                <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-black border-2 border-gold/30 text-gold rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-200">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Book Your Ride?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Get in touch today and let us take care of your transportation needs.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-base transition-all duration-200 shadow-lg">
              Book Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
