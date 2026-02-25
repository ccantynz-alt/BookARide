import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Clock, Shield, Star, MapPin, Phone, Car, Plane, ArrowRight, Award, Trophy, ThumbsUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';

export const BestHibiscusCoastShuttle = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Best Hibiscus Coast Airport Shuttle Service 2025",
    "description": "Complete guide to the best airport shuttle services from Hibiscus Coast to Auckland Airport. Compare top providers and book the best service.",
    "author": {
      "@type": "Organization",
      "name": "Book a Ride NZ"
    }
  };

  const topPicks = [
    {
      rank: 1,
      name: 'BookaRide',
      rating: 4.9,
      price: 'Get Instant Quote',
      pros: ['Instant online booking', 'Private transfers only', '24/7 service', 'Flight tracking', 'Free child seats', '9 language support'],
      cons: ['Premium pricing'],
      verdict: 'Best overall choice for convenience and reliability',
      link: '/book-now',
      highlight: true
    },
    {
      rank: 2,
      name: 'SuperShuttle',
      rating: 4.2,
      price: 'Get Instant Quote',
      pros: ['Budget friendly', 'Nationwide service', 'Online booking'],
      cons: ['Shared service', 'Multiple stops', 'Variable timing'],
      verdict: 'Good for budget travelers willing to share',
      link: null,
      highlight: false
    },
    {
      rank: 3,
      name: 'Hibiscus Shuttles',
      rating: 4.0,
      price: 'Quote required',
      pros: ['Local knowledge', 'Established service'],
      cons: ['Phone booking mainly', 'Limited online presence', 'Shared options'],
      verdict: 'Traditional option for those preferring phone bookings',
      link: null,
      highlight: false
    }
  ];

  const factors = [
    { icon: Clock, title: 'Reliability', desc: 'On-time performance and flight tracking capability' },
    { icon: Shield, title: 'Safety', desc: 'Licensed drivers, insured vehicles, professional service' },
    { icon: Star, title: 'Reviews', desc: 'Customer ratings and testimonials' },
    { icon: Car, title: 'Vehicle Quality', desc: 'Modern, clean, comfortable vehicles' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Best Hibiscus Coast Airport Shuttle 2025 | Top 3 Services Compared</title>
        <meta name="description" content="Find the best Hibiscus Coast airport shuttle service in 2025. We compare top providers on price, reliability, reviews & features. Book the #1 rated service today." />
        <meta name="keywords" content="best hibiscus coast shuttle, top hibiscus coast airport transfer, hibiscus coast shuttle reviews, recommended hibiscus coast shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/best-hibiscus-coast-shuttle-service" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center bg-gold/20 text-gold px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Trophy className="w-4 h-4 mr-2" />
            2025 Rankings
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Best Hibiscus Coast <span className="text-gold">Airport Shuttle</span> Services
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We&apos;ve researched, tested, and compared every shuttle service from Hibiscus Coast 
            to Auckland Airport so you don&apos;t have to.
          </p>
        </div>
      </section>

      {/* Winner Banner */}
      <section className="bg-gold py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <Trophy className="w-8 h-8" />
            <span className="text-xl font-bold">2025 Winner: BookaRide</span>
            <span className="text-sm">- Best Overall Hibiscus Coast Airport Shuttle</span>
            <Link to="/book-now">
              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* What We Consider */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How We Ranked These Services</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our rankings are based on real customer experiences, service quality, and value for money
          </p>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {factors.map((factor, idx) => (
              <Card key={idx}>
                <CardContent className="p-6 text-center">
                  <factor.icon className="w-10 h-10 mx-auto mb-4 text-gold" />
                  <h3 className="font-bold mb-2">{factor.title}</h3>
                  <p className="text-sm text-gray-600">{factor.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Top Picks */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Top 3 Hibiscus Coast Shuttle Services
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            {topPicks.map((service) => (
              <Card 
                key={service.rank} 
                className={`overflow-hidden ${service.highlight ? 'border-2 border-gold ring-2 ring-gold/20' : ''}`}
              >
                {service.highlight && (
                  <div className="bg-gold text-black text-center py-2 font-bold flex items-center justify-center">
                    <Award className="w-5 h-5 mr-2" />
                    EDITOR&apos;S CHOICE - Best Overall
                  </div>
                )}
                <CardContent className="p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${service.highlight ? 'bg-gold text-black' : 'bg-gray-200 text-gray-700'}`}>
                        #{service.rank}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{service.name}</h3>
                        <div className="flex items-center mt-1">
                          <div className="flex text-gold">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < Math.floor(service.rating) ? 'fill-current' : ''}`} />
                            ))}
                          </div>
                          <span className="ml-2 text-sm font-medium">{service.rating}/5</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gold">{service.price}</p>
                      <p className="text-sm text-gray-500">to Auckland Airport</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2 flex items-center">
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Pros
                      </h4>
                      <ul className="space-y-1">
                        {service.pros.map((pro, idx) => (
                          <li key={idx} className="text-sm flex items-center text-gray-700">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-600 mb-2">Cons</h4>
                      <ul className="space-y-1">
                        {service.cons.map((con, idx) => (
                          <li key={idx} className="text-sm flex items-center text-gray-600">
                            <span className="w-4 h-4 mr-2 text-orange-400">•</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
                    <p className="text-gray-700">
                      <strong>Verdict:</strong> {service.verdict}
                    </p>
                    {service.link && (
                      <Link to={service.link}>
                        <Button className={service.highlight ? 'bg-gold hover:bg-yellow-500 text-black' : ''}>
                          Book Now
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why BookaRide Wins */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why BookaRide is #1 for Hibiscus Coast
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="font-bold text-lg mb-2">60-Second Booking</h3>
                <p className="text-gray-400 text-sm">
                  Book online instantly, anytime. No waiting for quotes or callbacks.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <Car className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="font-bold text-lg mb-2">Always Private</h3>
                <p className="text-gray-400 text-sm">
                  Never share your ride. Direct door-to-door service every time.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 border-0">
              <CardContent className="p-6 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-gold" />
                <h3 className="font-bold text-lg mb-2">Fixed Pricing</h3>
                <p className="text-gray-400 text-sm">
                  No surge pricing, no hidden fees. Know your cost upfront.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book the Best?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Experience why BookaRide is rated #1 for Hibiscus Coast airport transfers
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-now">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white font-bold">
                Book BookaRide Now
                <Plane className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="/book-now">
              <Button size="lg" variant="outline" className="border-black text-black hover:bg-black hover:text-white">
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

export default BestHibiscusCoastShuttle;
