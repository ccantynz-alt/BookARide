import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Briefcase, MapPin, Calendar, Check, ArrowRight, Users, Car, Shield, Clock, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { services, fleet } from '../mock';

const iconMap = {
  plane: Plane,
  briefcase: Briefcase,
  'map-pin': MapPin,
  calendar: Calendar
};

export const Services = () => {
  return (
    <div className="min-h-screen pt-20 bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our Services
            </h1>
            <p className="text-xl text-white/90">
              Comprehensive transportation solutions for all your needs
            </p>
          </div>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <Card key={service.id} className="border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-10">
                    <div className="flex items-start space-x-6">
                      <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-10 h-10 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4">{service.title}</h3>
                        <p className="text-gray-600 mb-8 leading-relaxed">{service.description}</p>
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Features:</h4>
                          {service.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <span className="text-gray-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fleet Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Fleet</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our range of well-maintained, comfortable vehicles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {fleet.map((vehicle) => (
              <Card key={vehicle.id} className="border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-blue-100 group-hover:bg-blue-600 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                      <Car className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{vehicle.name}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Capacity:</span>
                      <span className="font-semibold text-gray-900 text-sm">{vehicle.capacity}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm">Luggage:</span>
                      <span className="font-semibold text-gray-900 text-sm">{vehicle.luggage}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { icon: Shield, title: 'Safe & Secure', description: 'All drivers are fully licensed and background-checked. Your safety is our top priority.' },
                { icon: Car, title: 'Well-Maintained Fleet', description: 'All our vehicles are regularly serviced and kept in excellent condition for your comfort.' },
                { icon: Clock, title: 'Always On Time', description: 'We value your time and ensure punctual pickup and drop-off for every booking.' },
                { icon: Users, title: 'Friendly Service', description: 'Our professional drivers provide courteous and helpful service on every trip.' },
                { icon: MapPin, title: 'Real-time Tracking', description: 'Track your driver in real-time and know exactly when they\'ll arrive.' },
                { icon: Award, title: 'Customer Focused', description: 'We prioritize customer satisfaction in everything we do.' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                      <Icon className="w-10 h-10 text-blue-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Book?
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
            Get in touch today for a quote or to make a booking.
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

export default Services;
