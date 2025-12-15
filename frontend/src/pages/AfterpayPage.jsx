import React from 'react';
import { Link } from 'react-router-dom';
import { Check, CreditCard, Clock, Shield, Sparkles, ArrowRight, Calendar, DollarSign, Star, Phone } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';

const AfterpayPage = () => {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // Example calculation for a $200 ride
  const exampleTotal = 200;
  const installment = (exampleTotal / 4).toFixed(2);

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Pay with Afterpay - Buy Now, Pay Later | BookaRide NZ"
        description="Book your airport transfer with Afterpay. Pay in 4 interest-free instalments over 6 weeks. No interest, no hidden fees when you pay on time. Book your ride today!"
        keywords="afterpay, buy now pay later, airport shuttle payment, interest free, payment plan, BookaRide, Auckland airport"
        canonical="/afterpay"
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black py-20 lg:py-32">
        {/* Afterpay mint accent */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#B2FCE4]/40 via-transparent to-transparent" />
        </div>
        
        {/* Gold sparkles */}
        <div className="absolute left-0 top-0 w-full h-full overflow-hidden">
          <div className="absolute top-20 left-[10%] w-2 h-2 bg-gold rounded-full animate-pulse opacity-60" />
          <div className="absolute top-40 left-[20%] w-1 h-1 bg-gold rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-60 right-[15%] w-3 h-3 bg-[#B2FCE4] rounded-full animate-pulse opacity-40" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 right-[25%] w-2 h-2 bg-gold rounded-full animate-pulse opacity-70" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            {/* Afterpay Badge */}
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-[#B2FCE4] text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Now Available at Checkout
            </motion.div>

            {/* Main Heading */}
            <motion.h1 
              variants={fadeIn}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
            >
              Pay in <span className="text-[#B2FCE4]">4</span>,
              <br />
              <span className="text-gold">Interest-Free</span>
            </motion.h1>

            <motion.p 
              variants={fadeIn}
              className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            >
              Book your airport transfer now and spread the cost over 6 weeks with Afterpay. 
              No interest. No hidden fees when you pay on time.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/book-now">
                <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg group">
                  Book Now with Afterpay
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                  Learn How It Works
                </Button>
              </a>
            </motion.div>

            {/* Afterpay Logo */}
            <motion.div variants={fadeIn} className="mt-12 flex justify-center">
              <div className="bg-white rounded-lg px-6 py-3 flex items-center gap-3">
                <span className="text-black font-bold text-xl">afterpay</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 text-sm">Trusted by millions</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Payment Example Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                See How Easy It Is
              </h2>
              <p className="text-lg text-gray-600">
                Here's an example of how a ${exampleTotal} airport transfer works with Afterpay
              </p>
            </div>

            {/* Payment Breakdown Card */}
            <Card className="border-2 border-[#B2FCE4] shadow-xl overflow-hidden">
              <div className="bg-black text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Your Airport Transfer</p>
                    <p className="text-3xl font-bold">${exampleTotal}.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#B2FCE4] text-sm font-semibold">With Afterpay</p>
                    <p className="text-xl">4 × ${installment}</p>
                  </div>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${num === 1 ? 'bg-[#B2FCE4] text-black' : 'bg-gray-100 text-gray-600'}`}>
                        {num === 1 ? <Check className="w-6 h-6" /> : num}
                      </div>
                      <p className="font-semibold text-gray-900">${installment}</p>
                      <p className="text-xs text-gray-500">
                        {num === 1 ? 'Today' : num === 2 ? '2 weeks' : num === 3 ? '4 weeks' : '6 weeks'}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-center gap-2 text-green-600">
                  <Shield className="w-5 h-5" />
                  <span className="font-semibold">$0 Interest • $0 Fees when paid on time</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-gold/10 text-gold px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Simple Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Afterpay Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Using Afterpay at BookaRide checkout is quick and easy. Here's how it works:
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "1",
                title: "Book Your Ride",
                description: "Fill in your pickup details, destination, and travel date",
                icon: Calendar
              },
              {
                step: "2",
                title: "Select Afterpay",
                description: "Choose Afterpay as your payment method at checkout",
                icon: CreditCard
              },
              {
                step: "3",
                title: "Quick Approval",
                description: "Log in or create an Afterpay account for instant approval",
                icon: Check
              },
              {
                step: "4",
                title: "Pay in 4",
                description: "First payment today, then 3 more over 6 weeks",
                icon: DollarSign
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#B2FCE4] to-[#8EEACB] rounded-2xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform duration-300">
                    <item.icon className="w-10 h-10 text-black" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-black font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block bg-[#B2FCE4]/20 text-[#B2FCE4] px-4 py-1 rounded-full text-sm font-semibold mb-4">
              Why Afterpay?
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              The Smart Way to Pay
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Afterpay gives you the flexibility to manage your budget while getting where you need to go
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: DollarSign,
                title: "Interest-Free Always",
                description: "Unlike credit cards, Afterpay never charges interest. Ever. Pay exactly what you see at checkout."
              },
              {
                icon: Shield,
                title: "No Fees When On Time",
                description: "Make your payments on time and pay zero extra fees. It's that simple."
              },
              {
                icon: Clock,
                title: "6 Weeks to Pay",
                description: "Spread your payment over 6 weeks in 4 equal instalments, making budgeting easier."
              },
              {
                icon: CreditCard,
                title: "Use Your Card",
                description: "Works with your existing Visa or Mastercard debit or credit card."
              },
              {
                icon: Star,
                title: "Instant Approval",
                description: "Get approved in seconds at checkout. No lengthy applications or paperwork."
              },
              {
                icon: Check,
                title: "Budget Friendly",
                description: "Plan your travel expenses better by spreading the cost over time."
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-800 border-gray-700 h-full hover:border-gold/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-[#B2FCE4]/20 rounded-lg flex items-center justify-center mb-4">
                      <benefit.icon className="w-6 h-6 text-[#B2FCE4]" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                    <p className="text-gray-400">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block bg-gold/10 text-gold px-4 py-1 rounded-full text-sm font-semibold mb-4">
                Got Questions?
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "Do I need an Afterpay account?",
                  answer: "Yes, you'll need an Afterpay account. If you don't have one, you can create it during checkout in just a few minutes. You'll need to be 18+, a NZ resident, and have a valid debit or credit card."
                },
                {
                  question: "What if I miss a payment?",
                  answer: "If you miss a payment, Afterpay may charge a late fee. Late fees are capped at 25% of the order value or $68 NZD maximum (whichever is less). Your account may also be paused until payments are up to date."
                },
                {
                  question: "Is there a spending limit?",
                  answer: "Yes, Afterpay starts you with a lower spending limit which can increase over time based on your payment history. This helps ensure responsible spending."
                },
                {
                  question: "Can I pay off my order early?",
                  answer: "Absolutely! You can make additional payments or pay off your entire order early at any time through the Afterpay app with no extra fees."
                },
                {
                  question: "Is Afterpay safe to use?",
                  answer: "Yes, Afterpay uses industry-standard encryption and security measures to protect your information. They also have fraud monitoring and multi-factor authentication."
                }
              ].map((faq, index) => (
                <Card key={index} className="border border-gray-200">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 mb-4">
                For more information about Afterpay, visit{' '}
                <a href="https://www.afterpay.com/en-NZ/how-it-works" target="_blank" rel="noopener noreferrer" className="text-[#00C8B5] hover:underline font-semibold">
                  afterpay.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-black via-gray-900 to-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 bg-[#B2FCE4] text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                Ready to Book?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Book Your Ride Today,
                <br />
                <span className="text-gold">Pay Later with Afterpay</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                Experience premium airport transfers in Auckland. 
                Select Afterpay at checkout and pay in 4 interest-free instalments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/book-now">
                  <Button size="lg" className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-6 text-lg group">
                    Book Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="tel:+64800266522">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg">
                    <Phone className="mr-2 w-5 h-5" />
                    0800 BOOK A RIDE
                  </Button>
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 pt-8 border-t border-gray-800 flex flex-wrap justify-center gap-8 text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gold" />
                  <span>24/7 Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  <span>5-Star Rated</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Terms Footer */}
      <div className="bg-gray-100 py-4 text-center text-sm text-gray-500">
        <div className="container mx-auto px-4">
          Late fees, eligibility criteria and T&Cs apply. Credit checks apply. See{' '}
          <a href="https://www.afterpay.com/en-NZ" target="_blank" rel="noopener noreferrer" className="text-[#00C8B5] hover:underline">
            afterpay.com
          </a>{' '}
          for full terms.
        </div>
      </div>
    </div>
  );
};

export default AfterpayPage;
