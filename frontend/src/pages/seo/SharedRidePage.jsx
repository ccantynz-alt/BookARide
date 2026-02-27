import React from 'react';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Link } from 'react-router-dom';
import { Users, DollarSign, Clock, Leaf, MapPin, Star, CheckCircle, ArrowRight, Plane } from 'lucide-react';
import { Button } from '../../components/ui/button';

const SharedRidePage = () => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Shared Ride Airport Transfer",
    "name": "Shared Ride to Auckland Airport",
    "description": "Affordable shared ride service to Auckland Airport. Share your journey with other travelers and save up to 50% on airport transfers.",
    "provider": {
      "@type": "LocalBusiness",
      "name": "Book A Ride NZ",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "2847"
      }
    },
    "areaServed": { "@type": "City", "name": "Auckland" },
    "offers": {
      "@type": "Offer",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "NZD",
        "price": "25",
        "description": "Starting price per person for shared ride"
      }
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is a shared ride to the airport?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "A shared ride is an airport transfer where you share the vehicle with other passengers heading in the same direction. This makes it more affordable than a private transfer while still offering door-to-door service."
        }
      },
      {
        "@type": "Question",
        "name": "How much can I save with a shared ride?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Shared rides typically cost 30-50% less than private transfers. For example, a North Shore to airport trip might cost $45 for a shared ride vs $85 for a private transfer."
        }
      },
      {
        "@type": "Question",
        "name": "How many stops does a shared ride make?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Shared rides typically make 2-4 stops maximum, picking up or dropping off other passengers along the route. We optimize routes to minimize travel time while keeping prices low."
        }
      },
      {
        "@type": "Question",
        "name": "Is shared ride available for early morning flights?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Our shared ride service operates 24/7, including early morning departures. We match you with other passengers on similar schedules."
        }
      }
    ]
  };

  const benefits = [
    { icon: DollarSign, title: 'Save Up to 50%', desc: 'Pay less by sharing the journey with other travelers' },
    { icon: Users, title: 'Meet Fellow Travelers', desc: 'Share the ride with other passengers going your way' },
    { icon: Leaf, title: 'Eco-Friendly', desc: 'Reduce your carbon footprint with shared transport' },
    { icon: MapPin, title: 'Door-to-Door', desc: 'Still picked up from your exact address' },
    { icon: Clock, title: 'Reliable Timing', desc: 'We factor in stops to ensure you arrive on time' },
    { icon: Star, title: 'Same Great Service', desc: 'Professional drivers and clean vehicles' }
  ];

  const comparisonData = [
    { feature: 'Price', shared: 'From $25/person', private: 'From $55 total' },
    { feature: 'Other passengers', shared: 'Yes (2-4 stops)', private: 'No - direct route' },
    { feature: 'Travel time', shared: '+15-30 mins', private: 'Fastest route' },
    { feature: 'Best for', shared: 'Solo/budget travelers', private: 'Groups/families' },
    { feature: 'Door-to-door', shared: '✓', private: '✓' },
    { feature: 'Flight monitoring', shared: '✓', private: '✓' }
  ];

  return (
    <>
      <Helmet>
        <title>Shared Ride to Airport Auckland | Save 50% | Book A Ride</title>
        <meta name="description" content="Save up to 50% with our shared ride airport service. Share the journey with other travelers, from $25 per person. Door-to-door service, professional drivers. Book now!" />
        <meta name="keywords" content="shared ride, shared ride auckland, shared ride to airport, shared airport transfer, cheap airport ride, budget airport transfer, share ride auckland" />
        <link rel="canonical" href="https://bookaride.co.nz/shared-ride" />
        
        <meta property="og:title" content="Shared Ride to Airport Auckland | Save 50%" />
        <meta property="og:description" content="Save up to 50% with shared rides to Auckland Airport. From $25 per person." />
        <meta property="og:url" content="https://bookaride.co.nz/shared-ride" />
        
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-br from-green-600 via-green-700 to-teal-700 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
                <Leaf className="w-4 h-4" />
                <span className="text-sm font-medium">Eco-Friendly & Budget-Friendly</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Shared Ride
                <span className="text-green-300"> to Airport</span>
              </h1>
              
              <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
                Save up to 50% on your airport transfer by sharing the ride with other travelers. 
                Same professional service, lower price.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/book">
                  <Button size="lg" className="bg-white hover:bg-gray-100 text-green-700 font-bold px-8 py-6 text-lg">
                    <Users className="w-5 h-5 mr-2" />
                    Book Shared Ride
                  </Button>
                </Link>
                <Link to="/shared-shuttle">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                    View Shared Shuttle
                  </Button>
                </Link>
              </div>
              
              <p className="mt-6 text-green-200">
                From <span className="text-3xl font-bold text-white">$25</span> per person
              </p>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Shared Ride?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Shared Ride vs Private Transfer</h2>
            <p className="text-center text-gray-600 mb-12">Choose the option that suits your needs</p>
            <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-4 text-left font-semibold">Feature</th>
                    <th className="p-4 text-center font-semibold bg-green-50 text-green-700">Shared Ride</th>
                    <th className="p-4 text-center font-semibold">Private Transfer</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center bg-green-50">{row.shared}</td>
                      <td className="p-4 text-center">{row.private}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How Shared Ride Works</h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-4 gap-8">
              {[
                { step: '1', title: 'Book Online', desc: 'Select shared ride option when booking' },
                { step: '2', title: 'Get Matched', desc: 'We match you with travelers on similar routes' },
                { step: '3', title: 'Get Picked Up', desc: 'Driver arrives at your door at scheduled time' },
                { step: '4', title: 'Share & Save', desc: 'Enjoy the ride and arrive at the airport' }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Shared Ride FAQs</h2>
            <div className="max-w-3xl mx-auto space-y-6">
              {faqSchema.mainEntity.map((faq, index) => (
                <div key={index} className="bg-white border rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-3">{faq.name}</h3>
                  <p className="text-gray-600">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-green-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Save with Shared Ride?</h2>
            <p className="text-green-100 mb-8 max-w-2xl mx-auto">
              Book your shared ride now and save up to 50% on your airport transfer.
            </p>
            <Link to="/book">
              <Button size="lg" className="bg-white hover:bg-gray-100 text-green-700 font-bold px-8 py-6 text-lg">
                Book Shared Ride Now
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
};

export default SharedRidePage;
