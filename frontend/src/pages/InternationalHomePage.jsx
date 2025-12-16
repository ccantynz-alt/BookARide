import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, MapPin, CreditCard, Shield, Clock, Star, Plane, Users, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';
import siteConfig from '../config/siteConfig';

const InternationalHomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="New Zealand Airport Transfers & Shuttles - International Visitors | Book A Ride"
        description="Premium airport shuttle service across New Zealand for international travelers. Auckland, Hamilton, Whangarei airport transfers. Multi-currency payments. Book online before you arrive in NZ."
        keywords="New Zealand airport transfer, Auckland airport shuttle, NZ airport transport, international airport pickup, New Zealand travel, tourist shuttle service, Auckland airport to city, New Zealand taxi alternative"
      />

      {/* Hero Section - International Focus */}
      <section className="bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Globe className="w-20 h-20 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
              Welcome to New Zealand!
            </h1>
            <p className="text-2xl md:text-3xl text-blue-100 mb-4 font-semibold">
              Your Reliable Airport Transfer Partner
            </p>
            <p className="text-xl text-blue-200 mb-8">
              Professional shuttle service for international travelers | Auckland, Hamilton, Whangarei & Beyond
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CreditCard className="w-5 h-5" />
                <span>Multi-Currency</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Globe className="w-5 h-5" />
                <span>6 Languages</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span>24/7 Service</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="w-5 h-5" />
                <span>Fully Insured</span>
              </div>
            </div>

            <Button 
              size="lg"
              onClick={() => navigate('/book-now')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-12 py-7 text-lg"
            >
              <Plane className="w-6 h-6 mr-3" />
              Book Your Airport Transfer Now
            </Button>
            <p className="text-sm text-blue-200 mt-4">
              ✓ Instant confirmation  ✓ No hidden fees  ✓ Meet & greet included
            </p>
          </div>
        </div>
      </section>

      {/* Why International Travelers Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why International Travelers Choose Us</h2>
            <p className="text-xl text-gray-600">Trusted by visitors from over 50 countries</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Multi-Currency Payments</h3>
                <p className="text-gray-600 text-sm">
                  Pay in NZD, USD, AUD, GBP, EUR, CNY, or JPY. Real-time currency conversion.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Multilingual Drivers</h3>
                <p className="text-gray-600 text-sm">
                  English, Chinese, Japanese, Korean, Spanish, and French speaking drivers available.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Flight Tracking</h3>
                <p className="text-gray-600 text-sm">
                  We monitor your flight arrival. No extra charge for flight delays.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Tourist-Friendly</h3>
                <p className="text-gray-600 text-sm">
                  Meet & greet service. Assistance with luggage. Local tips and recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Routes for International Visitors */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Popular Routes for International Visitors</h2>
            <p className="text-xl text-gray-600">Direct transfers from Auckland Airport to major destinations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <MapPin className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-xl mb-2">Auckland Airport → City Center</h3>
                <p className="text-gray-600 mb-3">21km • Get Quote</p>
                <p className="text-sm text-gray-600 mb-4">
                  Perfect for hotels in CBD, Viaduct Harbour, or Britomart area.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/book-now')}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <MapPin className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-xl mb-2">Auckland → Rotorua</h3>
                <p className="text-gray-600 mb-3">235km • Get Quote</p>
                <p className="text-sm text-gray-600 mb-4">
                  Direct transfer to the thermal wonderland and Māori cultural center.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/book-now')}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <MapPin className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-xl mb-2">Auckland → Bay of Islands</h3>
                <p className="text-gray-600 mb-3">245km • Get Quote</p>
                <p className="text-sm text-gray-600 mb-4">
                  Visit the stunning 144-island maritime park in Northland.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/book-now')}
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* First Time in New Zealand? */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Star className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-4xl font-bold mb-4">First Time in New Zealand?</h2>
              <p className="text-xl text-gray-600">We make your arrival stress-free</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  What to Expect
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Auckland Airport is modern and well-signposted in English</li>
                  <li>• Free WiFi available throughout the airport</li>
                  <li>• Driver will meet you at arrivals with name sign</li>
                  <li>• Journey to city takes 30-45 minutes</li>
                  <li>• New Zealand drives on the LEFT side</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="font-bold text-xl mb-3 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Our Service Includes
                </h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Meet & greet at arrivals hall</li>
                  <li>• Assistance with luggage</li>
                  <li>• Bottled water in vehicle</li>
                  <li>• Local tips and recommendations</li>
                  <li>• WiFi in vehicle (most vehicles)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* International Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Trusted by International Travelers</h2>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-600">4.9/5 average rating from 2,500+ international guests</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Perfect service for first-time visitors! Driver was punctual, vehicle was clean, 
                  and he gave us great recommendations for our Auckland stay."
                </p>
                <p className="font-semibold">Sarah M.</p>
                <p className="text-sm text-gray-500">United States 🇺🇸</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "非常专业的服务！司机会说中文，让我们感到很舒适。准时接机，车辆干净舒适。强烈推荐！"
                </p>
                <p className="font-semibold">李明</p>
                <p className="text-sm text-gray-500">China 🇨🇳</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">
                  "Excellent service from booking to drop-off. Flight was delayed but driver was 
                  still there waiting. Very professional and friendly."
                </p>
                <p className="font-semibold">James & Emma K.</p>
                <p className="text-sm text-gray-500">United Kingdom 🇬🇧</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <Plane className="w-20 h-20 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Book Before You Arrive in New Zealand
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">
            Secure your airport transfer now and enjoy a stress-free arrival. Instant confirmation via email.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/book-now')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xl px-12 py-7"
          >
            Book Your Transfer Now
          </Button>
          <p className="text-sm mt-4 text-blue-200">
            Free cancellation up to 24 hours before pickup
          </p>
        </div>
      </section>
    </div>
  );
};

export default InternationalHomePage;
