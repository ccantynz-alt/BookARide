import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Shield, Star, ArrowRight, Check, Car, Plane, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import SEO from '../../components/SEO';
import { motion } from 'framer-motion';
import PageBreadcrumb from '../../components/PageBreadcrumb';
import { FAQSchema, ServiceSchema, BreadcrumbSchema } from '../../components/SEOSchema';
import { aucklandSuburbs, commonFAQs } from '../../data/aucklandSuburbs';

const SuburbTransferPage = () => {
  const location = window.location.pathname;
  
  // Extract suburb from URL pattern (e.g., "/devonport-to-auckland-airport" -> "devonport")
  const pathMatch = location.match(/\/([a-z-]+)-to-auckland-airport/i);
  const suburb = pathMatch ? pathMatch[1] : '';
  
  // Find suburb data
  const suburbData = aucklandSuburbs.find(s => s.slug === suburb) || {
    name: suburb?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Auckland',
    region: 'Auckland',
    distance: 25,
    duration: '30 mins',
    keywords: []
  };

  const features = [
    { icon: DollarSign, title: 'Fixed Price', desc: 'No surge pricing ever' },
    { icon: Clock, title: 'Flight Tracking', desc: 'We monitor your flight' },
    { icon: Shield, title: 'Professional', desc: 'Licensed & insured' },
    { icon: Car, title: 'Private Transfer', desc: 'No shared rides' },
  ];

  // Filter FAQs relevant to this page
  const pageFAQs = commonFAQs.slice(0, 5);

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={`${suburbData.name} to Auckland Airport Transfer | Private Shuttle | BookaRide`}
        description={`Book your ${suburbData.name} to Auckland Airport private transfer. Door-to-door service, fixed prices, flight tracking. ~${suburbData.duration} to airport. Get instant quote!`}
        keywords={`${suburbData.name} airport transfer, ${suburbData.name} to Auckland Airport, ${suburbData.name} airport shuttle, ${suburbData.name} airport taxi, ${suburbData.keywords?.join(', ')}`}
        canonical={`/${suburb}-to-auckland-airport`}
      />
      
      <FAQSchema faqs={pageFAQs} />
      <ServiceSchema 
        serviceName={`${suburbData.name} Airport Transfer`}
        description={`Private door-to-door transfer from ${suburbData.name} to Auckland Airport`}
        areaServed={suburbData.name}
        priceRange={{ low: '85', high: '200' }}
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: suburbData.region, url: `/regions/${suburbData.region.toLowerCase().replace(' ', '-')}` },
        { name: `${suburbData.name} Airport Transfer` }
      ]} />

      <PageBreadcrumb 
        items={[
          { label: suburbData.region, href: `/regions/${suburbData.region.toLowerCase().replace(' ', '-')}` },
          { label: suburbData.name }
        ]} 
      />

      {/* Hero Section */}
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
              {suburbData.name}, {suburbData.region}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {suburbData.name} to <span className="text-gold">Auckland Airport</span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-4">
              Private door-to-door airport transfers from {suburbData.name}
            </p>
            <p className="text-gray-400 mb-8">
              ~{suburbData.duration} to airport • {suburbData.distance}km • Fixed prices • Professional drivers
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-500 text-black font-bold px-8 py-6 text-lg">
                  Get Instant Quote
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="tel:+6495555555">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  <Phone className="mr-2 w-5 h-5" />
                  Call Now
                </Button>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Free cancellation</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Flight tracking</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> Meet & greet available</span>
              <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500" /> 24/7 service</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
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

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">{suburbData.name} Airport Transfer Service</h2>
            <div className="prose prose-lg max-w-none">
              <p>
                Looking for a reliable airport transfer from <strong>{suburbData.name}</strong>? BookaRide offers premium 
                private shuttle services from {suburbData.name} directly to Auckland International Airport. Our professional 
                drivers will pick you up from your exact address and ensure you arrive at the airport relaxed and on time.
              </p>
              <p>
                The journey from {suburbData.name} to Auckland Airport is approximately <strong>{suburbData.distance}km</strong> and 
                takes around <strong>{suburbData.duration}</strong> in normal traffic conditions. Unlike shared shuttles that make 
                multiple stops, our private transfers take you directly to the airport.
              </p>
              <h3>Why Choose BookaRide for Your {suburbData.name} Airport Transfer?</h3>
              <ul>
                <li><strong>Fixed Pricing</strong> - No surge pricing or hidden fees. The price you see is the price you pay.</li>
                <li><strong>Flight Tracking</strong> - We monitor your flight and adjust pickup times automatically for delays.</li>
                <li><strong>Professional Drivers</strong> - Licensed, insured, and experienced local drivers.</li>
                <li><strong>Door-to-Door Service</strong> - We pick you up from your exact address in {suburbData.name}.</li>
                <li><strong>24/7 Availability</strong> - Early morning, late night, we're always available.</li>
              </ul>
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
              {pageFAQs.map((faq, i) => (
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

      {/* CTA Section */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Book Your {suburbData.name} Airport Transfer?</h2>
          <p className="text-gray-400 mb-8">Get an instant quote in seconds - no obligation</p>
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

export default SuburbTransferPage;
