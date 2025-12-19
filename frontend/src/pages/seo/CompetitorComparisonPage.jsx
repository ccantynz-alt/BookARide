import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X, ArrowRight, Star, Clock, DollarSign, Users, Car, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import SEO from '../../components/SEO';
import PageBreadcrumb from '../../components/PageBreadcrumb';
import { FAQSchema } from '../../components/SEOSchema';
import { competitors } from '../../data/aucklandSuburbs';

const CompetitorComparisonPage = () => {
  const { competitor } = useParams();
  
  const competitorData = competitors.find(c => c.slug === competitor) || {
    name: 'Competitor',
    type: 'Shuttle Service',
    priceRange: '$40-$80',
    waitTime: 'Variable',
    vehicles: 'Shared'
  };

  const comparisonData = {
    bookaride: {
      name: 'BookaRide',
      privateService: true,
      fixedPricing: true,
      flightTracking: true,
      doorToDoor: true,
      noSharedRides: true,
      freeCancellation: true,
      meetAndGreet: true,
      instantQuote: true,
      onlineBooking: true,
      rating: '4.9',
      reviews: '500+'
    },
    competitor: {
      name: competitorData.name,
      privateService: competitor !== 'supershuttle' && competitor !== 'skybus',
      fixedPricing: competitor !== 'uber' && competitor !== 'taxi',
      flightTracking: competitor === 'supershuttle',
      doorToDoor: competitor !== 'skybus',
      noSharedRides: competitor !== 'supershuttle' && competitor !== 'skybus',
      freeCancellation: competitor === 'supershuttle',
      meetAndGreet: competitor === 'supershuttle',
      instantQuote: competitor !== 'taxi',
      onlineBooking: true,
      rating: competitor === 'supershuttle' ? '3.7' : competitor === 'skybus' ? '4.0' : '4.2',
      reviews: competitor === 'supershuttle' ? '485' : '200+'
    }
  };

  const faqs = [
    {
      question: `Is BookaRide better than ${competitorData.name}?`,
      answer: `BookaRide offers private door-to-door service with fixed pricing and flight tracking. Unlike ${competitorData.name}, you won't share your ride with strangers or make multiple stops. For travelers who value comfort, reliability, and direct service, BookaRide is the premium choice.`
    },
    {
      question: `How much cheaper is BookaRide compared to ${competitorData.name}?`,
      answer: `BookaRide offers competitive fixed prices with private door-to-door service. Get an instant quote online - prices vary by distance. For groups of 2+, the per-person cost is often comparable or better than ${competitorData.name}, with superior private service.`
    },
    {
      question: `What makes BookaRide different from ${competitorData.name}?`,
      answer: `BookaRide provides private transfers (no sharing), real-time flight tracking, professional licensed drivers, and 24/7 availability. We pick you up from your exact address and take you directly to the airport without stops.`
    }
  ];

  const FeatureRow = ({ feature, label, bookaride, competitor }) => (
    <tr className="border-b">
      <td className="py-4 px-4 font-medium">{label}</td>
      <td className="py-4 px-4 text-center">
        {bookaride ? (
          <Check className="w-6 h-6 text-green-500 mx-auto" />
        ) : (
          <X className="w-6 h-6 text-red-500 mx-auto" />
        )}
      </td>
      <td className="py-4 px-4 text-center">
        {competitor ? (
          <Check className="w-6 h-6 text-green-500 mx-auto" />
        ) : (
          <X className="w-6 h-6 text-red-500 mx-auto" />
        )}
      </td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`BookaRide vs ${competitorData.name} | Auckland Airport Transfer Comparison`}
        description={`Compare BookaRide vs ${competitorData.name} for Auckland Airport transfers. See pricing, features, and service differences. Find out which is better for your trip.`}
        keywords={`bookaride vs ${competitorData.name.toLowerCase()}, ${competitorData.name.toLowerCase()} alternative, auckland airport shuttle comparison, best airport transfer auckland`}
        canonical={`/bookaride-vs-${competitor}`}
      />
      
      <FAQSchema faqs={faqs} />

      <PageBreadcrumb 
        items={[
          { label: 'Compare', href: '/compare' },
          { label: `vs ${competitorData.name}` }
        ]} 
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-black via-gray-900 to-black py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            BookaRide vs <span className="text-gold">{competitorData.name}</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Auckland Airport Transfer Comparison - Which is Better?
          </p>
          <div className="flex justify-center gap-4">
            <div className="bg-gold text-black px-6 py-3 rounded-lg font-bold">
              <Star className="w-5 h-5 inline mr-2" />
              BookaRide: {comparisonData.bookaride.rating}/5 ({comparisonData.bookaride.reviews} reviews)
            </div>
            <div className="bg-gray-700 text-white px-6 py-3 rounded-lg">
              <Star className="w-5 h-5 inline mr-2" />
              {competitorData.name}: {comparisonData.competitor.rating}/5
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-4 px-4 text-left">Feature</th>
                    <th className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gold">BookaRide</span>
                        <span className="text-sm text-gray-500">Premium Choice</span>
                      </div>
                    </th>
                    <th className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold">{competitorData.name}</span>
                        <span className="text-sm text-gray-500">{competitorData.type}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <FeatureRow label="Private Service (No Sharing)" bookaride={comparisonData.bookaride.noSharedRides} competitor={comparisonData.competitor.noSharedRides} />
                  <FeatureRow label="Fixed Pricing (No Surge)" bookaride={comparisonData.bookaride.fixedPricing} competitor={comparisonData.competitor.fixedPricing} />
                  <FeatureRow label="Real-Time Flight Tracking" bookaride={comparisonData.bookaride.flightTracking} competitor={comparisonData.competitor.flightTracking} />
                  <FeatureRow label="Door-to-Door Service" bookaride={comparisonData.bookaride.doorToDoor} competitor={comparisonData.competitor.doorToDoor} />
                  <FeatureRow label="Free Cancellation" bookaride={comparisonData.bookaride.freeCancellation} competitor={comparisonData.competitor.freeCancellation} />
                  <FeatureRow label="Meet & Greet Option" bookaride={comparisonData.bookaride.meetAndGreet} competitor={comparisonData.competitor.meetAndGreet} />
                  <FeatureRow label="Instant Online Quote" bookaride={comparisonData.bookaride.instantQuote} competitor={comparisonData.competitor.instantQuote} />
                </tbody>
              </table>
            </div>

            <div className="mt-8 text-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
                  Get Your Instant Quote <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Experience the BookaRide Difference?</h2>
          <p className="text-gray-400 mb-8">Join thousands of happy customers who chose premium service</p>
          <Link to="/book-now">
            <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
              Book Now <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default CompetitorComparisonPage;
