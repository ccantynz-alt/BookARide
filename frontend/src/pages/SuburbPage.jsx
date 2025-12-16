import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { aucklandSuburbs } from '../data/aucklandSuburbs';
import { hamiltonAreas } from '../data/hamiltonAreas';
import { whangareiAreas } from '../data/whangareiAreas';
import { hibiscusCoastSuburbs } from '../data/hibiscusCoastSuburbs';

// Combine all areas
const allAreas = [...aucklandSuburbs, ...hamiltonAreas, ...whangareiAreas, ...hibiscusCoastSuburbs];

export const SuburbPage = () => {
  const { slug } = useParams();
  const suburb = allAreas.find(s => s.slug === slug);

  // If suburb not found, redirect to home
  if (!suburb) {
    return <Navigate to="/" replace />;
  }

  const benefits = [
    'Fixed price - no surge pricing',
    'Professional, licensed drivers',
    'Clean, comfortable vehicles',
    '24/7 service available',
    'Flight tracking included',
    'Meet & greet service',
    'Luggage assistance',
    'Child seats available'
  ];

  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title={`Airport Shuttle ${suburb.name} Auckland | Book A Ride NZ`}
        description={`Affordable airport shuttle from ${suburb.name} to Auckland Airport. Professional drivers, instant online quotes. 24/7 service. Book online now!`}
        keywords={`${suburb.name} airport shuttle, ${suburb.name} to airport, airport transfer ${suburb.name}, shuttle service ${suburb.name}, ${suburb.name} airport transport, cheap shuttle ${suburb.name}, Auckland airport ${suburb.name}}`}
        canonical={`/suburbs/${slug}`}
      />
      <StructuredData 
        type="suburb" 
        data={{
          suburb: {
            name: suburb.name,
            slug: suburb.slug,
            price: suburb.estimatedPrice
          },
          breadcrumb: [
            { name: 'Home', path: '/' },
            { name: 'Suburbs', path: '/suburbs' },
            { name: suburb.name, path: `/suburbs/${slug}` }
          ]
        }} 
      />

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.15),transparent_50%)]" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-4">
              <MapPin className="w-12 h-12 mx-auto text-gold" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Airport Shuttle Service
              <span className="block text-gold mt-2">{suburb.name}</span>
            </h1>
            <p className="text-xl text-gray-300 mb-4">
              {suburb.description}
            </p>
            <p className="text-lg text-white/80 mb-8">
              Reliable airport transfers from {suburb.name} to Auckland Airport
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Ride Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Cards */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 border-gold/30 hover:border-gold transition-colors duration-200">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Distance to Airport</h3>
                <p className="text-3xl font-bold text-gold mb-2">{suburb.distanceToAirport} km</p>
                <p className="text-sm text-gray-600">From {suburb.name}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/30 hover:border-gold transition-colors duration-200">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Estimated Time</h3>
                <p className="text-2xl font-bold text-gold mb-2">{suburb.estimatedTime}</p>
                <p className="text-sm text-gray-600">Typical journey time</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/30 hover:border-gold transition-colors duration-200">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Your Price</h3>
                <p className="text-2xl font-bold text-gold mb-2">Instant Quote</p>
                <p className="text-sm text-gray-600">Get accurate pricing online</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About the Service */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Airport Shuttle from {suburb.name}
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>
                Looking for a reliable and affordable airport shuttle from <strong>{suburb.name}</strong> to Auckland Airport? 
                Book A Ride NZ offers professional airport transfer services with fixed pricing and no hidden fees.
              </p>
              <p>
                Located in {suburb.city}, {suburb.region}, {suburb.name} is approximately {suburb.distanceToAirport}km from Auckland International Airport. 
                Our experienced drivers know the best routes and will get you there comfortably in around {suburb.estimatedTime}, 
                depending on traffic conditions.
              </p>
              <p>
                Whether you're a local resident heading out on holiday, a business traveler, or an international visitor 
                staying in {suburb.name}, we provide door-to-door service with professional drivers and comfortable vehicles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Landmarks */}
      {suburb.landmarks && suburb.landmarks.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                We Service All Areas in {suburb.name}
              </h2>
              <p className="text-gray-700 mb-6">
                Our airport shuttle service covers the entire {suburb.name} area, including pickups near these popular locations:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {suburb.landmarks.map((landmark, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{landmark}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Why Choose Our {suburb.name} Airport Shuttle?
            </h2>
            <Card className="border-2 border-gold/30">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Nearby Areas */}
      {suburb.nearbyAreas && suburb.nearbyAreas.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nearby Suburbs We Service
              </h2>
              <p className="text-gray-700 mb-6">
                We also provide airport shuttle services to these nearby areas:
              </p>
              <div className="flex flex-wrap gap-3">
                {suburb.nearbyAreas.map((area, index) => {
                  const nearbyArea = allAreas.find(s => s.name === area);
                  if (nearbyArea) {
                    return (
                      <Link key={index} to={`/suburbs/${nearbyArea.slug}`}>
                        <Button variant="outline" className="border-gold/30 hover:border-gold hover:bg-gold/10">
                          {area}
                        </Button>
                      </Link>
                    );
                  }
                  return (
                    <span key={index} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700">
                      {area}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Book Your {suburb.name} Airport Shuttle?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant pricing and book your airport transfer from {suburb.name} now
          </p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
              Book Now - From ${suburb.estimatedPrice}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <p className="text-sm text-gray-400 mt-6">
            Book online for instant confirmation
          </p>
        </div>
      </section>
    </div>
  );
};

export default SuburbPage;
