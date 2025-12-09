import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Ship, CheckCircle, ArrowRight, Plane, Navigation, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';

export const CruiseTransfers = () => {
  const pickupLocations = [
    {
      icon: <Ship className="w-8 h-8 text-gold" />,
      title: "Downtown Ferry Terminal",
      location: "Auckland Ferry Terminal Building",
      description: "Direct pickup from the cruise ship terminal",
      address: "Queens Wharf, Auckland CBD"
    },
    {
      icon: <Plane className="w-8 h-8 text-gold" />,
      title: "Auckland International Airport",
      location: "AKL International Terminal",
      description: "Meet & greet at arrivals hall",
      address: "Airport with VIP pickup option"
    },
    {
      icon: <Navigation className="w-8 h-8 text-gold" />,
      title: "Auckland Domestic Airport",
      location: "AKL Domestic Terminal",
      description: "Seamless connection to your cruise",
      address: "Quick transfers to cruise terminal"
    }
  ];

  const features = [
    {
      icon: <Clock className="w-6 h-6 text-gold" />,
      title: "On-Time Guarantee",
      description: "We track cruise schedules and flights to ensure timely pickups"
    },
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: "Luggage Assistance",
      description: "Help with bags and cruise luggage - we've got you covered"
    },
    {
      icon: <Ship className="w-6 h-6 text-gold" />,
      title: "Cruise Specialist",
      description: "Experienced with cruise passenger transfers and tight schedules"
    },
    {
      icon: <MapPin className="w-6 h-6 text-gold" />,
      title: "Direct Routes",
      description: "Fastest routes between airport, ferry terminal, and your accommodation"
    }
  ];

  const highlights = [
    "Meet & greet service at all pickup points",
    "Real-time flight & cruise tracking",
    "Luggage assistance included",
    "Child seats available (on request)",
    "Comfortable, air-conditioned vehicles",
    "Professional, friendly drivers",
    "Flexible booking & cancellation",
    "24/7 customer support"
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEO 
        title="Cruise Ship Transfers Auckland - Port & Airport Shuttle Service"
        description="Professional cruise ship transfer service in Auckland. Shuttle between cruise terminals, airport, and hotels. Reliable transport for cruise passengers. Luggage assistance, on-time guarantee. Book your cruise transfer today!"
        keywords="cruise ship transfers Auckland, cruise terminal shuttle, port transfer Auckland, cruise ship airport shuttle, Auckland cruise transfer, ferry terminal shuttle, cruise passenger transport, ship to airport shuttle"
        canonical="/cruise-transfers"
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20 overflow-hidden">
        {/* Background Vehicle Image */}
        <div className="absolute inset-0 opacity-15">
          <img 
            src="/shuttle-van.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.4) blur(1px)' }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4">
              <Ship className="w-16 h-16 mx-auto text-gold mb-4" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Auckland Cruise Ship
              <span className="block text-gold mt-2">Transfer Services</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Seamless transfers between airports, downtown ferry terminal, and your accommodation for cruise passengers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Transfer
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#locations">
                <Button variant="outline" className="border-gold text-gold hover:bg-gold/10 px-8 py-6 text-lg">
                  View Pickup Locations
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Your Cruise Transfer Experience
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            See our professional shuttle service in action at Auckland's cruise terminal
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Image 1 - Van with Cruise Ship */}
            <Card className="border-2 border-gold/30 overflow-hidden hover:border-gold transition-colors duration-200">
              <div className="relative h-80 overflow-hidden">
                <img 
                  src="/cruise-van-ship.jpg" 
                  alt="Book A Ride shuttle van at Auckland cruise terminal with cruise ship in background" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h3 className="text-white font-bold text-xl mb-1">Our Fleet at Your Service</h3>
                  <p className="text-gray-200 text-sm">Professional shuttle service ready at the cruise terminal</p>
                </div>
              </div>
            </Card>

            {/* Image 2 - Pacific Aria Cruise Ship */}
            <Card className="border-2 border-gold/30 overflow-hidden hover:border-gold transition-colors duration-200">
              <div className="relative h-80 overflow-hidden">
                <img 
                  src="/cruise-ship-pacific-aria.jpg" 
                  alt="Pacific Aria cruise ship docked at Auckland port" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                  <h3 className="text-white font-bold text-xl mb-1">Auckland Cruise Terminal</h3>
                  <p className="text-gray-200 text-sm">Serving major cruise lines including P&O, Royal Caribbean, and more</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Pickup Locations */}
      <section id="locations" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Three Convenient Pickup Points
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Whether you're arriving by air or sea, we'll meet you at the most convenient location
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pickupLocations.map((location, index) => (
              <Card key={index} className="border-2 border-gold/30 hover:border-gold transition-colors duration-200">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
                    {location.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{location.title}</h3>
                  <p className="text-gold font-semibold mb-2">{location.location}</p>
                  <p className="text-gray-600 text-sm mb-2">{location.description}</p>
                  <p className="text-gray-500 text-xs">{location.address}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Cruise Transfer Service?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:border-gold transition-colors duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Common Routes */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Popular Cruise Transfer Routes
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-gold/30">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-gold/10 p-3 rounded-lg mr-4">
                      <Plane className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Airport → Cruise Terminal</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Direct transfer from Auckland Airport (Domestic or International) to Downtown Ferry Terminal
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700"><strong>Distance:</strong> ~26km</p>
                        <p className="text-gray-700"><strong>Time:</strong> 25-35 minutes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-gold/10 p-3 rounded-lg mr-4">
                      <Ship className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Cruise Terminal → Airport</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Timely transfer from Downtown Ferry Terminal to Auckland Airport for your departure flight
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700"><strong>Distance:</strong> ~26km</p>
                        <p className="text-gray-700"><strong>Time:</strong> 25-35 minutes</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-gold/10 p-3 rounded-lg mr-4">
                      <MapPin className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Airport → Hotel → Terminal</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Multi-stop service: Airport to your accommodation, then to cruise terminal next day
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700"><strong>Service:</strong> Two separate trips</p>
                        <p className="text-gray-700"><strong>Flexibility:</strong> Book both at once</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-6">
                  <div className="flex items-start mb-4">
                    <div className="bg-gold/10 p-3 rounded-lg mr-4">
                      <Users className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Group Cruise Transfers</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        Perfect for families or groups traveling together (up to 11 passengers)
                      </p>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-700"><strong>Capacity:</strong> Up to 11 passengers</p>
                        <p className="text-gray-700"><strong>Service:</strong> Contact for quote</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              What's Included in Your Transfer
            </h2>
            <Card className="border-2 border-gold/30">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {highlights.map((highlight, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-gold mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{highlight}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Cruise Transfer Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Before Your Cruise</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Book transfer in advance for guaranteed service</li>
                    <li>• Provide flight/cruise details for tracking</li>
                    <li>• Allow extra time during peak cruise season</li>
                    <li>• Confirm pickup time 24 hours before</li>
                    <li>• Have cruise terminal address handy</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">After Your Cruise</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Note your disembarkation time</li>
                    <li>• Allow 1-2 hours for customs clearance</li>
                    <li>• Meet at designated pickup point</li>
                    <li>• Driver will track cruise arrival times</li>
                    <li>• Book airport transfer with buffer time</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white relative overflow-hidden">
        {/* Background Vehicle Image */}
        <div className="absolute inset-0 opacity-10">
          <img 
            src="/shuttle-van.jpg" 
            alt="" 
            className="w-full h-full object-cover object-center"
            style={{ filter: 'brightness(0.4) blur(1px)' }}
          />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Book Your Cruise Transfer?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Stress-free transfers for cruise passengers - from airport to ship and back
          </p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
              Book Your Cruise Transfer Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-gray-400 mt-6">
            Questions? Call us or check our <Link to="/contact" className="text-gold hover:underline">Contact page</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default CruiseTransfers;
