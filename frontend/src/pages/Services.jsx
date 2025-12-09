import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Briefcase, MapPin, Calendar, Check, ArrowRight, Users, Car, Shield, Clock, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { services, fleet } from '../mock';
import SEO from '../components/SEO';

const iconMap = {
  plane: Plane,
  briefcase: Briefcase,
  'map-pin': MapPin,
  calendar: Calendar
};

export const Services = () => {
  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title="Airport Shuttle Services - Auckland, Hamilton & Whangarei"
        description="Comprehensive airport shuttle services across New Zealand. Auckland airport shuttle, Hamilton airport transfers, Whangarei shuttles, private transfers, cruise ship pickups, and Hobbiton tours. Professional, safe, and reliable shuttle service. Book now!"
        keywords="airport shuttle service, Auckland shuttles, shuttle service, Auckland airport shuttle, Hamilton airport shuttle, Whangarei airport transfer, private shuttle service, airport transportation, corporate shuttle, cruise transfers, Hobbiton transfers, airport pickup service, shuttle service Auckland"
        canonical="/services"
      />
      {/* Professional Hero Section */}
      <section className="py-32 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        {/* Background Vehicle Image */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.pexels.com/photos/7464537/pexels-photo-7464537.jpeg?auto=compress&cs=tinysrgb&w=1920" 
            alt="" 
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.4) blur(1px)' }}
          />
        </div>
        
        {/* Gold accent gradients */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_50%)]" />
        </div>
        <div className="absolute left-0 top-0 w-1/3 h-full bg-gradient-to-r from-gold/10 to-transparent" />
        <div className="absolute right-0 top-0 w-1/3 h-full bg-gradient-to-l from-gold/10 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-6 py-2 mb-8">
              <Award className="w-5 h-5 text-gold" />
              <span className="text-gold font-semibold text-sm tracking-wide">PREMIUM TRANSFER SERVICES</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Our <span className="text-gold">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Professional airport shuttles across New Zealand's North Island
            </p>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-12">
              <div className="text-center">
                <div className="text-4xl font-black text-gold mb-2">4 </div>
                <div className="text-white/70 text-sm">Locations</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-gold mb-2">24/7</div>
                <div className="text-white/70 text-sm">Available</div>
              </div>
              <div className="h-12 w-px bg-white/20"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-gold mb-2">100%</div>
                <div className="text-white/70 text-sm">Reliable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Services - Professional Layout */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Airport <span className="text-gold">Transfers</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional airport shuttle services across New Zealand
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <Card key={service.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-2xl transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Card Header with Icon */}
                    <div className="bg-gradient-to-br from-gray-900 to-black p-8 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32"></div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-16 h-16 bg-gold/20 border-2 border-gold rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-8 h-8 text-gold" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-white">{service.title}</h3>
                      </div>
                    </div>
                    
                    {/* Card Body */}
                    <div className="p-8">
                      <p className="text-gray-600 mb-6 leading-relaxed text-lg">{service.description}</p>
                      
                      <div className="space-y-3 mb-8">
                        <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wide mb-4">What's Included:</h4>
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 bg-gold/20 rounded-full flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-gold" strokeWidth={3} />
                            </div>
                            <span className="text-gray-700 text-sm leading-relaxed">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Link to="/book-now">
                        <Button className="w-full bg-gold hover:bg-yellow-500 text-black font-bold py-6 text-base shadow-lg group-hover:shadow-xl transition-all">
                          Book This Service
                          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Event Services - Professional Design */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-6 py-2 mb-6">
              <Award className="w-5 h-5 text-gold" />
              <span className="text-gold font-bold text-sm tracking-wide">PREMIUM EVENT SERVICES</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6">
              Events & <span className="text-gold">Special Occasions</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Professional group transportation for concerts, corporate events, and celebrations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Corporate Events */}
            <Card className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-8 h-8 text-gold" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Corporate Events</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Impress clients and colleagues with professional group transportation for conferences, meetings, and corporate functions.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Executive-level service',
                    'Professional chauffeurs',
                    'Invoice billing available',
                    'Fleet of 4-11 passenger vehicles',
                    'Punctual & reliable service',
                    'Perfect for team outings'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book-now">
                  <Button className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4">
                    Request Corporate Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Concert Shuttles - Matakana */}
            <Card className="border-2 border-gold hover:border-gold hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white relative">
              <div className="absolute top-4 right-4 bg-gold px-3 py-1 rounded-full z-10">
                <span className="text-black font-bold text-xs">POPULAR</span>
              </div>
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Calendar className="w-8 h-8 text-gold" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Concert Shuttles</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Enjoy concerts at Matakana, Mission Estate, and Villa Maria with safe, reliable transportation. Don't drink and drive!
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Matakana Country Park concerts',
                    'Villa Maria & Mission Estate events',
                    'No drink-driving worries',
                    'Groups of 4-11 passengers',
                    'Late-night return service available',
                    'Door-to-door convenience'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book-now">
                  <Button className="w-full bg-gold hover:bg-yellow-500 text-black font-semibold py-4">
                    Book Concert Shuttle
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sports & Stadium Events */}
            <Card className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-gold" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Stadium Events</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Rugby, cricket, concerts at Eden Park, Mt Smart Stadium, or Western Springs - we'll get you there stress-free!
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Eden Park & Mt Smart Stadium',
                    'Western Springs events',
                    'Skip parking hassles',
                    'Perfect for groups',
                    'Fast drop-off & pickup',
                    'Safe post-event transport'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book-now">
                  <Button className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4">
                    Book Stadium Transfer
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Weddings & Special Occasions */}
            <Card className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Award className="w-8 h-8 text-gold" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Weddings & Celebrations</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Make your special day perfect with elegant transportation for weddings, anniversaries, and milestone celebrations.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Wedding party transport',
                    'Birthday celebrations',
                    'Anniversary events',
                    'Elegant & professional service',
                    'Immaculate vehicles',
                    'Special occasion packages'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book-now">
                  <Button className="w-full bg-gold hover:bg-yellow-500 text-black font-semibold py-4">
                    Request Custom Quote
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Wine Tours */}
            <Card className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <MapPin className="w-8 h-8 text-gold" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Wine Tours</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Explore Waiheke Island, Matakana, or Kumeu wineries without worrying about designated drivers.
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Waiheke Island wine tours',
                    'Matakana & Kumeu wine regions',
                    'Group-friendly vehicles',
                    'Flexible itineraries',
                    'Multiple winery stops',
                    'Full-day or half-day options'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book-now">
                  <Button className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-4">
                    Plan Wine Tour
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Group Outings */}
            <Card className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-black rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-gold" strokeWidth={2} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Group Outings</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Beach trips, shopping expeditions, restaurant tours, or any group activity - we make it easy and fun!
                </p>
                <div className="space-y-3 mb-8">
                  {[
                    'Beach & day trips',
                    'Shopping expeditions',
                    'Restaurant tours',
                    'Theater & cultural events',
                    'Family reunions',
                    'Bachelor/Bachelorette parties'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/book-now">
                  <Button className="w-full bg-gold hover:bg-yellow-500 text-black font-semibold py-4">
                    Book Group Transfer
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Special: Hobbiton Transfers */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block bg-gold text-black text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide mb-4">
                Special Destination
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Hobbiton Movie Set Transfers
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Journey to Middle-earth with our premium Auckland to Hobbiton transfer service
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info Card */}
              <Card className="lg:col-span-2 border-2 border-gold/30 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-10">
                  <div className="flex items-center mb-6">
                    <div className="text-6xl mr-6">🧙‍♂️</div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Experience the Shire</h3>
                      <p className="text-gray-300">175km scenic journey through Waikato countryside</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        <span>Direct door-to-door service</span>
                      </div>
                      <div className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        <span>Flexible pickup times</span>
                      </div>
                      <div className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        <span>Professional drivers</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        <span>Up to 11 passengers</span>
                      </div>
                      <div className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        <span>Return trips available</span>
                      </div>
                      <div className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        <span>Premium comfort</span>
                      </div>
                    </div>
                  </div>

                  <Link to="/hobbiton-transfers">
                    <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-4 w-full sm:w-auto">
                      View Full Details
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Pricing Card */}
              <Card className="border-2 border-gold/30 bg-gradient-to-br from-gold/20 to-gold/5 backdrop-blur">
                <CardContent className="p-10 text-center">
                  <div className="mb-6">
                    <p className="text-gray-300 text-sm mb-2">Estimated Price</p>
                    <p className="text-5xl font-bold text-gold mb-2">$612.50</p>
                    <p className="text-gray-400 text-sm">Base one-way fare</p>
                  </div>
                  
                  <div className="space-y-3 mb-8 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Distance:</span>
                      <span className="text-white font-semibold">175km</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Travel Time:</span>
                      <span className="text-white font-semibold">~2.5 hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Rate:</span>
                      <span className="text-white font-semibold">$3.50/km</span>
                    </div>
                  </div>

                  <Link to="/book-now">
                    <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black w-full py-4">
                      Book Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
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
              <Card key={vehicle.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-gray-900 group-hover:bg-gold rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                      <Car className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-300" />
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
                    <div className="w-20 h-20 bg-gray-900 group-hover:bg-gold rounded-xl flex items-center justify-center mb-6 transition-colors duration-300">
                      <Icon className="w-10 h-10 text-gold group-hover:text-black transition-colors duration-300" />
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
      <section className="py-24 bg-gradient-to-r from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Book?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Get in touch today for a quote or to make a booking.
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

export default Services;
