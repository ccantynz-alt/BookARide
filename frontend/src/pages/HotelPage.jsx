import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, CheckCircle, ArrowRight, Star, Hotel } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { allHotels } from '../data/aucklandHotels';

export const HotelPage = () => {
  const { slug } = useParams();
  const hotel = allHotels.find(h => h.slug === slug);

  // If hotel not found, redirect to home
  if (!hotel) {
    return <Navigate to="/" replace />;
  }

  const benefits = [
    'Door-to-door service',
    'Meet & greet at hotel lobby',
    'Professional, licensed drivers',
    'Flight tracking included',
    'Luggage assistance',
    'Fixed price - no surprises',
    '24/7 service available',
    'Clean, comfortable vehicles'
  ];

  return (
    <div className="min-h-screen pt-20 bg-white">
      <SEO 
        title={`Airport Shuttle ${hotel.name} - Auckland Airport Transfer | From $${hotel.estimatedPrice}`}
        description={`Reliable airport shuttle from ${hotel.name} to Auckland Airport. Professional door-to-door service from ${hotel.address}. Fixed price $${hotel.estimatedPrice}. Book online 24/7.`}
        keywords={`${hotel.name} airport shuttle, ${hotel.name} to airport, airport transfer ${hotel.name}, shuttle from ${hotel.name}, ${hotel.name} Auckland airport, ${hotel.area} hotel shuttle`}
        canonical={`/hotels/${slug}`}
      />
      <StructuredData 
        type="service" 
        data={{
          breadcrumb: [
            { name: 'Home', path: '/' },
            { name: 'Hotels', path: '/hotels' },
            { name: hotel.name, path: `/hotels/${slug}` }
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
              <Hotel className="w-12 h-12 mx-auto text-gold" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Airport Shuttle Service
              <span className="block text-gold mt-2">{hotel.name}</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(hotel.stars)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-gold fill-gold" />
              ))}
            </div>
            <p className="text-xl text-gray-300 mb-4">
              {hotel.address}
            </p>
            <p className="text-lg text-white/80 mb-8">
              Professional airport transfer service from {hotel.name} to Auckland Airport
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg">
                  Book Your Shuttle Now
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
                <p className="text-3xl font-bold text-gold mb-2">{hotel.distanceToAirport} km</p>
                <p className="text-sm text-gray-600">From {hotel.name}</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/30 hover:border-gold transition-colors duration-200">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Estimated Time</h3>
                <p className="text-2xl font-bold text-gold mb-2">{hotel.estimatedTime}</p>
                <p className="text-sm text-gray-600">Door to airport</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gold/30 hover:border-gold transition-colors duration-200">
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fixed Price</h3>
                <p className="text-3xl font-bold text-gold mb-2">${hotel.estimatedPrice}</p>
                <p className="text-sm text-gray-600">No hidden fees</p>
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
              Airport Shuttle from {hotel.name}
            </h2>
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p>
                Staying at <strong>{hotel.name}</strong> and need reliable airport transfer? 
                Book A Ride NZ offers professional shuttle service with fixed pricing and no hidden fees.
              </p>
              <p>
                Located in {hotel.area}, {hotel.name} is just {hotel.distanceToAirport}km from Auckland International Airport. 
                Our experienced drivers will meet you at the hotel lobby and get you to the airport comfortably 
                in approximately {hotel.estimatedTime}, depending on traffic conditions.
              </p>
              <p>
                Perfect for both business and leisure travelers, our door-to-door service means you can relax 
                and enjoy your journey without the stress of driving, parking, or navigating public transport 
                with luggage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hotel Amenities */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                About {hotel.name}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {hotel.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow-sm">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{amenity}</span>
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
              Why Choose Our Airport Shuttle Service?
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

      {/* Nearby Hotels */}
      {hotel.nearbyHotels && hotel.nearbyHotels.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Nearby Hotels We Service
              </h2>
              <p className="text-gray-700 mb-6">
                We also provide airport shuttle services to these nearby hotels:
              </p>
              <div className="flex flex-wrap gap-3">
                {hotel.nearbyHotels.map((hotelName, index) => {
                  const nearbyHotel = allHotels.find(h => h.name === hotelName);
                  if (nearbyHotel) {
                    return (
                      <Link key={index} to={`/hotels/${nearbyHotel.slug}`}>
                        <Button variant="outline" className="border-gold/30 hover:border-gold hover:bg-gold/10">
                          {hotelName}
                        </Button>
                      </Link>
                    );
                  }
                  return (
                    <span key={index} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700">
                      {hotelName}
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
            Ready to Book Your {hotel.name} Airport Shuttle?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant pricing and book your airport transfer now - only ${hotel.estimatedPrice}
          </p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
              Book Now - ${hotel.estimatedPrice}
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

export default HotelPage;
