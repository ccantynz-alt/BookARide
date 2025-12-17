import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, CheckCircle, ArrowRight, Star, Phone, Calendar, Car, Shield, CreditCard, ChevronDown, ChevronUp, Navigation, Route } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { aucklandSuburbs } from '../../data/aucklandSuburbs';
import { hamiltonAreas } from '../../data/hamiltonAreas';
import { whangareiAreas } from '../../data/whangareiAreas';
import { hibiscusCoastSuburbs } from '../../data/hibiscusCoastSuburbs';

// Auckland Airport coordinates
const AIRPORT_COORDS = { lat: -37.0082, lng: 174.7850 };

// Combine all areas
const allAreas = [...aucklandSuburbs, ...hamiltonAreas, ...whangareiAreas, ...hibiscusCoastSuburbs];

// FAQ Component with Schema
const FAQSection = ({ suburb }) => {
  const [openIndex, setOpenIndex] = useState(null);
  
  const faqs = [
    {
      question: `How much does a shuttle from ${suburb.name} to Auckland Airport cost?`,
      answer: `Our airport shuttle service from ${suburb.name} to Auckland Airport starts from $${suburb.price} NZD. The final price depends on the number of passengers, luggage, and any additional stops. We offer fixed pricing with no hidden fees or surge charges.`
    },
    {
      question: `How long does it take to get from ${suburb.name} to Auckland Airport?`,
      answer: `The journey from ${suburb.name} to Auckland Airport typically takes ${suburb.estimatedTime || '25-35 minutes'}, covering approximately ${suburb.distance}km. Travel time may vary based on traffic conditions, especially during peak hours.`
    },
    {
      question: `Do you offer early morning pickups from ${suburb.name}?`,
      answer: `Yes! We provide 24/7 airport shuttle service from ${suburb.name}. Whether your flight departs at 5 AM or midnight, we'll be there on time. We recommend booking early morning transfers in advance.`
    },
    {
      question: `Can I book a return trip from Auckland Airport to ${suburb.name}?`,
      answer: `Absolutely! You can book both your outbound and return transfers at the same time. We track your flight arrival, so even if your flight is delayed, your driver will be waiting when you land.`
    },
    {
      question: `What payment methods do you accept for ${suburb.name} airport transfers?`,
      answer: `We accept all major credit cards (Visa, Mastercard, Amex), EFTPOS, bank transfer, and cash. You can pay online when booking or pay the driver directly.`
    },
    {
      question: `Is there a meet and greet service at Auckland Airport for ${suburb.name} transfers?`,
      answer: `Yes, for arrivals at Auckland Airport, our drivers can meet you inside the terminal with a name board. This service is particularly helpful for international travelers unfamiliar with the area.`
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Common questions about {suburb.name} to Auckland Airport transfers
        </p>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-gold" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        })}
      </script>
    </section>
  );
};

// Route Map Component
const RouteMap = ({ suburb }) => {
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!window.google || !suburb.coordinates) return;

    const map = new window.google.maps.Map(mapRef.current, {
      zoom: 11,
      center: {
        lat: (suburb.coordinates.lat + AIRPORT_COORDS.lat) / 2,
        lng: (suburb.coordinates.lng + AIRPORT_COORDS.lng) / 2
      },
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ]
    });

    // Add markers
    new window.google.maps.Marker({
      position: suburb.coordinates,
      map,
      title: suburb.name,
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
      }
    });

    new window.google.maps.Marker({
      position: AIRPORT_COORDS,
      map,
      title: "Auckland Airport",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
      }
    });

    // Draw route
    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#D4AF37",
        strokeWeight: 4
      }
    });

    directionsService.route({
      origin: suburb.coordinates,
      destination: AIRPORT_COORDS,
      travelMode: window.google.maps.TravelMode.DRIVING
    }, (response, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(response);
      }
    });

    setMapLoaded(true);
  }, [suburb]);

  return (
    <section className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            <Route className="inline-block w-8 h-8 mr-2 text-gold" />
            {suburb.name} to Auckland Airport Route
          </h2>
          <p className="text-gray-400">
            {suburb.distance}km • Approximately {suburb.estimatedTime || '25-35 minutes'}
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div 
            ref={mapRef} 
            className="w-full h-[400px] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: '#1a1a2e' }}
          >
            {!mapLoaded && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Navigation className="w-8 h-8 animate-pulse mr-2" />
                Loading map...
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <MapPin className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Start</p>
              <p className="font-semibold text-white">{suburb.name}</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <MapPin className="w-6 h-6 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">End</p>
              <p className="font-semibold text-white">Auckland Airport</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <Navigation className="w-6 h-6 text-gold mx-auto mb-2" />
              <p className="text-sm text-gray-400">Distance</p>
              <p className="font-semibold text-white">{suburb.distance}km</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg text-center">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Est. Time</p>
              <p className="font-semibold text-white">{suburb.estimatedTime || '25-35 min'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Main Component
export const SuburbLandingAdvanced = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const rawSuburb = allAreas.find(s => s.slug === slug);

  if (!rawSuburb) {
    return <Navigate to="/" replace />;
  }

  const suburb = {
    ...rawSuburb,
    price: rawSuburb.price || rawSuburb.estimatedPrice || 100,
    distance: rawSuburb.distance || rawSuburb.distanceToAirport || 20
  };

  const cityName = suburb.city || suburb.region || "Auckland";

  // Generate comprehensive schema
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "name": "Book A Ride NZ",
        "@id": "https://bookaride.co.nz/#business",
        "url": "https://bookaride.co.nz",
        
        "priceRange": "$$$",
        "image": "https://bookaride.co.nz/logo.png",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Auckland",
          "addressRegion": "Auckland",
          "addressCountry": "NZ"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": suburb.coordinates?.lat,
          "longitude": suburb.coordinates?.lng
        },
        "areaServed": {
          "@type": "City",
          "name": cityName
        }
      },
      {
        "@type": "Service",
        "name": `${suburb.name} Airport Shuttle Service`,
        "description": `Professional airport transfer service from ${suburb.name} to Auckland Airport`,
        "provider": { "@id": "https://bookaride.co.nz/#business" },
        "areaServed": suburb.name,
        "offers": {
          "@type": "Offer",
          "price": suburb.price,
          "priceCurrency": "NZD",
          "availability": "https://schema.org/InStock"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bookaride.co.nz" },
          { "@type": "ListItem", "position": 2, "name": "Suburbs", "item": "https://bookaride.co.nz/suburbs" },
          { "@type": "ListItem", "position": 3, "name": suburb.name, "item": `https://bookaride.co.nz/airport-transfer/${slug}` }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title={`${suburb.name} to Auckland Airport Shuttle | Get Instant Quote | Book A Ride NZ`}
        description={`Book your ${suburb.name} to Auckland Airport shuttle. ${suburb.distance}km, ${suburb.estimatedTime || '25-35 min'} journey. Professional drivers, flight tracking, 24/7 service. Get instant online quote!`}
        keywords={`${suburb.name} airport shuttle, ${suburb.name} to Auckland Airport, airport transfer ${suburb.name}, ${suburb.name} airport taxi, shuttle service ${suburb.name}, ${suburb.name} Auckland Airport transport, cheap airport shuttle ${suburb.name}, best ${suburb.name} airport transfer, ${cityName} airport shuttle`}
        canonical={`/airport-transfer/${slug}`}
      />
      
      {/* Schema Markup */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-6 text-gray-400">
              <Link to="/" className="hover:text-gold">Home</Link>
              <span>/</span>
              <Link to="/suburbs" className="hover:text-gold">Suburbs</Link>
              <span>/</span>
              <span className="text-gold">{suburb.name}</span>
            </nav>

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-gold/20 px-4 py-2 rounded-full mb-6">
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-gold font-medium">5-Star Rated Service</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                {suburb.name} <span className="text-gold">Airport Shuttle</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-2">
                Professional Transfers to Auckland Airport
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 text-lg text-gray-400 mb-8">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-gold" />
                  Instant Quote
                </span>
                <span className="flex items-center gap-1">
                  <Navigation className="w-5 h-5 text-gold" />
                  {suburb.distance}km
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-5 h-5 text-gold" />
                  {suburb.estimatedTime || '25-35 min'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => navigate('/book-now')}
                className="bg-gold hover:bg-gold/90 text-black font-bold text-lg px-8 py-6"
              >
                Get Instant Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 text-lg px-8 py-6"
                onClick={() => window.location.href = '/contact'}
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our {suburb.name} Airport Shuttle?
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-bold text-lg mb-2">Fixed Pricing</h3>
                <p className="text-gray-600 text-sm">No surge pricing or hidden fees. Pay what you see.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-bold text-lg mb-2">24/7 Service</h3>
                <p className="text-gray-600 text-sm">Early morning or late night - we're always available.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-bold text-lg mb-2">Flight Tracking</h3>
                <p className="text-gray-600 text-sm">We monitor your flight and adjust for delays.</p>
              </CardContent>
            </Card>
            
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-bold text-lg mb-2">Professional Drivers</h3>
                <p className="text-gray-600 text-sm">Licensed, insured, and background checked.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Route Map */}
      <RouteMap suburb={suburb} />

      {/* Landmarks Section */}
      {suburb.landmarks && suburb.landmarks.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">
              Popular Pickup Points in {suburb.name}
            </h2>
            <p className="text-center text-gray-600 mb-12">
              We pick up from anywhere in {suburb.name}, including these popular locations
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
              {suburb.landmarks.map((landmark, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-lg text-center hover:bg-gold/10 transition-colors">
                  <MapPin className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="font-medium text-sm">{landmark}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Areas */}
      {suburb.nearbyAreas && suburb.nearbyAreas.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8">
              Also Serving Nearby Areas
            </h2>
            
            <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
              {suburb.nearbyAreas.map((area, idx) => {
                const areaData = allAreas.find(a => a.name === area);
                return (
                  <Link 
                    key={idx}
                    to={areaData ? `/airport-transfer/${areaData.slug}` : '/suburbs'}
                    className="bg-white px-6 py-3 rounded-full shadow-sm hover:shadow-md hover:bg-gold hover:text-black transition-all"
                  >
                    {area} Airport Shuttle
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <FAQSection suburb={suburb} />

      {/* CTA Section */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-black mb-4">
            Ready to Book Your {suburb.name} Airport Transfer?
          </h2>
          <p className="text-black/80 mb-8 text-lg">
            Instant Quote • {suburb.distance}km • {suburb.estimatedTime || '25-35 minutes'}
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/book-now')}
            className="bg-black hover:bg-gray-900 text-white font-bold text-lg px-12 py-6"
          >
            Book Your Shuttle Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SuburbLandingAdvanced;
