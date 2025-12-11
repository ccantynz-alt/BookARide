import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getCountryBySlug } from '../../data/international/countries';
import { 
  Plane, Clock, MapPin, Users, Shield, Star, CheckCircle, 
  Phone, Globe, Calendar, ArrowRight, CreditCard 
} from 'lucide-react';

const GlobalLanding = () => {
  const { countrySlug } = useParams();
  const country = getCountryBySlug(countrySlug);

  if (!country) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Country not found</h1>
          <Link to="/" className="text-gold hover:underline">Return to homepage</Link>
        </div>
      </div>
    );
  }

  const pageTitle = `${country.name} to Auckland Airport Transfers | BookaRide NZ`;
  const pageDescription = `Flying from ${country.name} to Auckland? Book your airport shuttle in advance. Door-to-door transfers, fixed pricing, 24/7 service. ${country.flightTime} flight time.`;

  // Schema for international visitors
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Airport Transfer Service',
    'name': `Auckland Airport Transfers for ${country.name} Visitors`,
    'description': pageDescription,
    'provider': {
      '@type': 'LocalBusiness',
      'name': 'BookaRide NZ',
      'telephone': '+64 21 743 321'
    },
    'areaServed': {
      '@type': 'City',
      'name': 'Auckland'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${country.name} to Auckland, Auckland airport transfer ${country.name}, Auckland shuttle ${country.name} visitors, ${country.cities.join(', ')} to Auckland airport`} />
        <link rel="canonical" href={`https://bookaride.co.nz/visitors/${country.slug}`} />
        
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://bookaride.co.nz/visitors/${country.slug}`} />
        
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black text-white py-20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-6xl mb-4">{country.flag}</div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Auckland Airport Transfers for <span className="text-gold">{country.name}</span> Visitors
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4">
              {country.nativeName !== country.name && (
                <span className="block text-gold mb-2">{country.nativeName}</span>
              )}
              Flying from {country.cities.slice(0, 3).join(', ')}? Pre-book your Auckland airport shuttle 
              for a stress-free arrival. Door-to-door service across Auckland.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 mb-8">
              <span className="flex items-center"><Plane className="w-4 h-4 mr-1" /> {country.flightTime} flight</span>
              <span className="flex items-center"><Globe className="w-4 h-4 mr-1" /> {country.timezone}</span>
              <span className="flex items-center"><CreditCard className="w-4 h-4 mr-1" /> {country.currencySymbol} accepted</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-bold px-8 py-6 text-lg">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Your Transfer
                </Button>
              </Link>
              <a href="tel:+6421743321">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  <Phone className="w-5 h-5 mr-2" />
                  +64 21 743 321
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Pre-Book Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Pre-Book Your Auckland Airport Transfer from {country.name}?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Skip the taxi queues and uncertainty. Have your professional driver waiting for you.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: 'Flight Monitoring', desc: 'We track your flight and adjust pickup times automatically' },
              { icon: Shield, title: 'Fixed Pricing', desc: `Pay in ${country.currency} - no surge pricing or surprises` },
              { icon: Users, title: 'Meet & Greet', desc: 'Driver waiting with name sign at arrivals' },
              { icon: Star, title: 'Multilingual', desc: 'Drivers speak English, and we support multiple languages' }
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <feature.icon className="w-10 h-10 text-gold mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Popular Routes from {country.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {country.popularRoutes.map((route, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Plane className="w-8 h-8 text-gold mb-4" />
                  <h3 className="font-bold text-lg mb-2">{route}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Flight time: {country.flightTime}
                  </p>
                  <Link to="/book-now" className="text-gold hover:underline flex items-center text-sm font-medium">
                    Book Transfer <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Info */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Travel Information for {country.name} Visitors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-gold" /> Visa Information
                </h3>
                <p className="text-gray-600">{country.visaInfo}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Plane className="w-5 h-5 mr-2 text-gold" /> Travel Tips
                </h3>
                <p className="text-gray-600">{country.travelTips}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Auckland Destinations */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Popular Auckland Destinations</h2>
            <p className="text-gray-400">We can take you anywhere in Auckland from the airport</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              'Auckland CBD', 'Sky Tower', 'North Shore', 'Takapuna Beach',
              'Mission Bay', 'Ponsonby', 'Newmarket', 'Viaduct Harbour',
              'Mt Eden', 'Devonport', 'Waiheke Ferry', 'Queen Street'
            ].map((place, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-4 text-center hover:bg-gold hover:text-black transition-colors cursor-pointer">
                <MapPin className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium">{place}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Welcome to New Zealand! {country.flag}
          </h2>
          <p className="text-black/80 mb-8 text-lg">
            Book your Auckland airport transfer now and start your NZ adventure stress-free.
          </p>
          <Link to="/book-now">
            <Button size="lg" className="bg-black hover:bg-gray-900 text-white font-bold px-8">
              Book Your Airport Transfer
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GlobalLanding;
