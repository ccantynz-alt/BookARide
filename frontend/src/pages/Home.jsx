import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Plane, Briefcase, MapPin, Calendar, Star, Check, Shield, Clock, Award, Users, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { services, testimonials, howItWorksSteps } from '../mock';
import SEO from '../components/SEO';
import StructuredData from '../components/StructuredData';
import { AnimatedSection, FadeIn } from '../components/AnimatedSection';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { VehicleGallery } from '../components/VehicleGallery';
import { TestimonialsCarousel } from '../components/TestimonialsCarousel';
import { TrustBadges } from '../components/TrustBadges';
import { DarkModeToggle } from '../components/DarkModeToggle';
import { motion } from 'framer-motion';
import AOS from 'aos';
import 'aos/dist/aos.css';

const iconMap = {
  plane: Plane,
  briefcase: Briefcase,
  'map-pin': MapPin,
  calendar: Calendar
};

export const Home = () => {
  const { t } = useTranslation();
  
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      offset: 100
    });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Affordable Airport Shuttle Auckland - Best Value Transfers"
        description="Affordable airport shuttle service in Auckland. Best value airport transfers for Auckland, Hamilton, and Whangarei airports. Reliable, safe, and budget-friendly shuttle service available 24/7. Book online now!"
        keywords="airport, airport shuttle, cheap airport shuttle, affordable airport transfer, budget shuttle, Auckland shuttles, Auckland airport shuttle, Hamilton airport shuttle, Whangarei airport transfer, airport transfer, airport transportation, shuttle service Auckland, best value shuttle, reliable shuttle"
        canonical="/"
      />
      <StructuredData />
      {/* ULTRA PROFESSIONAL LUXURY HERO SECTION */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
        
        {/* Cinematic Background */}
        <div className="absolute inset-0">
          {/* High-quality background image */}
          <div className="absolute inset-0">
            <img 
              src="/shuttle-van.jpg" 
              alt="Luxury Airport Transfer" 
              className="w-full h-full object-cover opacity-50"
              style={{ objectPosition: 'center' }}
            />
          </div>
          
          {/* Professional gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/95 to-black/80" />
          
          {/* Elegant gold accent light */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-gold/30 via-transparent to-transparent" />
          </div>
          
          {/* Subtle animated shine effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine-slow" 
                 style={{ transform: 'translateX(-100%)', animationDuration: '8s' }} />
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* LEFT SIDE - POWERFUL MESSAGING */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              {/* Premium Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-6"
              >
                <Star className="w-4 h-4 text-gold fill-gold" />
                <span className="text-gold font-semibold text-sm tracking-wide">★★★★★ 5-STAR RATED</span>
              </motion.div>

              {/* Massive Headline - SELLING POINT */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-6 leading-tight">
                <span className="block mb-2">Premium</span>
                <span className="block bg-gradient-to-r from-gold via-yellow-300 to-gold bg-clip-text text-transparent" 
                      style={{ WebkitTextStroke: '1px rgba(212,175,55,0.3)' }}>
                  Airport Transfers
                </span>
              </h1>

              {/* Compelling Subheading */}
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-300 mb-8 leading-relaxed font-light">
                Your journey matters. Arrive in <span className="text-gold font-semibold">comfort</span>, <span className="text-gold font-semibold">style</span>, and <span className="text-gold font-semibold">safety</span>.
              </p>

              {/* Key Benefits - SELLING FEATURES */}
              <div className="space-y-4 mb-10">
                {[
                  { icon: Check, text: 'Professional Drivers - Licensed & Experienced' },
                  { icon: Check, text: 'Luxury Vehicles - Immaculate & Comfortable' },
                  { icon: Check, text: 'Fixed Rates - No Hidden Fees, Ever' },
                  { icon: Check, text: 'Flight Tracking - We Monitor Your Arrival' }
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.6 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center group-hover:bg-gold/30 transition-colors">
                      <benefit.icon className="w-5 h-5 text-gold" strokeWidth={3} />
                    </div>
                    <span className="text-white text-lg font-medium">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* POWERFUL CTA BUTTONS */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link to="/book-now" className="flex-1">
                  <Button 
                    size="lg" 
                    className="w-full h-16 bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8 shadow-2xl hover:shadow-gold/50 transform hover:scale-105 transition-all duration-300 group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <span>BOOK YOUR RIDE NOW</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                    {/* Button shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  </Button>
                </Link>
                <Link to="/services">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="h-16 border-2 border-gold text-gold hover:bg-gold/10 font-semibold text-lg px-8 backdrop-blur-sm hover:border-yellow-400 transition-all duration-300"
                  >
                    VIEW SERVICES
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="mt-8 pt-8 border-t border-white/10"
              >
                <div className="flex flex-wrap items-center gap-8">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-gold" />
                    <span className="text-white/80 text-sm font-medium">Fully Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold" />
                    <span className="text-white/80 text-sm font-medium">24/7 Support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold" />
                    <span className="text-white/80 text-sm font-medium">10,000+ Happy Clients</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - SOCIAL PROOF & BOOKING CARD */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glowing card effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/20 to-yellow-600/20 rounded-3xl blur-3xl" />
                
                {/* Premium booking preview card */}
                <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
                  {/* Quick booking form preview */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">Instant Quote</h3>
                    <p className="text-white/70">Get your price in seconds</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Visual service options */}
                    {[
                      { icon: Plane, title: 'Airport Transfer', price: 'From $60', popular: true },
                      { icon: Briefcase, title: 'Corporate Travel', price: 'From $75', popular: false },
                      { icon: MapPin, title: 'City to City', price: 'From $120', popular: false }
                    ].map((service, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:border-gold hover:bg-white/5 ${
                          service.popular ? 'border-gold bg-gold/10' : 'border-white/20 bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              service.popular ? 'bg-gold text-black' : 'bg-white/10 text-gold'
                            }`}>
                              <service.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{service.title}</p>
                              <p className="text-gold text-sm font-bold">{service.price}</p>
                            </div>
                          </div>
                          {service.popular && (
                            <span className="text-xs bg-gold text-black px-3 py-1 rounded-full font-bold">
                              POPULAR
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Testimonial snippet */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                      ))}
                    </div>
                    <p className="text-white/90 text-sm italic mb-3">
                      "Exceptional service! The driver was professional, the vehicle spotless. Will definitely book again."
                    </p>
                    <p className="text-white/60 text-xs">— Sarah M., Auckland</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
        >
          <div className="flex flex-col items-center gap-2 animate-bounce">
            <span className="text-white/60 text-sm font-medium tracking-wider">SCROLL TO EXPLORE</span>
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
              <div className="w-1 h-3 bg-gold rounded-full animate-pulse" />
            </div>
          </div>
        </motion.div>

      </section>
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-base group transition-all-smooth shadow-lg hover:shadow-2xl hover:scale-105 animate-pulse-slow">
                  <Sparkles className="mr-2 w-5 h-5" />
                  {t('hero.bookNow')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-2 border-gold text-gold hover:bg-gold hover:text-black font-semibold px-10 py-6 text-base transition-all duration-200">
                  {t('hero.viewServices')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="container mx-auto px-4 mt-20 relative z-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, value: 1000, suffix: '+', label: t('stats.customers') },
              { icon: Clock, value: 60, suffix: 's', label: t('stats.bookingTime') },
              { icon: Shield, value: 100, suffix: '%', label: t('stats.safety') },
              { icon: Award, value: 4.9, suffix: '★', label: t('stats.rating'), decimals: 1 }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="text-center p-6 glass-dark rounded-xl border border-gold/30 hover-lift hover-glow"
                >
                  <Icon className="w-8 h-8 text-gold mx-auto mb-3 animate-float" />
                  <div className="text-3xl font-bold text-gold mb-1">
                    <AnimatedCounter 
                      end={stat.value} 
                      suffix={stat.suffix}
                      decimals={stat.decimals || 0}
                    />
                  </div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-block mb-4" data-aos="zoom-in">
              <span className="bg-gold text-black text-xs font-bold px-4 py-2 rounded-full uppercase tracking-wide">
                ⚡ Instant Online Booking Available
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4" data-aos="fade-up">{t('services.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
              {t('services.description')}
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon];
              return (
                <div key={service.id} data-aos="fade-up" data-aos-delay={index * 100}>
                  <Card className="border-2 border-gray-200 hover:border-gold transition-all-smooth group hover-lift h-full">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl flex items-center justify-center mb-6 group-hover:from-gold group-hover:to-yellow-500 transition-all-smooth shadow-lg">
                        <Icon className="w-8 h-8 text-gold group-hover:text-black transition-colors duration-200" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">{service.title}</h3>
                      <p className="text-gray-600 mb-6 text-sm leading-relaxed">{service.description}</p>
                      <ul className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-700">
                            <Check className="w-4 h-4 text-gold mr-3 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Competitive Advantages */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Best value airport shuttles with modern convenience
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <Card className="border-2 border-gold/30 bg-white shadow-xl">
              <CardContent className="p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column - Features */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Online Booking</h3>
                        <p className="text-gray-600 text-sm">Book in 60 seconds with live price calculator. No phone calls or email quotes needed.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Triple Auto-Confirmations</h3>
                        <p className="text-gray-600 text-sm">Receive instant email, SMS, and automatic Google Calendar entry for your booking.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">VIP Airport Service</h3>
                        <p className="text-gray-600 text-sm">Premium airport pickup with VIP parking close to terminal doors.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Online Payments</h3>
                        <p className="text-gray-600 text-sm">Fast, secure checkout with Stripe. No cash or bank transfer hassles.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - More Features */}
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">One-Click Return Trips</h3>
                        <p className="text-gray-600 text-sm">Book your return journey in a single booking. No need for separate reservations.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialist Services</h3>
                        <p className="text-gray-600 text-sm">Dedicated Hobbiton tours and cruise ship transfers. We know these routes inside out.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Oversized Luggage Welcome</h3>
                        <p className="text-gray-600 text-sm">Skis, bikes, surfboards, golf clubs - we handle all your oversized gear.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-gold" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Fixed Transparent Pricing</h3>
                        <p className="text-gray-600 text-sm">See your exact price before booking. No surge pricing, no hidden fees.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-10 text-center pt-8 border-t border-gray-200">
                  <p className="text-gray-700 mb-4 font-medium">Ready to experience the difference?</p>
                  <Link to="/book-now">
                    <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-lg">
                      Book Your Ride Now
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured: Hobbiton Transfers */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 border-gold/30 bg-gray-900/50 backdrop-blur overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  {/* Text Content */}
                  <div className="p-10 lg:p-12 flex flex-col justify-center">
                    <div className="inline-block mb-4">
                      <span className="bg-gold text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                        Popular Destination
                      </span>
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                      Hobbiton Movie Set Transfers
                    </h3>
                    <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                      Experience the magic of Middle-earth with our premium transfer service from Auckland to Hobbiton Movie Set in Matamata. 
                      Comfortable, direct, and hassle-free.
                    </p>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        175km scenic journey through Waikato
                      </li>
                      <li className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        Perfect timing for your Hobbiton tour
                      </li>
                      <li className="flex items-center text-gray-200">
                        <Check className="w-5 h-5 text-gold mr-3 flex-shrink-0" />
                        Return trips available
                      </li>
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Link to="/hobbiton-transfers">
                        <Button className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 w-full sm:w-auto">
                          Learn More
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                      </Link>
                      <Link to="/book-now">
                        <Button variant="outline" className="border-gold text-gold hover:bg-gold hover:text-black px-8 py-6 w-full sm:w-auto">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Image/Visual */}
                  <div className="bg-gradient-to-br from-gold/20 to-gold/5 p-10 lg:p-12 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-8xl mb-6">🧙‍♂️</div>
                      <p className="text-gold font-bold text-2xl mb-2">From $612.50</p>
                      <p className="text-gray-400 text-sm">Based on distance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Booking a ride is quick and easy
            </p>
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {howItWorksSteps.map((step, index) => (
              <div key={step.step} className="text-center relative group">
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-px bg-gold/30 -z-10"></div>
                )}
                <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-black border-2 border-gold/30 text-gold rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                  {step.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="border-2 border-gray-200 hover:border-gold hover:shadow-xl transition-all duration-200">
                <CardContent className="p-8">
                  <div className="flex mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.content}"</p>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.2),transparent_70%)]" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Book Your Ride?
          </h2>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Get in touch today and let us take care of your transportation needs.
          </p>
          <Link to="/contact">
            <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-10 py-6 text-base transition-all duration-200 shadow-lg">
              Book Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Vehicle Gallery */}
      <VehicleGallery />

      {/* Testimonials Carousel */}
      <TestimonialsCarousel />

      {/* Dark Mode Toggle */}
      <DarkModeToggle />
    </div>
  );
};

export default Home;
