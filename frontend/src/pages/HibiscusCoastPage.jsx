import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Users, Clock } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import SEO from '../components/SEO';
import { hibiscusCoastSuburbs } from '../data/hibiscusCoastSuburbs';

const HibiscusCoastPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <SEO
        title="Hibiscus Coast Airport Shuttle Service - Orewa, Whangaparāoa & More | Book A Ride"
        description="Premium airport shuttle service covering all Hibiscus Coast suburbs including Orewa, Whangaparāoa, Gulf Harbour, Red Beach, and more. Fixed prices, professional drivers, 24/7 service to Auckland Airport."
        keywords="Hibiscus Coast airport shuttle, Orewa airport transfer, Whangaparāoa airport shuttle, Gulf Harbour airport transfer, Red Beach shuttle, Silverdale airport transport"
        canonical="/hibiscus-coast"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Hibiscus Coast Airport Shuttle Service
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Premium door-to-door transfers from Orewa, Whangaparāoa, Gulf Harbour & all Hibiscus Coast suburbs to Auckland Airport
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>24/7 Service</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>Fixed Prices</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Professional Drivers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Reliable Airport Shuttles Across the Hibiscus Coast
          </h2>
          <div className="prose prose-lg max-w-none text-gray-700 space-y-4">
            <p>
              The Hibiscus Coast is one of Auckland's most beautiful regions, stretching from Silverdale to the stunning Whangaparāoa Peninsula. Whether you're traveling from the vibrant town center of Orewa, the luxury marina at Gulf Harbour, or the peaceful beaches of Red Beach and Stanmore Bay, we provide reliable, comfortable airport shuttle services to Auckland Airport.
            </p>
            <p>
              Our professional drivers know the Hibiscus Coast intimately - from the fastest routes during peak times to the scenic coastal roads. We serve all suburbs including Orewa, Whangaparāoa, Silverdale, Red Beach, Stanmore Bay, Gulf Harbour, Arkles Bay, Army Bay, Manly, Millwater, Hatfields Beach, Waiwera, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Suburbs Grid */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-12">
          Airport Shuttle Service by Suburb
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {hibiscusCoastSuburbs.map((suburb) => (
            <Card 
              key={suburb.slug}
              className="hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/suburbs/${suburb.slug}`)}
            >
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {suburb.name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{suburb.distance}km to Airport</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-semibold text-gold">Get Quote</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {suburb.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/suburbs/${suburb.slug}`);
                  }}
                >
                  View Details & Book
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose Our Hibiscus Coast Shuttle Service?
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-blue-600">Local Expertise</h3>
                <p className="text-gray-700">
                  Our drivers live and work on the Hibiscus Coast. They know the best routes, avoid traffic hotspots, and understand local landmarks to ensure smooth pickups.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-blue-600">Fixed Pricing</h3>
                <p className="text-gray-700">
                  No surge pricing, no surprises. You'll know the exact cost before you book, whether you're traveling from Orewa or Gulf Harbour.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-blue-600">24/7 Availability</h3>
                <p className="text-gray-700">
                  Early morning flights or late night arrivals - we're available around the clock to serve all Hibiscus Coast residents.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-bold mb-3 text-blue-600">Comfort & Safety</h3>
                <p className="text-gray-700">
                  Clean, well-maintained vehicles with ample luggage space. Professional drivers with excellent safety records and local knowledge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Areas Highlight */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Covering Every Corner of the Hibiscus Coast
          </h2>
          <div className="bg-blue-50 p-8 rounded-lg">
            <div className="grid md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <h4 className="font-bold text-lg mb-3 text-blue-700">Main Towns & Suburbs:</h4>
                <ul className="space-y-2">
                  <li>✓ Orewa - Town Center & Beach</li>
                  <li>✓ Whangaparāoa Peninsula</li>
                  <li>✓ Gulf Harbour Marina</li>
                  <li>✓ Silverdale & Millwater</li>
                  <li>✓ Red Beach & Stanmore Bay</li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-lg mb-3 text-blue-700">Coastal Communities:</h4>
                <ul className="space-y-2">
                  <li>✓ Arkles Bay & Army Bay</li>
                  <li>✓ Manly & Hatfields Beach</li>
                  <li>✓ Waiwera & Wenderholm</li>
                  <li>✓ Stillwater</li>
                  <li>✓ All surrounding areas</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Book Your Hibiscus Coast Airport Shuttle?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get instant online booking with fixed prices and guaranteed service
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/book-now')}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
          >
            Book Now - Instant Confirmation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HibiscusCoastPage;
