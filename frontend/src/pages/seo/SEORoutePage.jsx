import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { 
  Clock, MapPin, DollarSign, Car, Calendar, Phone,
  CheckCircle, Star, ArrowRight, Shield, Users, Plane,
  ChevronRight, Quote, Award, ThumbsUp, Zap
} from 'lucide-react';
import { routeData, comparisonData } from '../../data/seoRouteData';

const SEORoutePage = () => {
  const { routeSlug } = useParams();
  const route = routeData[routeSlug];
  
  if (!route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Route not found</h1>
          <Link to="/" className="text-gold hover:underline">Return to home</Link>
        </div>
      </div>
    );
  }

  // Schema markup for SEO
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": route.title,
    "description": route.metaDescription,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ",
      "telephone": "+64 21 743 321",
      "url": "https://bookaride.co.nz",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Auckland",
        "addressCountry": "NZ"
      },
      "priceRange": "$$"
    },
    "areaServed": {
      "@type": "City",
      "name": route.suburb
    },
    "offers": {
      "@type": "Offer",
      "price": route.priceFrom,
      "priceCurrency": "NZD"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": route.faqs?.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    })) || []
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{route.title} | BookaRide NZ</title>
        <meta name="description" content={route.metaDescription} />
        <meta name="keywords" content={`${route.suburb} airport shuttle, ${route.suburb} airport transfer, Auckland airport to ${route.suburb}, ${route.region} airport shuttle`} />
        <link rel="canonical" href={`https://bookaride.co.nz/routes/${route.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={route.title} />
        <meta property="og:description" content={route.metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://bookaride.co.nz/routes/${route.slug}`} />
        
        {/* Schema Markup */}
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-gold">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <Link to="/routes" className="hover:text-gold">Routes</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gold">{route.suburb}</span>
          </nav>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {route.h1}
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Professional door-to-door airport transfer service for {route.suburb} and surrounding {route.region} areas. 
                No sharing, no waiting, just premium service.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <Clock className="w-5 h-5 text-gold mr-2" />
                  <span>{route.duration}</span>
                </div>
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <MapPin className="w-5 h-5 text-gold mr-2" />
                  <span>{route.distance}</span>
                </div>
                <div className="flex items-center bg-white/10 rounded-full px-4 py-2">
                  <DollarSign className="w-5 h-5 text-gold mr-2" />
                  <span>From ${route.priceFrom}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/book">
                  <Button className="bg-gold hover:bg-gold/90 text-black font-bold px-8 py-6 text-lg">
                    Book Now - From ${route.priceFrom}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="tel:+6421743321">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                    <Phone className="mr-2 w-5 h-5" />
                    Call +64 21 743 321
                  </Button>
                </a>
              </div>
            </div>

            {/* Quick Quote Card */}
            <div className="bg-white text-gray-900 rounded-2xl p-8 shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-center">Get an Instant Quote</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Plane className="w-5 h-5 text-gold mr-3" />
                    <span>Auckland Airport</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gold mr-3" />
                    <span>{route.suburb}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gold/10 rounded-lg">
                    <p className="text-2xl font-bold text-gold">${route.priceFrom}+</p>
                    <p className="text-sm text-gray-600">Private Transfer</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">{route.duration.split('-')[0]}</p>
                    <p className="text-sm text-gray-600">Minutes</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold">24/7</p>
                    <p className="text-sm text-gray-600">Service</p>
                  </div>
                </div>

                <Link to="/book" className="block">
                  <Button className="w-full bg-gold hover:bg-gold/90 text-black font-bold py-4">
                    Get Exact Price
                  </Button>
                </Link>
                
                <p className="text-center text-sm text-gray-500">
                  Free cancellation up to 24 hours before
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose BookaRide for {route.suburb} Transfers?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {route.highlights.map((highlight, idx) => (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <CheckCircle className="w-10 h-10 text-gold mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{highlight}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Suburbs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">
            We Also Service Nearby Areas
          </h2>
          <p className="text-gray-600 mb-8">
            Our {route.suburb} airport shuttle service covers all surrounding suburbs in the {route.region} area:
          </p>
          
          <div className="flex flex-wrap gap-3">
            {route.nearbySuburbs.map((suburb, idx) => (
              <span 
                key={idx}
                className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gold hover:text-black transition-colors cursor-pointer"
              >
                {suburb}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Pickups */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">
            Popular Pickup Locations in {route.suburb}
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {route.popularPickups.map((pickup, idx) => (
              <div key={idx} className="flex items-center p-4 bg-white/10 rounded-lg">
                <MapPin className="w-6 h-6 text-gold mr-4 flex-shrink-0" />
                <span>{pickup}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">
              Don't see your location? No problem! We pick up from ANY address in {route.suburb} and surrounding areas.
            </p>
            <Link to="/book">
              <Button className="bg-gold hover:bg-gold/90 text-black font-bold">
                Enter Your Address
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      {route.faqs && route.faqs.length > 0 && (
        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              {route.faqs.map((faq, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-semibold text-lg mb-3 flex items-start">
                    <span className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-black font-bold mr-3 flex-shrink-0">
                      Q
                    </span>
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 ml-11">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-black mb-6">
            Ready to Book Your {route.suburb} Airport Transfer?
          </h2>
          <p className="text-black/80 text-lg mb-8">
            Book online in 2 minutes. Free cancellation up to 24 hours before pickup.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book">
              <Button className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-4 text-lg">
                Book Online Now
              </Button>
            </Link>
            <a href="tel:+6421743321">
              <Button variant="outline" className="border-black text-black hover:bg-black/10 px-8 py-4 text-lg">
                <Phone className="mr-2 w-5 h-5" />
                +64 21 743 321
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Related Routes */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold mb-8">
            Other {route.region} Routes
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(routeData)
              .filter(r => r.region === route.region && r.slug !== route.slug)
              .slice(0, 3)
              .map((relatedRoute, idx) => (
                <Link 
                  key={idx} 
                  to={`/routes/${relatedRoute.slug}`}
                  className="block"
                >
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2">
                        {relatedRoute.suburb} Airport Shuttle
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        From ${relatedRoute.priceFrom} • {relatedRoute.duration}
                      </p>
                      <span className="text-gold font-semibold flex items-center">
                        View Route <ArrowRight className="ml-2 w-4 h-4" />
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SEORoutePage;
