import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plane, Briefcase, MapPin, Calendar, Star, Check, Shield, Clock, Award, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { services, testimonials, howItWorksSteps } from '../mock';

const iconMap = {
  plane: Plane,
  briefcase: Briefcase,
  'map-pin': MapPin,
  calendar: Calendar
};

export const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block mb-6">
              <span className="text-gold font-light tracking-[0.3em] uppercase text-sm border border-gold/30 px-6 py-2 rounded-full">
                Premium Transportation
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-light text-white mb-8 leading-tight tracking-tight">
              Experience Luxury
              <span className="block text-gold font-normal mt-2">On Every Journey</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
              Elevate your travel experience with New Zealand's most distinguished transportation service. Where elegance meets reliability.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-light tracking-wider uppercase px-10 py-6 text-base group transition-all duration-300 hover:shadow-xl hover:shadow-gold/30">
                  Reserve Your Ride
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-2 border-gold text-gold hover:bg-gold hover:text-black font-light tracking-wider uppercase px-10 py-6 text-base transition-all duration-300">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="container mx-auto px-4 mt-20 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: '10,000+', label: 'Distinguished Clients' },
              { icon: Clock, value: '24/7', label: 'Exclusive Service' },
              { icon: Shield, value: '100%', label: 'Safety Assured' },
              { icon: Award, value: '4.9', label: 'Client Satisfaction' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-lg border border-gold/20 hover:bg-white/10 transition-all duration-300">
                  <Icon className="w-8 h-8 text-gold mx-auto mb-3" />
                  <div className="text-3xl font-light text-gold mb-1">{stat.value}</div>
                  <div className="text-sm text-white/60 font-light tracking-wide">{stat.label}</div>
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
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Premium Services</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Curated Experiences</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Exceptional transportation solutions tailored to your lifestyle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {services.map((service) => {
              const Icon = iconMap[service.icon];
              return (
                <Card key={service.id} className="border border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-500 group bg-white">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mb-6 group-hover:bg-gold transition-colors duration-300">
                      <Icon className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-light text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6 text-sm font-light leading-relaxed">{service.description}</p>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700 font-light">
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

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Seamless Process</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Four Simple Steps</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Your journey to luxury begins here
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="text-center relative group">
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-px bg-gradient-to-r from-gold/50 to-transparent -z-10"></div>
                )}
                <div className="w-32 h-32 bg-gradient-to-br from-black to-gray-900 text-gold rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-light shadow-lg group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-gold/20 transition-all duration-500 border-2 border-gold/20">
                  {step.step}
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-3 tracking-wide">{step.title}</h3>
                <p className="text-gray-600 text-sm font-light leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Client Experiences</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Discover why distinguished clients choose us
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-500 bg-white">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic font-light leading-relaxed">"{testimonial.content}"</p>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="font-normal text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 font-light mt-1">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
            Begin Your Luxury Journey
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Experience transportation redefined. Book your premium ride today and discover the difference.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-light tracking-wider uppercase px-10 py-6 text-base transition-all duration-300 hover:shadow-xl hover:shadow-gold/30">
              Reserve Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
