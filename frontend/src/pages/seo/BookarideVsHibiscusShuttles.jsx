import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Clock, Shield, Star, MapPin, Phone, Car, Users, Plane, ArrowRight, Award, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export const BookarideVsHibiscusShuttles = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "BookaRide vs Hibiscus Shuttles - Honest Comparison 2025",
    "description": "Compare BookaRide with Hibiscus Shuttles for your Hibiscus Coast airport transfer. Features, pricing, and service comparison.",
    "author": {
      "@type": "Organization",
      "name": "Book a Ride NZ"
    }
  };

  const comparisonData = [
    { feature: 'Online Booking', bookaride: 'Instant 24/7', competitor: 'Limited/Phone' },
    { feature: 'Booking Confirmation', bookaride: 'Instant email + SMS', competitor: 'Email only' },
    { feature: 'Service Type', bookaride: 'Private only', competitor: 'Shared available' },
    { feature: 'Flight Tracking', bookaride: 'Automatic', competitor: 'Manual' },
    { feature: 'Price Transparency', bookaride: 'Fixed upfront', competitor: 'Quote required' },
    { feature: 'Child Seats', bookaride: 'Free on request', competitor: 'Extra charge' },
    { feature: 'Payment Options', bookaride: 'Card, Apple Pay, Google Pay', competitor: 'Card/Cash' },
    { feature: 'International Support', bookaride: '9 languages', competitor: 'English only' },
    { feature: 'Meet & Greet', bookaride: 'Available', competitor: 'Not offered' },
    { feature: 'Customer Portal', bookaride: 'Yes - manage bookings', competitor: 'No' },
    { feature: 'Real-time Updates', bookaride: 'SMS & Email', competitor: 'Phone call' },
    { feature: 'Cancellation Policy', bookaride: 'Free 24hr cancellation', competitor: 'Varies' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>BookaRide vs Hibiscus Shuttles - Honest Comparison 2025 | Which is Better?</title>
        <meta name="description" content="Detailed comparison of BookaRide vs Hibiscus Shuttles for Hibiscus Coast airport transfers. Compare features, pricing, reviews & service quality. Make an informed choice." />
        <meta name="keywords" content="bookaride vs hibiscus shuttles, hibiscus shuttles review, hibiscus coast shuttle comparison, best hibiscus coast airport shuttle" />
        <link rel="canonical" href="https://bookaride.co.nz/bookaride-vs-hibiscus-shuttles" />
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-black text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            BookaRide vs Hibiscus Shuttles
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            An honest, side-by-side comparison to help you choose the best Hibiscus Coast airport shuttle service
          </p>
          <div className="inline-flex items-center bg-gold/20 text-gold px-6 py-3 rounded-full">
            <Award className="w-5 h-5 mr-2" />
            Updated December 2025
          </div>
        </div>
      </section>

      {/* Quick Verdict */}
      <section className="py-12 bg-gold">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">⚡ Quick Verdict</h2>
            <p className="text-lg">
              <strong>BookaRide</strong> offers a more modern booking experience with instant online reservations, 
              guaranteed private transfers, and multilingual support for international visitors. 
              <strong> Hibiscus Shuttles</strong> is a traditional phone-based service that may suit those preferring 
              to speak with someone directly.
            </p>
          </div>
        </div>
      </section>

      {/* Head to Head Comparison */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Feature-by-Feature Comparison</h2>
          
          <div className="max-w-5xl mx-auto">
            {/* Header Row */}
            <div className="grid grid-cols-3 gap-4 mb-4 font-bold">
              <div className="p-4">Feature</div>
              <div className="p-4 bg-gold/10 rounded-t-lg text-center">
                <span className="text-gold">BookaRide</span>
              </div>
              <div className="p-4 bg-gray-100 rounded-t-lg text-center">Hibiscus Shuttles</div>
            </div>
            
            {/* Comparison Rows */}
            {comparisonData.map((row, idx) => (
              <div key={idx} className={`grid grid-cols-3 gap-4 ${idx % 2 === 0 ? 'bg-gray-50' : ''}`}>
                <div className="p-4 font-medium">{row.feature}</div>
                <div className="p-4 bg-gold/5 text-center">
                  <span className="inline-flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {row.bookaride}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 text-center text-gray-600">
                  {row.competitor}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Breakdown */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Detailed Breakdown</h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Zap className="w-6 h-6 text-gold mr-3" />
                  Booking Experience
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gold/10 p-6 rounded-lg">
                    <h4 className="font-bold text-gold mb-2">BookaRide</h4>
                    <p className="text-sm text-gray-700">
                      Modern online booking system available 24/7. Get instant quotes, book in under 60 seconds, 
                      receive immediate email and SMS confirmations. Manage your bookings online anytime.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <h4 className="font-bold text-gray-600 mb-2">Hibiscus Shuttles</h4>
                    <p className="text-sm text-gray-600">
                      Traditional booking via phone or email. May need to wait for quote responses. 
                      Confirmation typically sent via email during business hours.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Car className="w-6 h-6 text-gold mr-3" />
                  Service Type
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gold/10 p-6 rounded-lg">
                    <h4 className="font-bold text-gold mb-2">BookaRide</h4>
                    <p className="text-sm text-gray-700">
                      <strong>100% private transfers only.</strong> Your vehicle, your schedule. 
                      No sharing with strangers, no multiple stops. Direct door-to-door service every time.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <h4 className="font-bold text-gray-600 mb-2">Hibiscus Shuttles</h4>
                    <p className="text-sm text-gray-600">
                      Offers both shared and private options. Shared shuttles may include multiple 
                      pickups/drop-offs which can add time to your journey.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4 flex items-center">
                  <Users className="w-6 h-6 text-gold mr-3" />
                  International Visitors
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gold/10 p-6 rounded-lg">
                    <h4 className="font-bold text-gold mb-2">BookaRide</h4>
                    <p className="text-sm text-gray-700">
                      Dedicated landing pages in <strong>9 languages</strong> including Chinese, Japanese, Korean, German, and French. 
                      Perfect for international tourists visiting the Hibiscus Coast.
                    </p>
                  </div>
                  <div className="bg-gray-100 p-6 rounded-lg">
                    <h4 className="font-bold text-gray-600 mb-2">Hibiscus Shuttles</h4>
                    <p className="text-sm text-gray-600">
                      English-only website and support. International visitors may face 
                      communication challenges when booking.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Winner Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">Our Recommendation</h2>
          <Card className="max-w-3xl mx-auto border-2 border-gold">
            <CardContent className="p-8">
              <div className="flex justify-center mb-6">
                <div className="bg-gold text-black px-6 py-2 rounded-full font-bold flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  WINNER: BookaRide
                </div>
              </div>
              <p className="text-lg text-gray-700 mb-6">
                For <strong>convenience, technology, and service quality</strong>, BookaRide edges ahead 
                with its modern booking system, guaranteed private transfers, and extensive 
                international support. The instant online booking and transparent pricing make 
                it the clear choice for most travelers.
              </p>
              <p className="text-gray-600 mb-8">
                Hibiscus Shuttles remains a viable option for those who prefer traditional 
                phone bookings or need shared shuttle options for budget travel.
              </p>
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
                  Try BookaRide - Book Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Experience the BookaRide Difference</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of Hibiscus Coast locals and visitors who&apos;ve switched to BookaRide 
            for their airport transfers.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
                Book Your Transfer
                <Plane className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/hibiscus-coast-airport-shuttle">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
                View Hibiscus Coast Prices
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BookarideVsHibiscusShuttles;
