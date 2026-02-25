import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Search, Star } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import SEO from '../components/SEO';
import { cbdHotels, airportHotels } from '../data/aucklandHotels';

const allHotels = [...cbdHotels, ...airportHotels];

export const HotelsDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group hotels by area
  const hotelsByArea = {
    'Auckland CBD Hotels': cbdHotels,
    'Auckland Airport Hotels': airportHotels
  };

  // Filter hotels based on search
  const filteredHotels = searchTerm
    ? allHotels.filter(hotel =>
        hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.area.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title="Auckland Hotels Airport Shuttle Service | CBD & Airport Hotels"
        description="Airport shuttle service for all major Auckland hotels. Door-to-door transfer from CBD hotels and airport hotels. Fixed prices, professional service. Book online 24/7."
        keywords="Auckland hotel shuttle, CBD hotel airport transfer, airport hotel shuttle, hotel to airport Auckland, Auckland accommodation shuttle"
        canonical="/hotels"
      />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Hotel className="w-16 h-16 mx-auto text-gold mb-4" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Auckland Hotels
              <span className="block text-gold mt-2">Airport Shuttle Service</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Professional airport transfers from 20+ Auckland hotels - CBD & Airport area
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for your hotel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-6 text-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hotels List */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {searchTerm ? (
              // Show search results
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Search Results ({filteredHotels.length})
                </h2>
                {filteredHotels.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredHotels.map((hotel) => (
                      <Link key={hotel.slug} to={`/hotels/${hotel.slug}`}>
                        <Card className="border-2 border-gray-200 hover:border-gold transition-all duration-200 hover:shadow-lg h-full">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(hotel.stars)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                              ))}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">{hotel.area}</p>
                            <div className="space-y-2 text-sm text-gray-700">
                              <p><span className="font-semibold">Distance:</span> {hotel.distanceToAirport}km</p>
                              <p><span className="font-semibold">Time:</span> {hotel.estimatedTime}</p>
                              <p><span className="font-semibold">From:</span> <span className="text-gold font-bold">${hotel.estimatedPrice}</span></p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No hotels found matching "{searchTerm}"</p>
                    <p className="text-gray-500 mt-2">Try a different search term</p>
                  </div>
                )}
              </div>
            ) : (
              // Show grouped by area
              <div className="space-y-12">
                {Object.keys(hotelsByArea).map((areaName) => (
                  <div key={areaName}>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gold/30">
                      {areaName}
                      <span className="text-lg text-gray-600 ml-3">({hotelsByArea[areaName].length} hotels)</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {hotelsByArea[areaName].map((hotel) => (
                        <Link key={hotel.slug} to={`/hotels/${hotel.slug}`}>
                          <Card className="border-2 border-gray-200 hover:border-gold transition-all duration-200 hover:shadow-lg h-full">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(hotel.stars)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                                ))}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{hotel.name}</h3>
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{hotel.address}</p>
                              <div className="space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Distance:</span> {hotel.distanceToAirport}km</p>
                                <p><span className="font-semibold">Time:</span> {hotel.estimatedTime}</p>
                                <p><span className="font-semibold">From:</span> <span className="text-gold font-bold">${hotel.estimatedPrice}</span></p>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Don't See Your Hotel?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              We service all Auckland hotels! Contact us for a quote or use our online booking system.
            </p>
            <Link to="/book-now">
              <button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-4 rounded-lg text-lg transition-colors duration-200">
                Get Instant Quote
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HotelsDirectory;
