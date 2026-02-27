import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from '@vuer-ai/react-helmet-async';
import { motion } from 'framer-motion';
import { 
  Plane, Clock, Shield, Star, CreditCard, CheckCircle, 
  ArrowRight, Phone, Sparkles, Users, Award, Zap,
  ChevronRight, Quote, Play, Calendar, MapPin
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { internationalMarkets } from '../../data/internationalMarkets';

const CountryLandingPage = () => {
  const { countrySlug } = useParams();
  const location = window.location.pathname;
  const slug = countrySlug || location.split('/visitors/')[1]?.split('/')[0] || 'usa';
  const country = internationalMarkets.find(c => c.slug === slug) || internationalMarkets[0];
  
  const [bookingCount, setBookingCount] = useState(847);
  
  // Simulate live booking counter
  useEffect(() => {
    const interval = setInterval(() => {
      setBookingCount(prev => prev + Math.floor(Math.random() * 3));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": `Auckland Airport Transfer for ${country.demonym} Visitors`,
    "description": country.metaDesc,
    "provider": {
      "@type": "LocalBusiness",
      "name": "BookaRide NZ",
      "url": "https://bookaride.co.nz",
      "address": { "@type": "PostalAddress", "addressLocality": "Auckland", "addressCountry": "NZ" }
    },
    "areaServed": { "@type": "Place", "name": "Auckland Region" },
    "serviceType": "Airport Transfer"
  };

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Helmet>
        <title>{country.metaTitle}</title>
        <meta name="description" content={country.metaDesc} />
        <link rel="canonical" href={`https://bookaride.co.nz/visitors/${country.slug}`} />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      {/* HERO - Full Impact */}
      <section className="relative min-h-[90vh] flex items-center bg-black overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black to-transparent" />
          {/* Floating particles effect */}
          <div className="absolute inset-0 opacity-30">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gold rounded-full"
                style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
                animate={{ y: [0, -30, 0], opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
              />
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Live Counter Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 px-5 py-2 rounded-full mb-6"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-green-400 font-medium">{bookingCount} bookings this month</span>
            </motion.div>

            {/* Country Welcome */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-3 bg-gold text-black px-6 py-3 rounded-full text-lg font-bold mb-8"
            >
              <span className="text-3xl">{country.flag}</span>
              {country.greeting}
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
            >
              {country.heroTitle}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              {country.heroSubtitle}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-10"
            >
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-400 text-black font-black px-10 py-7 text-xl rounded-xl shadow-2xl shadow-gold/30 transform hover:scale-105 transition-all">
                  <Sparkles className="mr-2 w-6 h-6" />
                  Get Your Quote Now
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </Link>
              <a href="tel:+6495555555">
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black px-10 py-7 text-xl rounded-xl font-bold">
                  <Phone className="mr-2 w-6 h-6" />
                  Call Now
                </Button>
              </a>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-8 text-gray-400"
            >
              {[
                { icon: Shield, text: 'Licensed & Insured' },
                { icon: Clock, text: 'Flight Tracking' },
                { icon: CreditCard, text: country.paymentNote },
                { icon: Zap, text: '24/7 Service' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon className="w-5 h-5 text-gold" />
                  <span>{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <ChevronRight className="w-8 h-8 text-gold rotate-90" />
        </motion.div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="bg-gradient-to-r from-gold via-yellow-500 to-gold py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-black font-bold">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 fill-black" />
              <span className="text-lg">4.9/5 Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <span className="text-lg">10,000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              <span className="text-lg">Auckland's #1 Choice</span>
            </div>
          </div>
        </div>
      </section>

      {/* WHY BOOK WITH US - Sales Focused */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-bold text-sm uppercase tracking-wider">Why {country.demonym} Travelers Choose Us</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">Skip The Stress. Start Your Trip Right.</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              After {country.flightHours || '12+'} hours in the air, the last thing you want is to figure out transport. We've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Your Driver Waits For YOU',
                desc: 'We track your flight. Delayed? No problem. Your driver adjusts automatically. No waiting, no stress.',
                highlight: 'Flight delays? We adapt.'
              },
              {
                icon: '💰',
                title: 'Fixed Price. No Surprises.',
                desc: 'Get your quote upfront. That\'s what you pay. No surge pricing. No meter anxiety. No hidden fees.',
                highlight: 'Price locked at booking.'
              },
              {
                icon: '🚗',
                title: 'Private. Just For You.',
                desc: 'No shared shuttles. No waiting for other passengers. Direct from Auckland Airport to your accommodation.',
                highlight: 'Door-to-door service.'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-0 shadow-xl hover:shadow-2xl transition-shadow bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-8">
                    <div className="text-5xl mb-6">{item.icon}</div>
                    <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                    <p className="text-gold font-bold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> {item.highlight}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICE AREA - Accurate Information */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-gold font-bold text-sm uppercase tracking-wider">Auckland Airport Transfers</span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">From Auckland Airport To Your Door</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                We specialize in <strong>Auckland Airport transfers</strong> - it's what we do best. 
                Whether you're heading to the city, North Shore, Hibiscus Coast, or anywhere in the greater Auckland region, 
                we'll get you there comfortably.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  'Auckland CBD & City Centre',
                  'North Shore (Takapuna, Albany, Browns Bay)',
                  'Hibiscus Coast (Orewa, Whangaparaoa, Silverdale)',
                  'West Auckland (Henderson, New Lynn)',
                  'South Auckland (Manukau, Botany, Howick)',
                  'Airport Hotels & Nearby Areas'
                ].map((area, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-gold flex-shrink-0" />
                    <span className="text-lg">{area}</span>
                  </div>
                ))}
              </div>

              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-400 text-black font-bold">
                  Check If We Cover Your Area
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gold/20 to-transparent rounded-3xl p-8">
                <div className="bg-black rounded-2xl p-8 shadow-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center">
                      <Plane className="w-8 h-8 text-black" />
                    </div>
                    <div>
                      <p className="text-gold font-bold">Auckland International Airport</p>
                      <p className="text-gray-400">Your journey starts here</p>
                    </div>
                  </div>
                  <div className="border-l-2 border-gold/30 ml-8 pl-8 space-y-6">
                    <div className="relative">
                      <div className="absolute -left-[41px] w-4 h-4 bg-gold rounded-full" />
                      <p className="font-bold">CBD Hotels</p>
                      <p className="text-gray-400 text-sm">~25-35 mins</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[41px] w-4 h-4 bg-gold/60 rounded-full" />
                      <p className="font-bold">North Shore</p>
                      <p className="text-gray-400 text-sm">~35-50 mins</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[41px] w-4 h-4 bg-gold/40 rounded-full" />
                      <p className="font-bold">Hibiscus Coast</p>
                      <p className="text-gray-400 text-sm">~50-65 mins</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-gold font-bold text-sm uppercase tracking-wider">Real Reviews</span>
            <h2 className="text-4xl md:text-5xl font-black mt-4">What {country.demonym} Visitors Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {(country.testimonials || [
              { name: 'Sarah M.', location: country.name, text: 'After a long flight, having someone waiting for us was amazing. No stress, no hassle. Highly recommend!', rating: 5 },
              { name: 'James K.', location: country.name, text: 'Fixed price was exactly what we paid. Driver was professional and the car was spotless. Will use again!', rating: 5 },
              { name: 'The Williams Family', location: country.name, text: 'Traveling with kids is hard. BookaRide made it easy. Child seats ready, driver was patient. Perfect!', rating: 5 }
            ]).map((review, i) => (
              <Card key={i} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 text-gold fill-gold" />
                    ))}
                  </div>
                  <Quote className="w-10 h-10 text-gold/20 mb-4" />
                  <p className="text-gray-700 mb-6 italic">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center font-bold text-gold">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{review.name}</p>
                      <p className="text-gray-500 text-sm">{review.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-gold font-bold text-sm uppercase tracking-wider">Got Questions?</span>
              <h2 className="text-4xl font-black mt-4">{country.demonym} Visitor FAQs</h2>
            </div>

            <div className="space-y-4">
              {country.faqs.map((faq, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{faq.q}</h3>
                    <p className="text-gray-600">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA - High Impact */}
      <section className="relative py-24 bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/10 via-transparent to-gold/10" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <span className="text-6xl mb-6 block">{country.flag}</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
                {country.ctaTitle}
              </h2>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                {country.ctaSubtitle}
              </p>

              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-yellow-400 text-black font-black px-12 py-8 text-2xl rounded-xl shadow-2xl shadow-gold/30 transform hover:scale-105 transition-all">
                  <Calendar className="mr-3 w-7 h-7" />
                  Book Your Transfer Now
                  <ArrowRight className="ml-3 w-7 h-7" />
                </Button>
              </Link>

              <p className="text-gray-500 mt-8 text-sm">
                Free cancellation up to 24 hours before pickup • Instant confirmation
              </p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CountryLandingPage;
