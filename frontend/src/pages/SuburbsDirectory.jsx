import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import SEO from '../components/SEO';
import { aucklandSuburbs } from '../data/aucklandSuburbs';
import { hamiltonAreas } from '../data/hamiltonAreas';
import { whangareiAreas } from '../data/whangareiAreas';

// Combine all areas
const allAreas = [...aucklandSuburbs, ...hamiltonAreas, ...whangareiAreas];

export const SuburbsDirectory = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group suburbs by city first, then region
  const areasByCity = {
    'Auckland': aucklandSuburbs,
    'Hamilton & Waikato': hamiltonAreas,
    'Whangarei & Northland': whangareiAreas
  };

  // Filter areas based on search
  const filteredAreas = searchTerm
    ? allAreas.filter(area =>
        area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        area.region.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null;

  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title="Auckland Suburbs Airport Shuttle Service | All Areas Covered"
        description="Airport shuttle service covering all Auckland suburbs. Find your suburb and get instant pricing for airport transfers. CBD, North Shore, East, South, West Auckland covered."
        keywords="Auckland suburbs airport shuttle, airport transfer all suburbs, Auckland airport service, suburb airport transport, local airport shuttle"
        canonical="/suburbs"
      />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <MapPin className="w-16 h-16 mx-auto text-gold mb-4" />
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Auckland Suburbs
              <span className="block text-gold mt-2">Airport Shuttle Service</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              We service all Auckland suburbs with reliable airport transfers
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for your suburb..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-6 text-lg bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Suburbs List */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {searchTerm ? (
              // Show search results
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Search Results ({filteredSuburbs.length})
                </h2>
                {filteredSuburbs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSuburbs.map((suburb) => (
                      <Link key={suburb.slug} to={`/suburbs/${suburb.slug}`}>
                        <Card className="border-2 border-gray-200 hover:border-gold transition-all duration-200 hover:shadow-lg h-full">
                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{suburb.name}</h3>
                            <p className="text-sm text-gray-600 mb-4">{suburb.region}</p>
                            <div className="space-y-2 text-sm text-gray-700">
                              <p><span className="font-semibold">Distance:</span> {suburb.distanceToAirport}km</p>
                              <p><span className="font-semibold">From:</span> <span className="text-gold font-bold">${suburb.estimatedPrice}</span></p>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 text-lg">No suburbs found matching "{searchTerm}"</p>
                    <p className="text-gray-500 mt-2">Try a different search term</p>
                  </div>
                )}
              </div>
            ) : (
              // Show grouped by region
              <div className="space-y-12">
                {Object.keys(suburbsByRegion).sort().map((region) => (
                  <div key={region}>
                    <h2 className="text-3xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gold/30">
                      {region}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {suburbsByRegion[region].map((suburb) => (
                        <Link key={suburb.slug} to={`/suburbs/${suburb.slug}`}>
                          <Card className="border-2 border-gray-200 hover:border-gold transition-all duration-200 hover:shadow-lg h-full">
                            <CardContent className="p-6">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{suburb.name}</h3>
                              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{suburb.description}</p>
                              <div className="space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Distance:</span> {suburb.distanceToAirport}km</p>
                                <p><span className="font-semibold">Time:</span> {suburb.estimatedTime}</p>
                                <p><span className="font-semibold">From:</span> <span className="text-gold font-bold">${suburb.estimatedPrice}</span></p>
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
              Don't See Your Suburb?
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              We service all Auckland areas! Contact us for a quote or use our online booking system.
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

export default SuburbsDirectory;
