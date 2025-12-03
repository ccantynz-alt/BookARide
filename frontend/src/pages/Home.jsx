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
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Reliable Rides
              <span className="block mt-2">Across New Zealand</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Safe, comfortable, and affordable transportation whenever you need it. Available 24/7 for all your travel needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-600 font-semibold px-10 py-6 text-base group transition-all duration-200 shadow-lg">
                  Book Your Ride
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-10 py-6 text-base transition-all duration-200">
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
              { icon: Users, value: '10,000+', label: 'Happy Customers' },
              { icon: Clock, value: '24/7', label: 'Available' },
              { icon: Shield, value: '100%', label: 'Safe & Insured' },
              { icon: Award, value: '4.9', label: 'Customer Rating' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200">
                  <Icon className="w-8 h-8 text-white mx-auto mb-3" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-white/80">{stat.label}</div>
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
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Whatever your transportation needs, we've got you covered
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {services.map((service) => {
              const Icon = iconMap[service.icon];
              return (
                <Card key={service.id} className="border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-200 group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-200">
                      <Icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-200" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">{service.description}</p>
                    <ul className="space-y-3">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-blue-600 mr-3 flex-shrink-0" />
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
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-px bg-blue-200 -z-10"></div>
                )}
                <div className="w-32 h-32 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
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
              <Card key={testimonial.id} className="border-2 border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-blue-600 fill-blue-600" />
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
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Book Your Ride?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Get in touch today and let us take care of your transportation needs.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-white hover:bg-gray-100 text-blue-600 font-semibold px-10 py-6 text-base transition-all duration-200 shadow-lg">
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
