import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { CheckCircle, Clock, Shield, Star, MapPin, Phone, Car, Users, Plane, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const HibiscusCoastShuttlePage = () => {
  const features = [
    { icon: Clock, title: '24/7 Service', desc: 'Early morning or late night flights - we\'re always available' },
    { icon: Shield, title: 'Fixed Pricing', desc: 'No surge pricing, no hidden fees. Know your cost upfront' },
    { icon: Car, title: 'Private Transfers', desc: 'No sharing with strangers. Direct door-to-door service' },
    { icon: Users, title: 'All Group Sizes', desc: 'From solo travelers to large families with luggage' },
  ];

  const suburbs = [
    { name: 'Orewa', price: 95, time: '40-50 min' },
    { name: 'Whangaparaoa', price: 100, time: '45-55 min' },
    { name: 'Silverdale', price: 90, time: '35-45 min' },
    { name: 'Gulf Harbour', price: 105, time: '50-60 min' },
    { name: 'Red Beach', price: 95, time: '40-50 min' },
    { name: 'Stanmore Bay', price: 100, time: '45-55 min' },
    { name: 'Manly', price: 100, time: '45-55 min' },
    { name: 'Army Bay', price: 105, time: '50-60 min' },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Hibiscus Coast Airport Shuttle Service",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Book a Ride NZ",
      "url": "https://bookaride.co.nz"
    },
    "areaServed": {
      "@type": "Place",
      "name": "Hibiscus Coast, Auckland"
    },
    "description": "Premium private airport shuttle service from Hibiscus Coast to Auckland Airport. Door-to-door transfers with professional drivers.",
    "offers": {
      "@type": "Offer",
      "priceRange": "Get instant quote online"
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Hibiscus Coast Airport Shuttle | #1 Rated Service | Get Instant Quote | BookaRide</title>
        <meta name="description" content="Best Hibiscus Coast airport shuttle service. Private door-to-door transfers to Auckland Airport from Orewa, Whangaparaoa, Silverdale & more. Fixed prices with instant online quotes. Book online 24/7." />
        <meta name="keywords" content="hibiscus coast airport shuttle, hibiscus coast to auckland airport, orewa airport shuttle, whangaparaoa airport transfer, silverdale airport shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/hibiscus-coast-airport-shuttle" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white py-20">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1920')] bg-cover bg-center opacity-20" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2 fill-current" />
              #1 Rated Hibiscus Coast Shuttle Service
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Hibiscus Coast <span className="text-gold">Airport Shuttle</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Premium private transfers from Hibiscus Coast to Auckland Airport. 
              No sharing, no waiting, no hidden fees. Just reliable door-to-door service.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8">
                  Book Now - Get Instant Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="/book-now">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                  <Phone className="mr-2 w-5 h-5" />
                  Call: Book Online
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
              </div>
              <span className="font-semibold">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold">1000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Fully Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-semibold">24/7 Availability</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Why Hibiscus Coast Locals Choose <span className="text-gold">BookaRide</span>
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            We&apos;re not just another shuttle service. We&apos;re your neighbors, serving the Hibiscus Coast community with pride.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-2 hover:border-gold transition-colors">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-12 h-12 mx-auto mb-4 text-gold" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Hibiscus Coast Shuttle <span className="text-gold">Prices</span>
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Transparent pricing. No surge charges. What you see is what you pay.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {suburbs.map((suburb, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 text-gold mr-2" />
                    <h3 className="font-bold text-lg">{suburb.name}</h3>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-3xl font-bold text-gold">${suburb.price}</p>
                      <p className="text-sm text-gray-500">one way</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{suburb.time}</p>
                      <p className="text-xs text-gray-400">to airport</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
                Get Exact Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            BookaRide vs Other Hibiscus Coast Shuttles
          </h2>
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-2 border-gold bg-gold/5">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gold">BookaRide ✓</h3>
                  <ul className="space-y-4">
                    {[
                      'Private door-to-door transfers',
                      'Instant online booking',
                      'Fixed upfront pricing',
                      'Flight tracking included',
                      'Free child seats',
                      'No sharing with strangers',
                      '24/7 customer support',
                      'Modern booking system',
                      'International visitor pages',
                      'Meet & Greet available'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-2 border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-500">Other Shuttles</h3>
                  <ul className="space-y-4 text-gray-600">
                    {[
                      'May be shared shuttles',
                      'Phone booking only',
                      'Variable pricing',
                      'Manual flight checking',
                      'Extra fees for child seats',
                      'Multiple stops possible',
                      'Business hours support',
                      'Outdated systems',
                      'English only',
                      'Basic service'
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-center">
                        <span className="w-5 h-5 mr-3 text-red-400">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Areas We Serve */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Hibiscus Coast Areas We Serve
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            From Silverdale to Gulf Harbour, we cover every corner of the Hibiscus Coast
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {['Orewa', 'Whangaparaoa', 'Silverdale', 'Gulf Harbour', 'Red Beach', 'Stanmore Bay', 'Manly', 'Army Bay', 'Arkles Bay', 'Tindalls Beach', 'Matakatia Bay', 'Big Manly'].map((area, idx) => (
              <div key={idx} className="bg-white/10 rounded-lg p-4 text-center hover:bg-gold/20 transition-colors">
                <MapPin className="w-5 h-5 mx-auto mb-2 text-gold" />
                <span className="font-medium">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Hibiscus Coast Shuttle <span className="text-gold">FAQs</span>
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much is a shuttle from Hibiscus Coast to Auckland Airport?',
                a: 'Our prices are calculated based on distance for Gulf Harbour. All prices are fixed with no surge charges or hidden fees.'
              },
              {
                q: 'How long does it take to get from Hibiscus Coast to Auckland Airport?',
                a: 'Travel time varies by suburb. From Silverdale it\'s about 35-45 minutes, from Orewa 40-50 minutes, and from Whangaparaoa/Gulf Harbour 50-60 minutes depending on traffic.'
              },
              {
                q: 'Do you offer early morning airport pickups from Hibiscus Coast?',
                a: 'Yes! We operate 24/7. Whether your flight is at 5am or 11pm, we\'ll be there on time. Early morning pickups are our specialty.'
              },
              {
                q: 'Is your Hibiscus Coast shuttle service private or shared?',
                a: 'All our transfers are 100% private. You won\'t share with strangers or make multiple stops. It\'s direct door-to-door service.'
              },
              {
                q: 'Can you pick up from Auckland Airport to Hibiscus Coast?',
                a: 'Absolutely! We provide both airport drop-offs and pickups. We monitor your flight and adjust for delays at no extra charge.'
              }
            ].map((faq, idx) => (
              <Card key={idx}>
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
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Book Your Hibiscus Coast Shuttle?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of Hibiscus Coast locals who trust BookaRide for their airport transfers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-now">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white font-bold text-lg px-8">
                Book Online Now
                <Plane className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="/book-now">
              <Button size="lg" variant="outline" className="border-black text-black hover:bg-black hover:text-white font-bold">
                <Phone className="mr-2 w-5 h-5" />
                Book Online
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HibiscusCoastShuttlePage;
