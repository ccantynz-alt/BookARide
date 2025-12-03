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
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm border border-gold/30 px-6 py-2 rounded-full inline-block mb-6">
              Premium Services
            </span>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-6 tracking-tight">
              Bespoke Transportation
            </h1>
            <p className="text-xl text-white/70 font-light leading-relaxed">
              Comprehensive luxury solutions tailored to meet your distinct travel requirements with unparalleled comfort and reliability.
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
                <Card key={service.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-2xl transition-all duration-500">
                  <CardContent className="p-10">
                    <div className="flex items-start space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-black to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-gold/20">
                        <Icon className="w-10 h-10 text-gold" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-light text-gray-900 mb-4">{service.title}</h3>
                        <p className="text-gray-600 mb-8 font-light leading-relaxed">{service.description}</p>
                        <div className="space-y-4">
                          <h4 className="font-normal text-gray-900 tracking-wide">Premium Features:</h4>
                          {service.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center space-x-3">
                              <Check className="w-5 h-5 text-gold flex-shrink-0" />
                              <span className="text-gray-700 font-light">{feature}</span>
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
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">Our Collection</span>
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Premium Fleet</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light leading-relaxed">
              Choose from our curated selection of luxury vehicles, each meticulously maintained for your comfort
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {fleet.map((vehicle) => (
              <Card key={vehicle.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-500 group">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-14 h-14 bg-black group-hover:bg-gold rounded-lg flex items-center justify-center mb-4 transition-colors duration-300">
                      <Car className="w-7 h-7 text-gold group-hover:text-black transition-colors duration-300" />
                    </div>
                    <h3 className="text-2xl font-light text-gray-900">{vehicle.name}</h3>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm font-light">Capacity:</span>
                      <span className="font-normal text-gray-900 text-sm">{vehicle.capacity}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <span className="text-gray-600 text-sm font-light">Luggage:</span>
                      <span className="font-normal text-gray-900 text-sm">{vehicle.luggage}</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t-2 border-gold/20">
                    <div className="text-3xl font-light text-gold">{vehicle.price}</div>
                    <div className="text-xs text-gray-500 font-light mt-1">Starting rate</div>
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
              <span className="text-gold font-light tracking-[0.3em] uppercase text-sm">The Difference</span>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 mt-4 mb-6">Why Choose Book A Ride NZ?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[
                { icon: Shield, title: 'Uncompromising Safety', description: 'All drivers are extensively vetted, professionally trained, and our vehicles maintained to the highest safety standards.' },
                { icon: Car, title: 'Luxury Fleet', description: 'Travel in supreme comfort with our meticulously maintained collection of premium vehicles equipped with modern amenities.' },
                { icon: Clock, title: 'Absolute Punctuality', description: 'We honor your time. Our commitment to punctuality ensures you arrive exactly when you need to, every time.' },
                { icon: Users, title: 'Bespoke Service', description: 'Every journey is unique. Our dedicated team personalizes each experience to exceed your expectations.' },
                { icon: MapPin, title: 'Real-time Precision', description: 'Advanced tracking technology keeps you informed with exact arrival times and seamless communication.' },
                { icon: Award, title: 'Excellence Assured', description: 'Your satisfaction drives us. Every detail is considered, every ride is an opportunity to exceed expectations.' }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-gradient-to-br from-black to-gray-900 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border-2 border-gold/20">
                      <Icon className="w-10 h-10 text-gold" />
                    </div>
                    <h3 className="text-xl font-light text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm font-light leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6 tracking-tight">
            Ready to Reserve Your Luxury Experience?
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Discover the pinnacle of transportation service. Book now and experience the distinction.
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

export default Services;
