import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { 
  Clock, MapPin, DollarSign, Car, Calendar, Phone,
  CheckCircle, Star, ArrowRight, Shield
} from 'lucide-react';

// Route data
const routes = {
  'auckland-cbd-to-airport': {
    from: 'Auckland CBD',
    to: 'Auckland Airport',
    distance: '21 km',
    duration: '25-35 minutes',
    price: 'Get Quote',
    description: 'The most popular airport transfer route in Auckland. From the city center including Sky Tower, Viaduct Harbour, and Queen Street direct to Auckland Airport.',
    highlights: ['Sky Tower pickup', 'Viaduct Harbour', 'Queen Street', 'Britomart Transport Centre'],
    tips: 'Peak hour traffic can add 15-20 minutes. We recommend allowing extra time for morning flights.'
  },
  'north-shore-to-airport': {
    from: 'North Shore',
    to: 'Auckland Airport',
    distance: '28-35 km',
    duration: '35-50 minutes',
    price: 'Get Quote',
    description: 'Covering all North Shore suburbs including Takapuna, Albany, Browns Bay, and the Hibiscus Coast. Door-to-door service across the Harbour Bridge.',
    highlights: ['Takapuna', 'Albany', 'Browns Bay', 'Milford', 'Devonport', 'Glenfield'],
    tips: 'Harbour Bridge traffic varies. Early morning flights may require earlier pickup times.'
  },
  'south-auckland-to-airport': {
    from: 'South Auckland',
    to: 'Auckland Airport',
    distance: '8-15 km',
    duration: '10-20 minutes',
    price: 'Get Quote',
    description: 'The quickest route to the airport. Covering Manukau, Papatoetoe, Otahuhu, and surrounding areas. Perfect for last-minute bookings.',
    highlights: ['Manukau', 'Papatoetoe', 'Otahuhu', 'Mangere', 'Otara'],
    tips: 'Closest suburbs to the airport with the shortest transfer times.'
  },
  'west-auckland-to-airport': {
    from: 'West Auckland',
    to: 'Auckland Airport',
    distance: '25-35 km',
    duration: '30-45 minutes',
    price: 'Get Quote',
    description: 'Serving Henderson, New Lynn, Te Atatu, and all Western suburbs. Scenic route with reliable service.',
    highlights: ['Henderson', 'New Lynn', 'Te Atatu', 'Glen Eden', 'Titirangi', 'Waitakere'],
    tips: 'Northwestern motorway provides quick access. Evening pickups are often faster.'
  },
  'east-auckland-to-airport': {
    from: 'East Auckland',
    to: 'Auckland Airport',
    distance: '20-30 km',
    duration: '25-40 minutes',
    price: 'Get Quote',
    description: 'Covering Howick, Pakuranga, Botany, and Eastern Beaches. Beautiful coastal suburbs with direct airport access.',
    highlights: ['Howick', 'Pakuranga', 'Botany', 'Half Moon Bay', 'Bucklands Beach', 'Flat Bush'],
    tips: 'Southern motorway access makes this a reliable route with consistent times.'
  },
  'hibiscus-coast-to-airport': {
    from: 'Hibiscus Coast',
    to: 'Auckland Airport',
    distance: '45-55 km',
    duration: '50-70 minutes',
    price: 'Get Quote',
    description: 'Serving Orewa, Whangaparaoa, Silverdale, and Gulf Harbour. The scenic northern gateway to Auckland.',
    highlights: ['Orewa', 'Whangaparaoa', 'Silverdale', 'Gulf Harbour', 'Red Beach', 'Stanmore Bay'],
    tips: 'Allow extra time for this longer journey. Popular for early morning international flights.'
  }
};

const RoutePage = () => {
  const { routeSlug } = useParams();
  const route = routes[routeSlug];

  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Route not found</h1>
          <Link to="/" className="text-gold hover:underline">Return to homepage</Link>
        </div>
      </div>
    );
  }

  const pageTitle = `${route.from} to ${route.to} Shuttle | BookaRide NZ`;
  const pageDescription = `${route.from} to Auckland Airport shuttle service. ${route.duration} journey, ${route.price}. Door-to-door transfers, fixed pricing, 24/7 service.`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    'serviceType': 'Airport Shuttle',
    'name': `${route.from} to ${route.to} Shuttle`,
    'description': route.description,
    'provider': {
      '@type': 'LocalBusiness',
      'name': 'BookaRide NZ',
      
    },
    'areaServed': {
      '@type': 'City',
      'name': route.from
    },
    'offers': {
      '@type': 'AggregateOffer',
      'priceCurrency': 'NZD',
      'availability': 'https://schema.org/InStock',
      'url': 'https://bookaride.co.nz/book-now'
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={`${route.from.toLowerCase()} to airport, ${route.from.toLowerCase()} airport shuttle, ${route.from.toLowerCase()} airport transfer, auckland airport shuttle ${route.from.toLowerCase()}`} />
        <link rel="canonical" href={`https://bookaride.co.nz/routes/${routeSlug}`} />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4 mr-2" />
              Popular Route
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {route.from} <span className="text-gold">→</span> {route.to}
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              {route.description}
            </p>
            
            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-lg">
                <MapPin className="w-5 h-5 text-gold mr-2" />
                <span>{route.distance}</span>
              </div>
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-gold mr-2" />
                <span>{route.duration}</span>
              </div>
              <div className="flex items-center bg-white/10 px-4 py-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-gold mr-2" />
                <span>{route.price}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-bold px-8">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book This Route
                </Button>
              </Link>
              <a href="/book-now">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Phone className="w-5 h-5 mr-2" />
                  Book Online
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Suburbs Covered */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Suburbs & Areas We Cover</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {route.highlights.map((suburb, index) => (
              <span key={index} className="bg-gray-100 px-4 py-2 rounded-full text-gray-700 font-medium">
                {suburb}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Clock, title: '24/7 Service', desc: 'Available for all flights' },
              { icon: Shield, title: 'Fixed Price', desc: 'No surge or hidden fees' },
              { icon: Car, title: 'Door-to-Door', desc: 'Pickup from your address' },
              { icon: Star, title: 'Professional', desc: 'Licensed drivers' }
            ].map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-10 h-10 text-gold mx-auto mb-4" />
                  <h3 className="font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Travel Tip */}
      <section className="py-12 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                Travel Tip for This Route
              </h3>
              <p className="text-gray-600">{route.tips}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Other Routes */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Other Popular Routes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(routes)
              .filter(([slug]) => slug !== routeSlug)
              .slice(0, 3)
              .map(([slug, r]) => (
                <Link key={slug} to={`/routes/${slug}`}>
                  <Card className="hover:shadow-lg hover:border-gold transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      <h3 className="font-bold mb-2">{r.from} → {r.to}</h3>
                      <p className="text-gray-500 text-sm mb-4">{r.duration} • {r.price}</p>
                      <span className="text-gold text-sm flex items-center">
                        View Route <ArrowRight className="w-4 h-4 ml-1" />
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
            Book Your {route.from} Airport Transfer
          </h2>
          <p className="text-black/80 mb-8">
            {route.duration} • {route.price} • Door-to-door service
          </p>
          <Link to="/book-now">
            <Button size="lg" className="bg-black hover:bg-gray-900 text-white font-bold px-8">
              Book Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RoutePage;
