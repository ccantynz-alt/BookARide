import React from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, CheckCircle, ArrowRight, Star, Phone, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';
import SuburbSchema from '../components/SuburbSchema';
import { aucklandSuburbs } from '../data/aucklandSuburbs';
import { hamiltonAreas } from '../data/hamiltonAreas';
import { whangareiAreas } from '../data/whangareiAreas';
import { hibiscusCoastSuburbs } from '../data/hibiscusCoastSuburbs';

// Combine all areas
const allAreas = [...aucklandSuburbs, ...hamiltonAreas, ...whangareiAreas, ...hibiscusCoastSuburbs];

export const SuburbPageSEO = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const rawSuburb = allAreas.find(s => s.slug === slug);

  // If suburb not found, redirect to home
  if (!rawSuburb) {
    return <Navigate to="/" replace />;
  }

  // Normalize suburb data to handle both data formats
  const suburb = {
    ...rawSuburb,
    price: rawSuburb.price || rawSuburb.estimatedPrice || 100,
    distance: rawSuburb.distance || rawSuburb.distanceToAirport || 20
  };

  const cityName = suburb.city || suburb.region || "Auckland";
  const isHibiscusCoast = suburb.region === "Hibiscus Coast";

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={`${suburb.name} Airport Shuttle to Auckland Airport | Book A Ride`}
        description={`Professional airport shuttle service from ${suburb.name} to Auckland Airport. 24/7 availability, instant online quotes. Book online for instant confirmation. Reliable, safe, affordable.`}
        keywords={`${suburb.name} airport shuttle, ${suburb.name} to Auckland Airport, airport transfer ${suburb.name}, shuttle service ${suburb.name}, ${suburb.name} airport transport, ${suburb.name} to airport taxi, book airport shuttle ${suburb.name}, cheap airport shuttle ${suburb.name}, ${cityName} airport shuttle`}
        canonical={`/suburbs/${slug}`}
      />
      <SuburbSchema suburb={suburb} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {suburb.name} Airport Shuttle Service
              </h1>
              <p className="text-2xl md:text-3xl text-blue-100 font-semibold mb-4">
                Fast & Reliable Transfers to Auckland Airport
              </p>
              <p className="text-xl text-blue-200">
                {suburb.distance}km • Professional Drivers • 24/7 Available • Instant Booking
              </p>
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button 
                size="lg" 
                onClick={() => navigate('/book-now')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-6"
              >
                Book Your Shuttle Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8 py-6"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call {suburb.phone || "+64 9 555 0123"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Info Cards */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="font-bold text-xl mb-2">Competitive Pricing</h3>
                <p className="text-2xl font-bold text-green-600 mb-2">Get Instant Quote</p>
                <p className="text-gray-600">Live pricing calculator</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                <h3 className="font-bold text-xl mb-2">Distance</h3>
                <p className="text-3xl font-bold text-blue-600 mb-2">{suburb.distance}km</p>
                <p className="text-gray-600">Door-to-door service</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 mx-auto mb-3 text-purple-600" />
                <h3 className="font-bold text-xl mb-2">24/7 Service</h3>
                <p className="text-3xl font-bold text-purple-600 mb-2">Always</p>
                <p className="text-gray-600">Any time, any day</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content - AGGRESSIVE SEO */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <h2 className="text-3xl font-bold mb-6">
              Why Choose Our {suburb.name} to Auckland Airport Shuttle Service?
            </h2>
            
            <p className="text-lg leading-relaxed mb-4">
              Looking for a reliable, affordable airport shuttle from <strong>{suburb.name}</strong> to Auckland International Airport? You've come to the right place. We specialize in providing premium airport transfer services for residents and visitors of {suburb.name}, {cityName}, with professional drivers available 24 hours a day, 7 days a week.
            </p>

            <p className="text-lg leading-relaxed mb-4">
              Our <strong>{suburb.name} airport shuttle service</strong> is designed specifically for the journey from {suburb.name} to Auckland Airport. We offer transparent, distance-based pricing with rates calculated fairly based on the actual distance traveled. Get an instant quote online!
            </p>

            <h3 className="text-2xl font-bold mt-8 mb-4">
              Premium Airport Transfer from {suburb.name}
            </h3>

            <p className="text-lg leading-relaxed mb-4">
              {suburb.name} is {suburb.distance} kilometers from Auckland International Airport. {suburb.description} Whether you're heading out for business or pleasure, our airport shuttle service ensures you arrive at the airport relaxed, on time, and ready for your journey.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg my-8">
              <h4 className="font-bold text-xl mb-3">Service Highlights</h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Transparent Pricing:</strong> Fair distance-based rates for {suburb.name} to Auckland Airport - get instant quote online</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Professional Licensed Drivers:</strong> Experienced, local drivers who know the best routes from {suburb.name}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>24/7 Availability:</strong> Early morning flights? Late night arrivals? We're always available</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Flight Tracking:</strong> We monitor your flight status for delays or early arrivals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Meet & Greet Service:</strong> Airport pickups include complimentary meet and greet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                  <span><strong>Clean, Comfortable Vehicles:</strong> Spacious shuttles with ample luggage space</span>
                </li>
              </ul>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">
              About {suburb.name}, {cityName}
            </h3>

            <p className="text-lg leading-relaxed mb-4">
              {suburb.name} {isHibiscusCoast ? "is part of the beautiful Hibiscus Coast region, known for" : "is located in"} {cityName}. {suburb.description}
            </p>

            {suburb.attractions && suburb.attractions.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-lg mb-2">Popular Locations in {suburb.name}:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {suburb.attractions.map((attraction, idx) => (
                    <li key={idx}>{attraction}</li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="text-2xl font-bold mt-8 mb-4">
              How to Book Your {suburb.name} Airport Shuttle
            </h3>

            <p className="text-lg leading-relaxed mb-4">
              Booking your airport transfer from {suburb.name} is simple and takes less than 2 minutes:
            </p>

            <ol className="list-decimal list-inside space-y-3 mb-6">
              <li className="text-lg"><strong>Enter Your Details:</strong> Pickup address in {suburb.name}, flight time, and passenger count</li>
              <li className="text-lg"><strong>Get Your Quote:</strong> See your estimated price based on exact distance</li>
              <li className="text-lg"><strong>Secure Payment:</strong> Pay securely online</li>
              <li className="text-lg"><strong>Instant Confirmation:</strong> Receive booking confirmation immediately via email and SMS</li>
            </ol>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 my-8">
              <p className="font-semibold text-lg mb-2">⭐ Local Tip from Our Drivers:</p>
              <p className="text-gray-700">
                For pickups in {suburb.name}, we recommend booking at least 2 hours before your flight departure during peak traffic times. The journey to Auckland Airport typically takes {Math.round(suburb.distance / 60 * 45)}-{Math.round(suburb.distance / 60 * 70)} minutes depending on traffic.
              </p>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">
              Frequently Asked Questions - {suburb.name} Airport Shuttle
            </h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-lg mb-2">Q: How much does an airport shuttle from {suburb.name} to Auckland Airport cost?</h4>
                <p className="text-gray-700">A: Pricing for a shuttle from {suburb.name} to Auckland Airport is calculated based on your specific pickup and dropoff locations. Use our instant quote calculator for accurate pricing.</p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2">Q: How far is {suburb.name} from Auckland Airport?</h4>
                <p className="text-gray-700">A: {suburb.name} is approximately {suburb.distance} kilometers from Auckland International Airport. The drive typically takes {Math.round(suburb.distance / 60 * 45)}-{Math.round(suburb.distance / 60 * 70)} minutes depending on traffic conditions.</p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2">Q: Do you provide airport pickups from Auckland Airport to {suburb.name}?</h4>
                <p className="text-gray-700">A: Yes! We provide both directions - from {suburb.name} to the airport AND from Auckland Airport back to {suburb.name}. Pricing is based on distance for both directions.</p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2">Q: Is your airport shuttle service available 24/7 from {suburb.name}?</h4>
                <p className="text-gray-700">A: Absolutely! Whether you have a 5 AM flight or midnight arrival, we're available 24 hours a day, 7 days a week to serve {suburb.name} residents.</p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2">Q: How many passengers can your {suburb.name} airport shuttle accommodate?</h4>
                <p className="text-gray-700">A: Our shuttles comfortably accommodate up to 11 passengers with luggage. Perfect for families, groups, or business travelers.</p>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-2">Q: Do you provide child car seats for {suburb.name} pickups?</h4>
                <p className="text-gray-700">A: Yes, child car seats are available upon request when booking. Just let us know the age/size of your children.</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 rounded-lg my-12 text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Book Your {suburb.name} Airport Shuttle?</h3>
              <p className="text-lg mb-6">Instant Online Quotes • 24/7 service • Professional Drivers</p>
              <Button 
                size="lg"
                onClick={() => navigate('/book-now')}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-8 py-4"
              >
                Book Online Now - Instant Confirmation
              </Button>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">
              Why Choose Us Over Other {suburb.name} Airport Transport Options?
            </h3>

            <div className="grid md:grid-cols-2 gap-6 my-6">
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-bold mb-2">✓ Us - Transparent Pricing</h4>
                <p className="text-sm text-gray-600">Distance-based rates, instant quotes</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-bold mb-2">✗ Rideshare - Surge Pricing</h4>
                <p className="text-sm text-gray-600">Price can double during peak times</p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-bold mb-2">✓ Us - Professional Drivers</h4>
                <p className="text-sm text-gray-600">Licensed, trained, local expertise</p>
              </div>
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-bold mb-2">✗ Regular Taxis - Unknown Quality</h4>
                <p className="text-sm text-gray-600">Variable driver quality and vehicle condition</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold mt-8 mb-4">
              Service Coverage Area - {cityName}
            </h3>

            <p className="text-lg mb-4">
              While we specialize in <strong>{suburb.name} airport transfers</strong>, we also serve all surrounding areas in {cityName}. Need a pickup from a specific street or landmark in {suburb.name}? We've got you covered with door-to-door service.
            </p>

            {isHibiscusCoast && (
              <p className="text-lg mb-4">
                As part of our comprehensive Hibiscus Coast coverage, we serve Orewa, Whangaparāoa, Gulf Harbour, Silverdale, Red Beach, and all surrounding suburbs with the same reliable service you can depend on.
              </p>
            )}

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Book Your {suburb.name} Airport Shuttle Today
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us for their {suburb.name} to Auckland Airport transfers
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/book-now')}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-lg px-12 py-6"
          >
            Get Instant Quote & Book Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SuburbPageSEO;
