import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, ArrowRight, Check, Users, Trophy } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import SEO from '../../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../../components/PageBreadcrumb';

const EdenParkPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No event surge pricing' },
    { icon: Clock, title: 'Flexible Timing', desc: 'Wait for match end' },
    { icon: Shield, title: 'Professional', desc: 'Licensed drivers' },
    { icon: Users, title: 'Groups Welcome', desc: '1-11 passengers' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Eden Park to Auckland Airport | Stadium Shuttle | BookaRide"
        description="Book your Eden Park to Auckland Airport transfer. Perfect for All Blacks, cricket, concerts. No surge pricing after events. Get instant quote!"
        keywords="Eden Park airport transfer, Eden Park shuttle, All Blacks stadium airport, rugby match airport taxi, concert Eden Park transfer"
        canonical="/eden-park-airport"
      />

      <PageBreadcrumb 
        items={[
          { label: 'Venues', href: '/auckland-venues-airport' },
          { label: 'Eden Park' }
        ]} 
      />

      <section className="relative bg-gradient-to-br from-black via-gray-900 to-black py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/30 to-transparent" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Trophy className="w-4 h-4" />
              Stadium Transfers
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Eden Park to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Skip the post-match chaos with pre-booked airport transfers
            </p>
            <p className="text-gray-400 mb-8">
              All Blacks • Black Caps • Concerts • Events • No surge pricing
            </p>

            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                Get Instant Quote <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> No surge pricing</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Pre-arranged pickup spot</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Flight tracking</span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <f.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-gray-600 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Eden Park Airport Transfer Service</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Eden Park is New Zealand's largest stadium and home to the All Blacks rugby team. After 
                an exhilarating match or concert, the last thing you want is to battle for a taxi or 
                pay surge prices on rideshare apps.
              </p>
              <p>
                BookaRide offers pre-booked airport transfers at fixed prices - no matter when the event 
                ends. We'll arrange a pickup point near the stadium and ensure you get to Auckland Airport 
                stress-free, even after sold-out events.
              </p>
              <h3>Events We Cover:</h3>
              <ul>
                <li>All Blacks & Blues rugby matches</li>
                <li>Black Caps cricket internationals</li>
                <li>Major concerts and festivals</li>
                <li>Corporate events</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Heading to the Airport After an Event?</h2>
          <p className="text-gray-400 mb-8">Book ahead and skip the post-match chaos</p>
          <Link to="/book-now">
            <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold">
              Get Instant Quote <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default EdenParkPage;