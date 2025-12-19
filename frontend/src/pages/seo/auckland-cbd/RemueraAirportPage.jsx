import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, ArrowRight, Check, Users } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import SEO from '../../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../../components/PageBreadcrumb';

const RemueraAirportPage = () => {
  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No surge pricing ever' },
    { icon: Clock, title: 'Flight Tracking', desc: 'We monitor your flight' },
    { icon: Shield, title: 'Professional', desc: 'Licensed & insured drivers' },
    { icon: Users, title: 'Any Group Size', desc: '1-11 passengers' },
  ];

  const popularPickups = [
    'Remuera Road',
    'Remuera Village',
    'Upland Road',
    'Victoria Avenue',
    'Market Road',
    'Ladies Mile',
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Remuera to Auckland Airport Shuttle | Private Transfer | BookaRide"
        description="Book your Remuera to Auckland Airport private transfer. Premium door-to-door service from Remuera Village, Upland Road. Get instant quote!"
        keywords="Remuera airport transfer, Remuera to Auckland Airport, Remuera shuttle, Remuera Village airport taxi, premium Auckland transfer"
        canonical="/remuera-to-airport"
      />

      <PageBreadcrumb 
        items={[
          { label: 'Auckland CBD', href: '/auckland-cbd-airport' },
          { label: 'Remuera' }
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
              <MapPin className="w-4 h-4" />
              Remuera, Auckland
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Remuera to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Premium transfers from Auckland's prestigious eastern suburb
            </p>
            <p className="text-gray-400 mb-8">
              ~18 minutes to airport • Instant online quotes • Professional drivers
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                  Get Instant Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
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
            <h2 className="text-3xl font-bold mb-8 text-center">Remuera Airport Transfer Service</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Remuera is one of Auckland's most prestigious suburbs, known for its beautiful homes, 
                tree-lined streets, and proximity to both the city and the eastern beaches. Residents 
                expect a certain level of service, and BookaRide delivers exactly that.
              </p>
              <p>
                Our premium airport transfer service from Remuera offers comfort, reliability, and 
                professionalism. Whether you're traveling for business or leisure, our drivers will 
                ensure you reach Auckland Airport in style and on time.
              </p>
            </div>

            <div className="mt-12">
              <h3 className="text-xl font-bold mb-4">Popular Pickup Locations in Remuera</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {popularPickups.map((loc, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-4 h-4 text-gold" />
                    <span>{loc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your Remuera Airport Transfer?</h2>
          <p className="text-gray-400 mb-8">Get an instant quote in seconds</p>
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

export default RemueraAirportPage;