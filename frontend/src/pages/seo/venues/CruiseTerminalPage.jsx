import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, ArrowRight, Check, Users, Ship, Anchor } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import SEO from '../../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../../components/PageBreadcrumb';

const CruiseTerminalPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No hidden fees' },
    { icon: Clock, title: 'Ship Tracking', desc: 'Monitor arrivals' },
    { icon: Shield, title: 'Professional', desc: 'Licensed drivers' },
    { icon: Users, title: 'Group Transfers', desc: '1-11 passengers' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Auckland Cruise Terminal to Airport | Queens Wharf Shuttle | BookaRide"
        description="Book your Auckland Cruise Terminal to Airport transfer. Queens Wharf pickup, port shuttle service for cruise passengers. Get instant quote!"
        keywords="Auckland cruise terminal airport, Queens Wharf airport transfer, cruise ship airport shuttle, port Auckland airport taxi"
        canonical="/cruise-terminal-airport"
      />

      <PageBreadcrumb 
        items={[
          { label: 'Venues', href: '/auckland-venues-airport' },
          { label: 'Cruise Terminal' }
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
              <Ship className="w-4 h-4" />
              Cruise Transfers
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Cruise Terminal to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Seamless transfers from Queens Wharf to catch your flight
            </p>
            <p className="text-gray-400 mb-8">
              ~25 minutes to airport • Port pickup • Luggage handling
            </p>

            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                Get Instant Quote <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Meet at terminal</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Luggage assistance</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Ship arrival tracking</span>
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
            <h2 className="text-3xl font-bold mb-8 text-center">Auckland Cruise Terminal Airport Transfers</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Auckland's cruise terminal at Queens Wharf welcomes thousands of passengers each season. 
                Whether you're ending a cruise around New Zealand or joining a ship, connecting to Auckland 
                Airport is easy with BookaRide.
              </p>
              <p>
                We monitor ship arrivals and adjust for any delays, so you don't have to worry about your 
                pickup. Our drivers meet you at the terminal with space for all your luggage and transfer 
                you directly to the airport.
              </p>
              <h3>Cruise Lines We Service:</h3>
              <ul>
                <li>P&O Cruises</li>
                <li>Princess Cruises</li>
                <li>Celebrity Cruises</li>
                <li>Holland America</li>
                <li>Royal Caribbean</li>
                <li>And all other cruise lines</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Flying Out After Your Cruise?</h2>
          <p className="text-gray-400 mb-8">Book your cruise terminal to airport transfer now</p>
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

export default CruiseTerminalPage;