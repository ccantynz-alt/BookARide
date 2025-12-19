import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Plane, MapPin, Clock, Shield, Star, CreditCard, Users, CheckCircle, Globe, Phone, ArrowRight, Car, Wifi, Baby, Luggage } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import PageBreadcrumb from '../../components/PageBreadcrumb';
import { internationalMarkets } from '../../data/internationalMarkets';

const CountryLandingPage = () => {
  const { countrySlug } = useParams();
  
  // Get country from URL or find by slug
  const country = internationalMarkets.find(c => c.slug === countrySlug) || internationalMarkets[0];
  
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "name": `New Zealand Airport Transfers for ${country.demonym} Visitors`,
    "description": `Premium airport shuttle service for ${country.demonym} tourists visiting New Zealand. Private door-to-door transfers from Auckland Airport.`,
    "touristType": `${country.demonym} Visitors`,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ",
      "url": "https://bookaride.co.nz"
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "NZD",
      "availability": "https://schema.org/InStock"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": country.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  const features = [
    { icon: Shield, title: 'Safe & Reliable', desc: 'Licensed, insured professional drivers' },
    { icon: Clock, title: 'Flight Tracking', desc: 'We monitor your flight automatically' },
    { icon: CreditCard, title: country.paymentNote || 'Easy Payment', desc: 'All major cards accepted' },
    { icon: Wifi, title: 'Free WiFi', desc: 'Stay connected during your transfer' },
    { icon: Baby, title: 'Child Seats', desc: 'Free child seats on request' },
    { icon: Luggage, title: 'Luggage Space', desc: 'Room for all your bags' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{country.metaTitle}</title>
        <meta name="description" content={country.metaDesc} />
        <meta name="keywords" content={country.keywords.join(', ')} />
        <link rel="canonical" href={`https://bookaride.co.nz/visitors/${country.slug}`} />
        <meta property="og:title" content={country.metaTitle} />
        <meta property="og:description" content={country.metaDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content={country.locale || 'en_NZ'} />
        {country.hreflang && <link rel="alternate" hrefLang={country.hreflang} href={`https://bookaride.co.nz/visitors/${country.slug}`} />}
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <PageBreadcrumb items={[
        { label: 'International Visitors', href: '/international' },
        { label: country.name }
      ]} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/30 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <span className="text-2xl">{country.flag}</span>
              {country.greeting}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {country.heroTitle}
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {country.heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                  Get Instant Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+6495555555">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  <Phone className="mr-2 w-5 h-5" />
                  Call Us
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Private transfers</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Fixed prices</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> Flight tracking</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-500" /> 24/7 service</span>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-gold fill-gold" />
              <span className="font-semibold">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gold" />
              <span>10,000+ Happy Visitors</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gold" />
              <span>Serving {country.demonym} Travelers Since 2020</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Why {country.demonym} Visitors Choose Us</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">{country.whyChooseUs}</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Popular Destinations for {country.demonym} Visitors</h2>
          <p className="text-gray-600 text-center mb-12">We'll take you anywhere in New Zealand</p>
          
          <div className="grid md:grid-cols-4 gap-6">
            {country.popularDestinations.map((dest, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <MapPin className="w-8 h-8 text-gold mb-3" />
                  <h3 className="font-bold text-lg mb-1">{dest.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{dest.desc}</p>
                  <Link to="/book-now" className="text-gold hover:underline text-sm font-semibold">
                    Get Quote →
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Questions from {country.demonym} Visitors</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {country.faqs.map((faq, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{country.ctaTitle}</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">{country.ctaSubtitle}</p>
          <Link to="/book-now">
            <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
              Book Your Transfer Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CountryLandingPage;
