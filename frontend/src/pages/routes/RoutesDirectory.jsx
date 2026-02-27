import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { MapPin, Clock, DollarSign, ArrowRight } from 'lucide-react';

const routes = [
  {
    slug: 'auckland-cbd-to-airport',
    from: 'Auckland CBD',
    to: 'Auckland Airport',
    duration: '25-35 min',
    price: 'Get Quote',
    popular: true
  },
  {
    slug: 'north-shore-to-airport',
    from: 'North Shore',
    to: 'Auckland Airport',
    duration: '35-50 min',
    price: 'Get Quote',
    popular: true
  },
  {
    slug: 'south-auckland-to-airport',
    from: 'South Auckland',
    to: 'Auckland Airport',
    duration: '10-20 min',
    price: 'Get Quote',
    popular: false
  },
  {
    slug: 'west-auckland-to-airport',
    from: 'West Auckland',
    to: 'Auckland Airport',
    duration: '30-45 min',
    price: 'Get Quote',
    popular: false
  },
  {
    slug: 'east-auckland-to-airport',
    from: 'East Auckland',
    to: 'Auckland Airport',
    duration: '25-40 min',
    price: 'Get Quote',
    popular: false
  },
  {
    slug: 'hibiscus-coast-to-airport',
    from: 'Hibiscus Coast',
    to: 'Auckland Airport',
    duration: '50-70 min',
    price: 'Get Quote',
    popular: true
  }
];

const RoutesDirectory = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Auckland Airport Shuttle Routes | All Areas Covered | BookaRide</title>
        <meta name="description" content="Auckland airport shuttle routes covering all areas. CBD, North Shore, South Auckland, West Auckland, East Auckland & Hibiscus Coast to Auckland Airport." />
        <link rel="canonical" href="https://bookaride.co.nz/routes" />
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Auckland Airport <span className="text-gold">Shuttle Routes</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Door-to-door airport transfers from anywhere in Auckland. Fixed pricing, no hidden fees.
          </p>
        </div>
      </section>

      {/* Routes Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <Link key={route.slug} to={`/routes/${route.slug}`}>
                <Card className="hover:shadow-lg hover:border-gold transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    {route.popular && (
                      <span className="bg-gold text-black text-xs font-bold px-2 py-1 rounded mb-4 inline-block">
                        POPULAR
                      </span>
                    )}
                    <h2 className="text-xl font-bold mb-2">
                      {route.from} <span className="text-gold">→</span> {route.to}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> {route.duration}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" /> {route.price}
                      </span>
                    </div>
                    <span className="text-gold font-medium flex items-center">
                      View Route Details <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Don't See Your Area?
          </h2>
          <p className="text-black/80 mb-8">
            We cover ALL of Auckland. Get an instant quote for your specific address.
          </p>
          <Link to="/book-now">
            <Button size="lg" className="bg-black hover:bg-gray-900 text-white font-bold px-8">
              Get a Quote
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoutesDirectory;
