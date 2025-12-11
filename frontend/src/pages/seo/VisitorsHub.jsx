import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { internationalCountries, getHighPriorityCountries, getCountriesByRegion } from '../../data/international/countries';
import { Plane, Globe, MapPin, ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';

const VisitorsHub = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const highPriority = getHighPriorityCountries();
  
  const regions = [
    { id: 'oceania', name: 'Oceania & Pacific', emoji: '🌏' },
    { id: 'asia', name: 'Asia', emoji: '🌏' },
    { id: 'europe', name: 'Europe', emoji: '🌍' },
    { id: 'americas', name: 'Americas', emoji: '🌎' },
    { id: 'middle-east', name: 'Middle East', emoji: '🌍' },
    { id: 'africa', name: 'Africa', emoji: '🌍' }
  ];

  const filteredCountries = searchTerm 
    ? internationalCountries.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cities.some(city => city.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>International Visitors - Auckland Airport Transfers | BookaRide NZ</title>
        <meta name="description" content="Auckland airport shuttle for international visitors. Pre-book your airport transfer from any country. Door-to-door service, flight monitoring, multilingual support." />
        <meta name="keywords" content="auckland airport transfer international, auckland airport shuttle tourists, new zealand airport transfer, auckland airport taxi booking" />
        <link rel="canonical" href="https://bookaride.co.nz/visitors" />
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Globe className="w-16 h-16 text-gold mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Auckland Airport Transfers for <span className="text-gold">International Visitors</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Welcome to New Zealand! Pre-book your airport shuttle for a hassle-free arrival. 
            We serve visitors from {internationalCountries.length}+ countries worldwide.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your country or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>
        </div>
      </section>

      {/* Search Results */}
      {filteredCountries && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl font-bold mb-4">Search Results ({filteredCountries.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {filteredCountries.map(country => (
                <Link key={country.code} to={`/visitors/${country.slug}`}>
                  <Card className="hover:shadow-lg hover:border-gold transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl">{country.flag}</span>
                      <h3 className="font-medium text-sm mt-2">{country.name}</h3>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Countries */}
      {!searchTerm && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Origins</h2>
              <p className="text-gray-600">Most of our international visitors come from these countries</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {highPriority.map(country => (
                <Link key={country.code} to={`/visitors/${country.slug}`}>
                  <Card className="hover:shadow-lg hover:border-gold transition-all cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <span className="text-5xl block mb-3">{country.flag}</span>
                      <h3 className="font-bold">{country.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{country.nativeName}</p>
                      <p className="text-sm text-gold mt-2">{country.flightTime}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* By Region */}
      {!searchTerm && regions.map(region => {
        const countries = getCountriesByRegion(region.id);
        if (countries.length === 0) return null;
        
        return (
          <section key={region.id} className="py-12 bg-gray-50 border-t">
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <span className="mr-2">{region.emoji}</span> {region.name}
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
                {countries.map(country => (
                  <Link key={country.code} to={`/visitors/${country.slug}`}>
                    <div className="bg-white rounded-lg p-4 text-center hover:shadow-md hover:border-gold border border-transparent transition-all">
                      <span className="text-2xl">{country.flag}</span>
                      <p className="text-xs font-medium mt-1 truncate">{country.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Ready to Book Your Auckland Airport Transfer?
          </h2>
          <p className="text-black/80 mb-8">
            Book online in minutes. We accept all major currencies and payment methods.
          </p>
          <Link to="/book-now">
            <Button size="lg" className="bg-black hover:bg-gray-900 text-white font-bold px-8">
              Book Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VisitorsHub;
