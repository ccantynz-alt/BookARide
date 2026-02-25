import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, ArrowRight, Check, Users, Star } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import SEO from '../../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../../components/PageBreadcrumb';

const CordisHotelPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No surge pricing' },
    { icon: Clock, title: 'Flight Tracking', desc: 'Monitor delays' },
    { icon: Shield, title: 'Professional', desc: 'Licensed drivers' },
    { icon: Users, title: 'Any Group', desc: '1-11 passengers' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Cordis Auckland Airport Shuttle | 5-Star Hotel Transfer | BookaRide"
        description="Book your Cordis Auckland to Auckland Airport private transfer. Premium service from Auckland's luxury hotel. Get instant quote!"
        keywords="Cordis Auckland airport transfer, Cordis Hotel airport shuttle, Symonds Street hotel airport, luxury Auckland hotel transfer"
        canonical="/cordis-hotel-airport"
      />

      <PageBreadcrumb 
        items={[
          { label: 'Hotels', href: '/auckland-hotels-airport' },
          { label: 'Cordis Auckland' }
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
              <Star className="w-4 h-4" />
              5-Star Luxury Transfer
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Cordis Auckland to <span className="text-gold">Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Premium transfers from Auckland's award-winning luxury hotel
            </p>
            <p className="text-gray-400 mb-8">
              ~22 minutes to airport • Lobby pickup • Luggage assistance
            </p>

            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                Get Instant Quote <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
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
            <h2 className="text-3xl font-bold mb-8 text-center">Cordis Auckland Airport Transfers</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Cordis Auckland (formerly Langham Auckland) is one of New Zealand's finest 5-star hotels, 
                located on Symonds Street with easy access to the CBD and motorways. The hotel is renowned 
                for its exceptional service, and your airport transfer should match that standard.
              </p>
              <p>
                BookaRide provides premium private transfers that complement your Cordis experience. Our 
                professional drivers will meet you in the lobby, handle your luggage, and ensure a smooth, 
                comfortable journey to Auckland Airport.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Book Your Cordis Auckland Transfer</h2>
          <p className="text-gray-400 mb-8">Premium service at fixed prices</p>
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

export default CordisHotelPage;