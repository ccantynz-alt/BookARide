import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plane, Clock, MapPin, Shield, CheckCircle, ArrowRight, Wifi, CreditCard, Globe, Luggage, Info, Car } from 'lucide-react';
import { Button } from '../../components/ui/button';

const AucklandAirportArrivalsGuide = () => {
  const guideSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Auckland Airport Arrivals Guide 2026 - Everything You Need to Know",
    "description": "Complete guide to arriving at Auckland Airport. Customs, baggage, transport options, SIM cards, currency exchange, and getting to Auckland city.",
    "author": { "@type": "Organization", "name": "Book A Ride NZ" },
    "publisher": { "@type": "Organization", "name": "Book A Ride NZ", "url": "https://bookaride.co.nz" },
    "datePublished": "2026-03-29",
    "dateModified": "2026-03-29",
    "mainEntityOfPage": "https://bookaride.co.nz/auckland-airport-arrivals-guide"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How long does it take to get through Auckland Airport customs?",
        "acceptedAnswer": { "@type": "Answer", "text": "International arrivals typically take 30-60 minutes to clear customs and biosecurity at Auckland Airport. During peak times (6-10am when long-haul flights arrive), it can take up to 90 minutes. New Zealand has strict biosecurity — declare all food, plant material, and outdoor equipment." }
      },
      {
        "@type": "Question",
        "name": "How do I get from Auckland Airport to the city centre?",
        "acceptedAnswer": { "@type": "Answer", "text": "The most popular options are: private airport transfer (door-to-door, from $150), public bus SkyBus ($18, 45-60 mins to CBD), taxi/rideshare ($80-100), or rental car. A private transfer is the most convenient option, especially with luggage and after a long flight." }
      },
      {
        "@type": "Question",
        "name": "Do I need a SIM card when arriving in New Zealand?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, having mobile data is essential for navigation, rideshare apps, and staying connected. You can buy a physical SIM at the airport or get an eSIM before you fly (activated instantly, no physical card needed). eSIMs are the fastest option as you have data the moment you land." }
      },
      {
        "@type": "Question",
        "name": "What currency does New Zealand use?",
        "acceptedAnswer": { "@type": "Answer", "text": "New Zealand uses the New Zealand Dollar (NZD). Cards are accepted almost everywhere — contactless payments (Visa, Mastercard, Apple Pay, Google Pay) work at most shops, restaurants, and transport services. ATMs are available at Auckland Airport if you need cash." }
      },
      {
        "@type": "Question",
        "name": "Is there free WiFi at Auckland Airport?",
        "acceptedAnswer": { "@type": "Answer", "text": "Yes, Auckland Airport offers free unlimited WiFi throughout the terminal. Connect to the 'Auckland Airport Free WiFi' network. However, speeds can be slow during busy periods, so having your own mobile data (via eSIM or local SIM) is more reliable." }
      }
    ]
  };

  const sections = [
    {
      icon: Plane,
      title: "Step 1: Landing & Immigration",
      items: [
        "Follow signs to 'Arrivals' after landing",
        "Have your passport and completed arrival card ready",
        "NZ Electronic Travel Authority (NZeTA) required for visa-waiver countries",
        "Immigration processing: 15-30 minutes (longer for non-NZ/AU passports)",
        "Declare any criminal convictions — NZ is strict on entry requirements"
      ]
    },
    {
      icon: Shield,
      title: "Step 2: Biosecurity & Customs",
      items: [
        "New Zealand has the strictest biosecurity in the world",
        "Declare ALL food, plant material, seeds, wooden items, and outdoor gear",
        "Sniffer dogs check luggage — undeclared items = instant $400 fine",
        "Hiking boots and camping gear must be clean and free of soil",
        "When in doubt, declare it — there is no penalty for declaring"
      ]
    },
    {
      icon: Luggage,
      title: "Step 3: Collect Your Bags",
      items: [
        "Baggage carousels are in the arrivals hall after customs",
        "Trolleys are free to use at Auckland Airport",
        "Report lost luggage at your airline's counter before leaving",
        "Oversized/sporting equipment collected from a separate area",
        "Allow 20-40 minutes for bags to appear after landing"
      ]
    },
    {
      icon: CreditCard,
      title: "Step 4: Money & SIM Cards",
      items: [
        "NZ Dollar (NZD) — cards accepted almost everywhere",
        "ATMs and currency exchange available in the arrivals hall",
        "Travelex and other exchange offices are in the terminal",
        "Buy a local SIM card from Spark, Vodafone, or 2degrees at the airport",
        "Or get an eSIM at zoobicon.com before you fly for instant data on landing"
      ]
    },
    {
      icon: Car,
      title: "Step 5: Getting to Your Destination",
      items: [
        "Private airport transfer — door-to-door, driver meets you at arrivals",
        "SkyBus — public bus to Auckland CBD ($18, every 10-15 mins)",
        "Taxi rank — outside the arrivals terminal (metered, $80-100 to CBD)",
        "Rental cars — counters in the arrivals hall, shuttle to car park",
        "Rideshare (Uber) — pickup from designated zone outside arrivals"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>Auckland Airport Arrivals Guide 2026 | What to Expect When You Land</title>
        <meta name="description" content="Complete guide to arriving at Auckland Airport. Step-by-step: immigration, customs, biosecurity, baggage, SIM cards, currency, and transport to Auckland city. Updated 2026." />
        <meta name="keywords" content="Auckland Airport arrivals, arriving Auckland Airport, Auckland Airport customs, Auckland Airport transport, getting from Auckland Airport to city, Auckland Airport guide, New Zealand airport arrival" />
        <link rel="canonical" href="https://bookaride.co.nz/auckland-airport-arrivals-guide" />
        <meta property="og:title" content="Auckland Airport Arrivals Guide 2026 - Everything You Need to Know" />
        <meta property="og:description" content="Step-by-step guide to arriving at Auckland Airport. Immigration, customs, biosecurity, transport options, and tips for first-time visitors." />
        <meta property="og:url" content="https://bookaride.co.nz/auckland-airport-arrivals-guide" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(guideSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109db05?auto=format&fit=crop&w=1920&q=80"
            alt="Auckland Airport arrivals"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/70 to-gray-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-gold/20 text-gold text-sm font-semibold px-4 py-2 rounded-full border border-gold/30 mb-6">
              TRAVEL GUIDE
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Auckland Airport <span className="text-gold">Arrivals Guide</span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Everything you need to know about arriving in New Zealand — from landing to reaching your destination
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-white/70">
              <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Updated March 2026</span>
              <span className="flex items-center gap-2"><Globe className="w-4 h-4" /> For international visitors</span>
              <span className="flex items-center gap-2"><Info className="w-4 h-4" /> 8 min read</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <section className="bg-gray-900 border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-gold font-bold text-lg">30-60 min</p>
              <p className="text-white/60 text-sm">Customs & Immigration</p>
            </div>
            <div>
              <p className="text-gold font-bold text-lg">Free WiFi</p>
              <p className="text-white/60 text-sm">Available throughout</p>
            </div>
            <div>
              <p className="text-gold font-bold text-lg">NZD</p>
              <p className="text-white/60 text-sm">Cards accepted everywhere</p>
            </div>
            <div>
              <p className="text-gold font-bold text-lg">24/7</p>
              <p className="text-white/60 text-sm">Transport available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-step Guide */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Your Step-by-Step Arrival Guide</h2>
            <div className="space-y-8">
              {sections.map((section, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                      <ul className="space-y-3">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx} className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Transport Comparison */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">Auckland Airport Transport Options Compared</h2>
            <p className="text-gray-600 text-center mb-12">Choose the best way to get from the airport to your destination</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="p-4 rounded-tl-lg">Option</th>
                    <th className="p-4">Price to CBD</th>
                    <th className="p-4">Travel Time</th>
                    <th className="p-4">Best For</th>
                    <th className="p-4 rounded-tr-lg">Door-to-Door</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gold/5 border-b border-gold/20">
                    <td className="p-4 font-bold text-gray-900">Private Transfer</td>
                    <td className="p-4 text-gray-700">From $150</td>
                    <td className="p-4 text-gray-700">30-40 min</td>
                    <td className="p-4 text-gray-700">Families, groups, luggage</td>
                    <td className="p-4"><CheckCircle className="w-5 h-5 text-green-500" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-bold text-gray-900">SkyBus</td>
                    <td className="p-4 text-gray-700">$18</td>
                    <td className="p-4 text-gray-700">45-60 min</td>
                    <td className="p-4 text-gray-700">Solo travellers, CBD only</td>
                    <td className="p-4 text-gray-400 text-sm">CBD stops only</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-bold text-gray-900">Taxi</td>
                    <td className="p-4 text-gray-700">$80-100</td>
                    <td className="p-4 text-gray-700">30-40 min</td>
                    <td className="p-4 text-gray-700">Quick trips, no prebooking</td>
                    <td className="p-4"><CheckCircle className="w-5 h-5 text-green-500" /></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4 font-bold text-gray-900">Uber/Rideshare</td>
                    <td className="p-4 text-gray-700">$50-80</td>
                    <td className="p-4 text-gray-700">30-45 min</td>
                    <td className="p-4 text-gray-700">Budget, solo</td>
                    <td className="p-4"><CheckCircle className="w-5 h-5 text-green-500" /></td>
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-gray-900">Rental Car</td>
                    <td className="p-4 text-gray-700">From $40/day</td>
                    <td className="p-4 text-gray-700">Self-drive</td>
                    <td className="p-4 text-gray-700">Road trips, flexibility</td>
                    <td className="p-4 text-gray-400 text-sm">Self-drive</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Pro Tips for First-Time Visitors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { icon: Wifi, title: "Get an eSIM Before You Fly", desc: "Have mobile data ready the moment you land. Get your NZ eSIM at zoobicon.com — no queuing at SIM card shops, no swapping physical cards. Essential for maps and rideshare apps." },
                { icon: Clock, title: "Book Your Transfer in Advance", desc: "Airport taxi queues can be 30+ minutes during peak arrivals (6-10am). Pre-booking a transfer means your driver is waiting for you." },
                { icon: Shield, title: "Declare Everything at Biosecurity", desc: "New Zealand takes biosecurity seriously. When in doubt, declare it. There is no penalty for declaring — only for not declaring." },
                { icon: CreditCard, title: "Cards Work Everywhere", desc: "You rarely need cash in NZ. Contactless payments (tap and go) work at most places. Your overseas card will work — just notify your bank of travel." },
                { icon: Globe, title: "NZ Time is UTC+12 (or +13 in Summer)", desc: "Adjust your watch on arrival. NZ is one of the first countries to see the new day. Jet lag from the Northern Hemisphere can be significant." },
                { icon: MapPin, title: "Auckland is Spread Out", desc: "Unlike compact European cities, Auckland covers a large area. The CBD is just one small part. Your accommodation might be 30-60km from the airport." }
              ].map((tip, idx) => (
                <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <tip.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-2">{tip.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{tip.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq, idx) => (
                <details key={idx} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="p-6 cursor-pointer font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-100 transition-colors">
                    {faq.name}
                    <ArrowRight className="w-5 h-5 text-gray-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed">
                    {faq.acceptedAnswer.text}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Skip the Taxi Queue — Book Your Airport Transfer Now
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Your driver will be waiting at arrivals with your name. Door-to-door service, fixed pricing, no surprises.
          </p>
          <Link to="/book-now">
            <Button className="bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8 py-4 rounded-xl">
              Get Instant Quote <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AucklandAirportArrivalsGuide;
