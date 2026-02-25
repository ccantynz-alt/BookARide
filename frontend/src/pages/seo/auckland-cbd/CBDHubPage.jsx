import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Building2, Coffee, ShoppingBag, Waves, Mountain, GraduationCap } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import SEO from '../../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../../components/PageBreadcrumb';

const CBDHubPage = () => {
  const suburbs = [
    { name: 'Ponsonby', slug: 'ponsonby-to-airport', icon: Coffee, desc: 'Trendy cafes & boutiques', time: '25 min' },
    { name: 'Parnell', slug: 'parnell-to-airport', icon: Building2, desc: 'Auckland\'s oldest suburb', time: '22 min' },
    { name: 'Newmarket', slug: 'newmarket-to-airport', icon: ShoppingBag, desc: 'Premier shopping district', time: '20 min' },
    { name: 'Grey Lynn', slug: 'grey-lynn-to-airport', icon: Coffee, desc: 'Creative inner-west', time: '25 min' },
    { name: 'Mt Eden', slug: 'mt-eden-to-airport', icon: Mountain, desc: 'Iconic volcanic suburb', time: '20 min' },
    { name: 'Remuera', slug: 'remuera-to-airport', icon: Building2, desc: 'Prestigious eastern suburb', time: '18 min' },
    { name: 'Epsom', slug: 'epsom-to-airport', icon: GraduationCap, desc: 'Top school zone', time: '17 min' },
    { name: 'Mission Bay', slug: 'mission-bay-to-airport', icon: Waves, desc: 'Beautiful beachside', time: '22 min' },
    { name: 'Viaduct & Wynyard', slug: 'viaduct-to-airport', icon: Building2, desc: 'Waterfront precinct', time: '25 min' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Auckland CBD Airport Transfers | All Suburbs | BookaRide NZ"
        description="Private airport transfers from all Auckland CBD suburbs. Ponsonby, Parnell, Newmarket, Grey Lynn, Mt Eden, Remuera, Epsom, Mission Bay. Get instant quote!"
        keywords="Auckland CBD airport transfer, Auckland city airport shuttle, Ponsonby airport, Parnell airport, Newmarket airport taxi"
        canonical="/auckland-cbd-airport"
      />

      <PageBreadcrumb items={[{ label: 'Auckland CBD Transfers' }]} />

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
              <Building2 className="w-4 h-4" />
              Auckland City
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Auckland CBD to <span className="text-gold">Airport Transfers</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Private door-to-door transfers from every Auckland suburb
            </p>
            <p className="text-gray-400 mb-8">
              Fixed prices • Flight tracking • Professional drivers • 24/7 service
            </p>

            <Link to="/book-now">
              <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                Get Instant Quote
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Choose Your Suburb</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {suburbs.map((suburb, i) => (
              <Link key={i} to={`/${suburb.slug}`}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <suburb.icon className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg mb-1">{suburb.name}</h3>
                        <p className="text-gray-600 text-sm mb-2">{suburb.desc}</p>
                        <div className="flex items-center gap-2 text-sm text-gold font-semibold">
                          <MapPin className="w-4 h-4" />
                          ~{suburb.time} to airport
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Why Choose BookaRide for Auckland CBD Transfers?</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Auckland's inner suburbs each have their own unique character, from the trendy cafes of 
                Ponsonby to the heritage charm of Parnell, the shopping mecca of Newmarket, and the 
                stunning waterfront of Mission Bay.
              </p>
              <p>
                BookaRide provides premium private airport transfers from every corner of Auckland city. 
                Our professional drivers know every suburb intimately and will ensure you reach Auckland 
                Airport comfortably, safely, and on time.
              </p>
              <ul>
                <li><strong>Fixed prices</strong> - No surge pricing, no surprises</li>
                <li><strong>Flight tracking</strong> - We monitor delays automatically</li>
                <li><strong>Door-to-door</strong> - From your exact address</li>
                <li><strong>24/7 service</strong> - Early morning and late night flights covered</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Auckland CBD Airport Transfer?</h2>
          <p className="text-gray-400 mb-8">Get an instant quote for any suburb in seconds</p>
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

export default CBDHubPage;