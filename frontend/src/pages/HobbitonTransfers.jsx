import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Star, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';

export const HobbitonTransfers = () => {
  const features = [
    {
      icon: <MapPin className="w-6 h-6 text-gold" />,
      title: "Direct Transfer",
      description: "Door-to-door service from Auckland to Hobbiton Movie Set"
    },
    {
      icon: <Clock className="w-6 h-6 text-gold" />,
      title: "Flexible Timing",
      description: "Choose your preferred pickup time to match your tour booking"
    },
    {
      icon: <Users className="w-6 h-6 text-gold" />,
      title: "Group Friendly",
      description: "Perfect for families, groups, or solo travelers (up to 11 passengers)"
    },
    {
      icon: <Star className="w-6 h-6 text-gold" />,
      title: "Premium Comfort",
      description: "Clean, comfortable vehicles with air conditioning"
    }
  ];

  const highlights = [
    "Professional, experienced drivers",
    "Real-time flight monitoring",
    "Complimentary bottled water",
    "Free Wi-Fi on board",
    "Child seats available (on request)",
    "Luggage assistance included",
    "Flexible cancellation policy",
    "24/7 customer support"
  ];

  return (
    <div className="min-h-screen pt-20">
      <SEO 
        title="Hobbiton Transfers - Auckland to Hobbiton Movie Set Shuttle Service"
        description="Professional Hobbiton Movie Set transfers from Auckland. Direct shuttle service to Matamata Hobbiton tours. Comfortable, scenic journey through Waikato. Book your Hobbiton transfer today - perfect for Lord of the Rings fans!"
        keywords="Hobbiton transfers, Auckland to Hobbiton shuttle, Hobbiton Movie Set transfer, Matamata shuttle, Lord of the Rings tour transport, Hobbiton tour transfer, shuttle to Hobbiton, Auckland Hobbiton transport"
        canonical="/hobbiton-transfers"
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20 overflow-hidden">
        {/* Background Vehicle Image */}
        <div className="absolute inset-0 opacity-15">
          <img 
            src="/shuttle-van.jpg" 
            alt="" 
            className="w-full h-full object-cover object-right"
            style={{ filter: 'brightness(0.4) blur(1px)' }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Hobbiton Movie Set
              <span className="block text-gold mt-2">Transfers from Auckland</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Experience the magic of Middle-earth with our premium transfer service from Auckland to Hobbiton Movie Set in Matamata
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Transfer
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#details">
                <Button variant="outline" className="border-gold text-gold hover:bg-gold/10 px-8 py-6 text-lg">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Our Hobbiton Transfers?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-gray-200 hover:border-gold transition-colors duration-200">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gold/10 rounded-full flex items-center justify-center">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Details Section */}
      <section id="details" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Your Hobbiton Journey
            </h2>
            
            <div className="space-y-8">
              <Card className="border-2 border-gold/30">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <MapPin className="w-6 h-6 text-gold mr-3" />
                    Journey Details
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <p><strong>Distance:</strong> Approximately 175km from Auckland</p>
                    <p><strong>Travel Time:</strong> Around 2.5 hours each way</p>
                    <p><strong>Route:</strong> Scenic drive through Waikato countryside</p>
                    <p><strong>Location:</strong> Hobbiton Movie Set, 501 Buckland Road, Matamata</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-6 h-6 text-gold mr-3" />
                    Recommended Itinerary
                  </h3>
                  <div className="space-y-3 text-gray-700">
                    <div className="flex">
                      <div className="w-32 font-semibold">Morning:</div>
                      <div>Pickup from your Auckland location (7:00 AM - 9:00 AM)</div>
                    </div>
                    <div className="flex">
                      <div className="w-32 font-semibold">Midday:</div>
                      <div>Arrive at Hobbiton for your tour (tour duration: 2 hours)</div>
                    </div>
                    <div className="flex">
                      <div className="w-32 font-semibold">Afternoon:</div>
                      <div>Return journey to Auckland</div>
                    </div>
                    <p className="text-sm text-gray-600 mt-4 italic">
                      * Tour tickets to Hobbiton Movie Set must be booked separately through Hobbiton Tours
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-gold/30">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="w-6 h-6 text-gold mr-3" />
                    What's Included
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-gold mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Transparent Pricing
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Auckland to Hobbiton is approximately 175km. Based on our distance-based pricing:
            </p>
            <Card className="border-2 border-gold/30 mb-8">
              <CardContent className="p-8">
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Estimated Base Price</p>
                  <p className="text-5xl font-bold text-gold mb-2">$612.50</p>
                  <p className="text-sm text-gray-600">175km × $3.50/km (100-300km rate)</p>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-3">Additional Options:</p>
                    <div className="space-y-2 text-gray-700">
                      <p>• Extra passengers: $5 per person (1st included)</p>
                      <p>• VIP Airport Pickup: +$15 (parking close to door eleven)</p>
                      <p>• Return trip: 2× one-way price</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
                Get Exact Quote & Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              What Our Hobbiton Travelers Say
            </h2>
            <p className="text-gray-300 text-center mb-12">
              Join hundreds of satisfied customers who've experienced the magic of Middle-earth with us
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/10 border-gold/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-white mb-4 italic">
                    "Best decision we made! The driver was so knowledgeable about LOTR and the route was scenic. Made our Hobbiton experience even more magical!"
                  </p>
                  <p className="text-gold font-semibold">Emma & James</p>
                  <p className="text-gray-400 text-sm">Auckland → Hobbiton</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-gold/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-white mb-4 italic">
                    "Punctual, professional, and the vehicle was spotless. We were able to relax and enjoy the beautiful Waikato scenery. Highly recommend!"
                  </p>
                  <p className="text-gold font-semibold">David L.</p>
                  <p className="text-gray-400 text-sm">International Traveller</p>
                </CardContent>
              </Card>

              <Card className="bg-white/10 border-gold/30 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-white mb-4 italic">
                    "Perfect for our family of 5! Comfortable ride, friendly driver, and we arrived right on time for our Hobbiton tour. Worth every penny!"
                  </p>
                  <p className="text-gold font-semibold">Sarah M.</p>
                  <p className="text-gray-400 text-sm">Family of 5</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Travel Tips for Your Hobbiton Visit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">What to Bring</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Camera for amazing photos</li>
                    <li>• Comfortable walking shoes</li>
                    <li>• Sunscreen and sunglasses</li>
                    <li>• Light jacket (weather can change)</li>
                    <li>• Your Hobbiton tour tickets</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Good to Know</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Book Hobbiton tours in advance (popular!)</li>
                    <li>• Tours run rain or shine</li>
                    <li>• Green Dragon Inn serves food & drinks</li>
                    <li>• Gift shop available on-site</li>
                    <li>• Allow 4-5 hours total trip time</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready for Your Middle-earth Adventure?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Book your Hobbiton transfer today and experience the magic of the Shire
          </p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
              Book Your Hobbiton Transfer Now
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

export default HobbitonTransfers;
