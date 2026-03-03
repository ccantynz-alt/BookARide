import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { Card, CardContent } from '../../components/ui/card';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ArrowRight, Award, CheckCircle, XCircle } from 'lucide-react';

const comparisons = [
  {
    slug: 'bookaride-vs-supershuttle',
    title: 'BookaRide vs SuperShuttle',
    competitor: 'SuperShuttle',
    competitorLogo: '🚐',
    summary: 'Private vs shared shuttle comparison',
    bookarideWins: 9,
    competitorWins: 1
  },
  {
    slug: 'bookaride-vs-uber',
    title: 'BookaRide vs Uber',
    competitor: 'Uber',
    competitorLogo: '📱',
    summary: 'Pre-booked shuttle vs rideshare',
    bookarideWins: 8,
    competitorWins: 1
  },
  {
    slug: 'bookaride-vs-taxi',
    title: 'BookaRide vs Taxi',
    competitor: 'Taxi',
    competitorLogo: '🚕',
    summary: 'Fixed price shuttle vs metered taxi',
    bookarideWins: 7,
    competitorWins: 1
  }
];

const ComparisonDirectory = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Auckland Airport Transfer Comparisons | BookaRide vs Competitors</title>
        <meta name="description" content="Compare Auckland airport transfer options. See how BookaRide compares to SuperShuttle, Uber, and Taxis for price, service, and reliability." />
        <link rel="canonical" href="https://bookaride.co.nz/compare" />
      </Helmet>

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How Does BookaRide <span className="text-gold">Compare?</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Honest comparisons to help you choose the best Auckland airport transfer option.
          </p>
        </div>
      </section>

      {/* Comparisons Grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {comparisons.map((comp) => (
              <Link key={comp.slug} to={`/${comp.slug}`}>
                <Card className="h-full hover:shadow-xl transition-all hover:border-gold cursor-pointer overflow-hidden">
                  <div className="h-32 bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-black">B</span>
                      </div>
                      <span className="text-3xl text-gray-400">vs</span>
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{comp.competitorLogo}</span>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-2">{comp.title}</h2>
                    <p className="text-gray-600 mb-4">{comp.summary}</p>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-semibold text-green-600">{comp.bookarideWins}</span>
                      </div>
                      <span className="text-gray-400">vs</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-600">{comp.competitorWins}</span>
                        <span className="text-gray-400">({comp.competitor})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gold font-semibold">
                      View Full Comparison <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Compare Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Award className="w-16 h-16 text-gold mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Why We're Confident in Comparisons</h2>
          <p className="text-xl text-gray-600 mb-8">
            We're not afraid to show you how we stack up against the competition. We believe in transparency and letting the facts speak for themselves.
          </p>
          <Link to="/book-now">
            <button className="bg-gold hover:bg-gold/90 text-black font-bold px-8 py-4 rounded-lg text-lg">
              Try BookaRide Today <ArrowRight className="w-5 h-5 inline ml-2" />
            </button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ComparisonDirectory;
