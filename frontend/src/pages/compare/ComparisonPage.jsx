import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { 
  CheckCircle, XCircle, ArrowRight, Phone, Star,
  ChevronRight, Clock, DollarSign, Shield, Users,
  Car, Plane, Award, ThumbsUp
} from 'lucide-react';

const comparisons = {
  'bookaride-vs-supershuttle': {
    slug: 'bookaride-vs-supershuttle',
    title: 'BookaRide vs SuperShuttle | Which Auckland Airport Shuttle is Better?',
    h1: 'BookaRide vs SuperShuttle Comparison',
    metaDescription: 'Compare BookaRide and SuperShuttle for Auckland airport transfers. See pricing, service differences, and why travelers choose private over shared shuttles.',
    competitor: 'SuperShuttle',
    competitorLogo: '🚐',
    intro: "Choosing between BookaRide and SuperShuttle? Here's an honest comparison to help you decide which Auckland airport transfer service is right for you.",
    comparison: [
      { feature: 'Service Type', bookaride: 'Private door-to-door', competitor: 'Shared (2-3 stops)', winner: 'bookaride' },
      { feature: 'Wait Time', bookaride: 'Direct to your address', competitor: 'Stops at other addresses first', winner: 'bookaride' },
      { feature: 'Price (North Shore)', bookaride: 'From $65', competitor: 'From $33', winner: 'competitor' },
      { feature: 'Multi-Stop Booking', bookaride: 'Yes - pick up multiple addresses', competitor: 'No - single pickup only', winner: 'bookaride' },
      { feature: 'Flight Tracking', bookaride: 'Yes - we monitor your flight', competitor: 'Limited', winner: 'bookaride' },
      { feature: 'Child Seats', bookaride: 'Available on request', competitor: 'Not guaranteed', winner: 'bookaride' },
      { feature: 'Large Groups (8+)', bookaride: 'Up to 11 passengers', competitor: 'Limited capacity', winner: 'bookaride' },
      { feature: 'Privacy', bookaride: 'Just you & your group', competitor: 'Shared with strangers', winner: 'bookaride' },
      { feature: 'Luggage Space', bookaride: 'Guaranteed for your bags', competitor: 'Shared space', winner: 'bookaride' },
      { feature: 'Return Trip Booking', bookaride: 'Easy - book both ways', competitor: 'Separate bookings', winner: 'bookaride' }
    ],
    verdict: "SuperShuttle is a budget-friendly option if you don't mind sharing and making extra stops. But if you value your time, privacy, and want a premium experience, BookaRide is the clear winner. For families, groups, or business travelers, the small price difference is well worth it.",
    whenToChooseUs: [
      'You have an early morning flight and need guaranteed pickup',
      'You\'re travelling with family or kids',
      'You have multiple pickup addresses',
      'You want privacy and comfort after a long flight',
      'You have lots of luggage or sports equipment'
    ],
    whenToChooseThem: [
      'Budget is your only concern',
      'You\'re a solo traveler with minimal luggage',
      'You don\'t mind waiting for other passengers'
    ]
  },
  'bookaride-vs-uber': {
    slug: 'bookaride-vs-uber',
    title: 'BookaRide vs Uber | Best Auckland Airport Transfer Option',
    h1: 'BookaRide vs Uber for Airport Transfers',
    metaDescription: 'Should you book a shuttle or use Uber for Auckland Airport? Compare reliability, pricing, and service. See why pre-booking beats rideshare.',
    competitor: 'Uber',
    competitorLogo: '📱',
    intro: "Uber is convenient for everyday trips, but is it the best choice for airport transfers? Here's how BookaRide compares.",
    comparison: [
      { feature: 'Guaranteed Availability', bookaride: 'Yes - pre-booked', competitor: 'Depends on driver availability', winner: 'bookaride' },
      { feature: 'Fixed Price', bookaride: 'Yes - no surprises', competitor: 'Variable - surge pricing common', winner: 'bookaride' },
      { feature: 'Early Morning (4-5am)', bookaride: 'Guaranteed service', competitor: 'Limited drivers available', winner: 'bookaride' },
      { feature: 'Flight Delay Handling', bookaride: 'We monitor and wait free', competitor: 'Need to re-book', winner: 'bookaride' },
      { feature: 'Large Luggage', bookaride: 'Guaranteed space', competitor: 'Depends on vehicle', winner: 'bookaride' },
      { feature: 'Spontaneous Booking', bookaride: 'Pre-booking required', competitor: 'Book anytime', winner: 'competitor' },
      { feature: 'Meet & Greet Option', bookaride: 'Available', competitor: 'No', winner: 'bookaride' },
      { feature: 'Multi-Stop', bookaride: 'Included in quote', competitor: 'Extra charges per stop', winner: 'bookaride' },
      { feature: 'Child Seats', bookaride: 'Can be arranged', competitor: 'Rarely available', winner: 'bookaride' },
      { feature: 'Receipt for Business', bookaride: 'Professional invoice', competitor: 'Digital receipt', winner: 'tie' }
    ],
    verdict: "Uber is great for spontaneous city trips, but for airport transfers - especially early mornings, with families, or after long flights - BookaRide's guaranteed service, fixed pricing, and flight monitoring provides peace of mind that's worth every dollar.",
    whenToChooseUs: [
      'You have an early morning or late night flight',
      'You want to know the exact price before booking',
      'Your flight might be delayed',
      'You need child seats or extra luggage space',
      'You\'re travelling with a group'
    ],
    whenToChooseThem: [
      'You need a last-minute ride in the city',
      'You\'re comfortable with variable pricing',
      'You\'re traveling light and solo'
    ]
  },
  'bookaride-vs-taxi': {
    slug: 'bookaride-vs-taxi',
    title: 'Shuttle vs Taxi from Auckland Airport | Price & Service Comparison',
    h1: 'BookaRide Shuttle vs Auckland Airport Taxi',
    metaDescription: 'Compare shuttle and taxi options for Auckland Airport. See why pre-booked shuttles beat taxi ranks for reliability, pricing and service.',
    competitor: 'Taxi',
    competitorLogo: '🚕',
    intro: "Taxis are the traditional airport transport, but are they still the best option? Here's how a pre-booked shuttle compares.",
    comparison: [
      { feature: 'Price Type', bookaride: 'Fixed - know before you go', competitor: 'Metered - varies with traffic', winner: 'bookaride' },
      { feature: 'Availability', bookaride: 'Pre-booked guarantee', competitor: 'Queue at taxi rank', winner: 'bookaride' },
      { feature: 'Peak Hour Cost', bookaride: 'Same price always', competitor: 'Higher during traffic', winner: 'bookaride' },
      { feature: 'To North Shore', bookaride: 'From $65 fixed', competitor: '$80-120+ metered', winner: 'bookaride' },
      { feature: 'Local Knowledge', bookaride: 'North Shore specialists', competitor: 'Variable', winner: 'bookaride' },
      { feature: 'No Pre-booking', bookaride: 'Pre-booking required', competitor: 'Just show up', winner: 'competitor' },
      { feature: 'Vehicle Quality', bookaride: 'Modern fleet', competitor: 'Varies', winner: 'bookaride' },
      { feature: 'Flight Tracking', bookaride: 'Included', competitor: 'No', winner: 'bookaride' },
      { feature: 'Payment Options', bookaride: 'Card, online, invoice', competitor: 'Card or cash', winner: 'tie' }
    ],
    verdict: "Taxis offer flexibility but with uncertainty - you never know the final price until you arrive. BookaRide's fixed pricing, flight tracking, and guaranteed availability makes it the smarter choice for airport transfers.",
    whenToChooseUs: [
      'You want to know exactly what you\'ll pay',
      'You don\'t want to queue at the taxi rank',
      'You\'re going to North Shore or Hibiscus Coast',
      'You have a specific pickup time',
      'You want vehicle and driver quality guarantee'
    ],
    whenToChooseThem: [
      'You didn\'t pre-book and need a ride now',
      'You prefer to pay cash',
      'Very short trips within the airport area'
    ]
  }
};

const ComparisonPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace('/', '');
  const data = comparisons[slug];
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Comparison not found</h1>
          <Link to="/" className="text-gold hover:underline">Return to home</Link>
        </div>
      </div>
    );
  }

  const bookarideWins = data.comparison.filter(c => c.winner === 'bookaride').length;
  const competitorWins = data.comparison.filter(c => c.winner === 'competitor').length;

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{data.title}</title>
        <meta name="description" content={data.metaDescription} />
        <link rel="canonical" href={`https://bookaride.co.nz/${data.slug}`} />
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <nav className="flex items-center justify-center text-sm text-gray-400 mb-6">
            <Link to="/" className="hover:text-gold">Home</Link>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gold">Compare</span>
          </nav>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{data.h1}</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">{data.intro}</p>
          
          {/* Score Summary */}
          <div className="flex justify-center items-center gap-8 mt-10">
            <div className="text-center">
              <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold text-black">{bookarideWins}</span>
              </div>
              <p className="text-gold font-semibold">BookaRide</p>
            </div>
            <div className="text-4xl font-bold text-gray-500">vs</div>
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold">{competitorWins}</span>
              </div>
              <p className="text-gray-400 font-semibold">{data.competitor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Feature-by-Feature Comparison</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-gold">BookaRide</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-500">{data.competitor}</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((row, idx) => (
                  <tr key={idx} className={`border-b ${row.winner === 'bookaride' ? 'bg-gold/5' : ''}`}>
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.winner === 'bookaride' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        <span className={row.winner === 'bookaride' ? 'font-semibold text-green-700' : ''}>
                          {row.bookaride}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {row.winner === 'competitor' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        <span className={row.winner === 'competitor' ? 'font-semibold' : 'text-gray-600'}>
                          {row.competitor}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-gold">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Award className="w-8 h-8 text-gold mr-3" />
              Our Verdict
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">{data.verdict}</p>
          </div>
        </div>
      </section>

      {/* When to Choose */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-gold">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center text-gold">
                  <ThumbsUp className="w-6 h-6 mr-2" />
                  Choose BookaRide When...
                </h3>
                <ul className="space-y-3">
                  {data.whenToChooseUs.map((item, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center text-gray-500">
                  <span className="text-2xl mr-2">{data.competitorLogo}</span>
                  Choose {data.competitor} When...
                </h3>
                <ul className="space-y-3">
                  {data.whenToChooseThem.map((item, idx) => (
                    <li key={idx} className="flex items-start text-gray-600">
                      <span className="w-5 h-5 mr-3 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gold">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-black mb-6">Ready to Experience the BookaRide Difference?</h2>
          <p className="text-black/80 text-lg mb-8">Book your premium airport transfer in under 2 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/book">
              <Button className="bg-black hover:bg-gray-900 text-white font-bold px-8 py-4 text-lg">
                Book Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="tel:+6421743321">
              <Button variant="outline" className="border-black text-black hover:bg-black/10 px-8 py-4 text-lg">
                <Phone className="mr-2 w-5 h-5" /> +64 21 743 321
              </Button>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComparisonPage;