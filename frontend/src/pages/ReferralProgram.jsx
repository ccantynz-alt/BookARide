import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Mail, MessageCircle, Users, DollarSign, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import SEO from '../components/SEO';
import { Link } from 'react-router-dom';

const ReferralProgram = () => {
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  // Check if user already has a referral code
  useEffect(() => {
    const savedCode = localStorage.getItem('referralCode');
    if (savedCode) {
      setReferralCode(savedCode);
      setIsRegistered(true);
    }
  }, []);

  const generateReferralCode = (email) => {
    // Generate a unique referral code based on email
    const base = email.split('@')[0].toUpperCase().slice(0, 4);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${base}${random}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    const code = generateReferralCode(email);
    setReferralCode(code);
    setIsRegistered(true);
    localStorage.setItem('referralCode', code);
    localStorage.setItem('referralEmail', email);
  };

  const copyToClipboard = () => {
    const referralLink = `https://bookaride.co.nz/book-now?ref=${referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(
      `Hey! Use my referral code ${referralCode} to get $20 off your first ride with BookaRide NZ! 🚗\n\nBook here: https://bookaride.co.nz/book-now?ref=${referralCode}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent('Get $20 off your first BookaRide!');
    const body = encodeURIComponent(
      `Hey!\n\nI've been using BookaRide for airport transfers and they're amazing. Use my referral code ${referralCode} to get $20 off your first ride!\n\nBook here: https://bookaride.co.nz/book-now?ref=${referralCode}\n\nEnjoy!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title="Refer a Friend, Get $20 | BookaRide Referral Program"
        description="Share the love! Give your friends $20 off their first ride and get $20 credit when they book. Join the BookaRide referral program today."
        keywords="referral program, refer a friend, airport transfer discount, BookaRide NZ"
        canonical="/referral"
      />

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-64 h-64 bg-gold/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-gold text-black px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Gift className="w-4 h-4" />
              Referral Program
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Give <span className="text-gold">$20</span>, Get <span className="text-gold">$20</span>
            </h1>

            <p className="text-xl text-gray-300 mb-8">
              Share your love for BookaRide! Give your friends $20 off their first ride,
              and you'll get $20 credit when they book.
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 flex-wrap">
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">$20</div>
                <div className="text-sm text-gray-400">For your friend</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">$20</div>
                <div className="text-sm text-gray-400">For you</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gold">∞</div>
                <div className="text-sm text-gray-400">Unlimited referrals</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {!isRegistered ? (
              /* Registration Form */
              <Card className="border-2 border-gold/20">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-bold text-center mb-6">Get Your Referral Code</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="py-6 text-lg"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gold hover:bg-yellow-500 text-black font-semibold py-6 text-lg"
                    >
                      Generate My Referral Code
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ) : (
              /* Referral Code Display */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="border-2 border-gold">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/20 rounded-full mb-4">
                        <Gift className="w-8 h-8 text-gold" />
                      </div>
                      <h2 className="text-2xl font-bold">Your Referral Code</h2>
                      <p className="text-gray-600">Share this code with friends & family</p>
                    </div>

                    {/* Code Display */}
                    <div className="bg-gray-100 rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-3xl font-bold tracking-wider text-gray-900">
                          {referralCode}
                        </div>
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          {copied ? (
                            <><Check className="w-4 h-4 text-green-500" /> Copied!</>
                          ) : (
                            <><Copy className="w-4 h-4" /> Copy Link</>
                          )}
                        </Button>
                      </div>
                      <p className="text-sm text-gray-500 mt-3">
                        Your unique link: bookaride.co.nz/book-now?ref={referralCode}
                      </p>
                    </div>

                    {/* Share Buttons */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 text-center">Share via:</p>
                      <div className="flex gap-3">
                        <Button
                          onClick={shareViaWhatsApp}
                          className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                        >
                          <MessageCircle className="w-5 h-5 mr-2" />
                          WhatsApp
                        </Button>
                        <Button
                          onClick={shareViaEmail}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          <Mail className="w-5 h-5 mr-2" />
                          Email
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                icon: Share2,
                title: "Share Your Code",
                description: "Send your unique referral code to friends and family"
              },
              {
                step: 2,
                icon: Users,
                title: "Friend Books a Ride",
                description: "They get $20 off their first airport transfer"
              },
              {
                step: 3,
                icon: DollarSign,
                title: "You Get $20 Credit",
                description: "Once they complete their ride, you earn $20 credit"
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
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <item.icon className="w-10 h-10 text-gold" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gold rounded-full flex items-center justify-center text-black font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-black text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Earning?</h2>
          <p className="text-gray-400 mb-8">
            There's no limit to how many friends you can refer!
          </p>
          {!isRegistered ? (
            <a href="#top">
              <Button className="bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-6 text-lg">
                Get My Referral Code
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </a>
          ) : (
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-yellow-500 text-black font-semibold px-8 py-6 text-lg">
                Book Your Next Ride
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default ReferralProgram;
