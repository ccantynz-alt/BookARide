import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Briefcase, MapPin, Calendar, Check, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Premium Services
            </h1>
            <p className="text-lg text-gray-600">
              Comprehensive transportation solutions tailored to meet all your travel needs with comfort and reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <Card key={service.id} className="border-2 hover:border-amber-500 hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-8 h-8 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                        <p className="text-gray-600 mb-6">{service.description}</p>
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Features:</h4>
                          {service.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <Check className="w-5 h-5 text-amber-600 flex-shrink-0" />
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Fleet</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Choose from our range of modern, well-maintained vehicles to suit your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {fleet.map((vehicle) => (
              <Card key={vehicle.id} className="border-2 hover:border-amber-500 hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{vehicle.name}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium text-gray-900">{vehicle.capacity}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Luggage:</span>
                      <span className="font-medium text-gray-900">{vehicle.luggage}</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-2xl font-bold text-amber-600">{vehicle.price}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">Why Choose BookaRide?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Professional Drivers', description: 'All our drivers are fully licensed, background-checked, and trained to provide excellent service.' },
                { title: 'Modern Fleet', description: 'Travel in comfort with our well-maintained, clean, and modern vehicles equipped with latest amenities.' },
                { title: '24/7 Availability', description: 'Book a ride anytime, day or night. We\'re always ready to serve you whenever you need us.' },
                { title: 'Competitive Pricing', description: 'Transparent, fair pricing with no hidden charges. Get the best value for your money.' },
                { title: 'Real-time Tracking', description: 'Track your driver in real-time and know exactly when they\'ll arrive at your location.' },
                { title: 'Safe & Secure', description: 'Your safety is our priority. All rides are insured and monitored for your peace of mind.' }
              ].map((item, index) => (
                <div key={index} className="flex space-x-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Book Your Ride?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Experience the best transportation service in New Zealand. Book now and travel with confidence.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-white text-amber-600 hover:bg-gray-100 font-semibold transition-all duration-200">
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
