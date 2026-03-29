import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Plane, CheckCircle, ArrowRight, Globe, Shield, CreditCard, Wifi, FileText, Thermometer, Heart, MapPin, Smartphone } from 'lucide-react';
import { Button } from '../../components/ui/button';

const NZTravelChecklist = () => {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "New Zealand Travel Checklist 2026 - Everything You Need Before You Fly",
    "description": "Complete checklist for travelling to New Zealand. Passport, visa, eSIM, travel insurance, airport transfer, what to pack, and essential preparation tips.",
    "author": { "@type": "Organization", "name": "Book A Ride NZ" },
    "publisher": { "@type": "Organization", "name": "Book A Ride NZ", "url": "https://bookaride.co.nz" },
    "datePublished": "2026-03-29",
    "dateModified": "2026-03-29",
    "mainEntityOfPage": "https://bookaride.co.nz/new-zealand-travel-checklist"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What documents do I need to travel to New Zealand?",
        "acceptedAnswer": { "@type": "Answer", "text": "You need a valid passport (valid for at least 3 months beyond your departure date), a New Zealand Electronic Travel Authority (NZeTA) for visa-waiver countries, or a valid visa. You also need a completed New Zealand Traveller Declaration (NZTD) submitted online before arrival." }
      },
      {
        "@type": "Question",
        "name": "Do I need travel insurance for New Zealand?",
        "acceptedAnswer": { "@type": "Answer", "text": "Travel insurance is not legally required but strongly recommended. New Zealand's public healthcare system (ACC) covers accident injuries for visitors, but illness, trip cancellation, lost luggage, and repatriation are not covered. Medical costs without insurance can be very expensive." }
      },
      {
        "@type": "Question",
        "name": "What is the best way to get mobile data in New Zealand?",
        "acceptedAnswer": { "@type": "Answer", "text": "The fastest option is an eSIM — you can purchase and activate it before you fly, so you have data the moment you land. Alternatively, you can buy a physical SIM card from Spark, Vodafone, or 2degrees at Auckland Airport. An eSIM avoids queuing and works with most modern smartphones." }
      },
      {
        "@type": "Question",
        "name": "What should I NOT bring to New Zealand?",
        "acceptedAnswer": { "@type": "Answer", "text": "New Zealand has extremely strict biosecurity. Do not bring: fresh food (fruit, vegetables, meat, dairy), seeds or plant material, honey, wooden items, dirty outdoor equipment, or animal products. Fines for undeclared items start at $400 NZD. When in doubt, declare it at customs." }
      }
    ]
  };

  const checklistSections = [
    {
      title: "Documents & Essentials",
      icon: FileText,
      color: "blue",
      items: [
        { text: "Passport (valid 3+ months beyond departure)", priority: "essential" },
        { text: "NZeTA (New Zealand Electronic Travel Authority) or visa", priority: "essential" },
        { text: "NZTD (New Zealand Traveller Declaration) submitted online", priority: "essential" },
        { text: "Return or onward flight ticket (may be asked at immigration)", priority: "essential" },
        { text: "Travel insurance documents", priority: "recommended" },
        { text: "Accommodation confirmation for first night", priority: "recommended" },
        { text: "Copies of all documents (digital + paper)", priority: "recommended" }
      ]
    },
    {
      title: "Connectivity & Technology",
      icon: Smartphone,
      color: "green",
      items: [
        { text: "eSIM for NZ mobile data — get yours at zoobicon.com (activate before you fly)", priority: "recommended" },
        { text: "Power adapter (NZ uses Type I plug, 230V)", priority: "essential" },
        { text: "Download offline maps of NZ (Google Maps or Maps.me)", priority: "recommended" },
        { text: "Portable charger / power bank for flights", priority: "optional" },
        { text: "Download translation app if needed", priority: "optional" }
      ]
    },
    {
      title: "Money & Payments",
      icon: CreditCard,
      color: "amber",
      items: [
        { text: "Notify your bank of NZ travel dates", priority: "essential" },
        { text: "Visa or Mastercard for contactless payments", priority: "essential" },
        { text: "Small amount of NZD cash for rural areas", priority: "recommended" },
        { text: "Check your card's international transaction fees", priority: "recommended" },
        { text: "Apple Pay / Google Pay set up on your phone", priority: "optional" }
      ]
    },
    {
      title: "Transport & Getting Around",
      icon: MapPin,
      color: "purple",
      items: [
        { text: "Airport transfer booked in advance", priority: "recommended" },
        { text: "International driving permit (if renting a car)", priority: "essential" },
        { text: "NZ drives on the LEFT side of the road", priority: "essential" },
        { text: "Download rideshare apps (Uber works in Auckland)", priority: "optional" },
        { text: "Research intercity transport (bus, domestic flights)", priority: "optional" }
      ]
    },
    {
      title: "Health & Safety",
      icon: Heart,
      color: "red",
      items: [
        { text: "Prescription medications with doctor's letter", priority: "essential" },
        { text: "Sunscreen SPF50+ (NZ UV is extremely strong)", priority: "essential" },
        { text: "Insect repellent (sandflies in South Island)", priority: "recommended" },
        { text: "First aid kit for hiking/outdoor activities", priority: "optional" },
        { text: "Know emergency number: 111 (police, fire, ambulance)", priority: "essential" }
      ]
    },
    {
      title: "What to Pack",
      icon: Thermometer,
      color: "teal",
      items: [
        { text: "Layers — NZ weather changes rapidly (4 seasons in 1 day)", priority: "essential" },
        { text: "Waterproof jacket (rain is common year-round)", priority: "essential" },
        { text: "Comfortable walking shoes for outdoor activities", priority: "essential" },
        { text: "Swimwear (beaches, hot pools, lakes)", priority: "recommended" },
        { text: "Warm fleece/jacket (even in summer, evenings are cool)", priority: "recommended" },
        { text: "Hat and sunglasses (ozone layer is thinner over NZ)", priority: "essential" }
      ]
    }
  ];

  const priorityStyles = {
    essential: "bg-red-50 text-red-700 border-red-200",
    recommended: "bg-amber-50 text-amber-700 border-amber-200",
    optional: "bg-gray-50 text-gray-600 border-gray-200"
  };

  const priorityLabels = {
    essential: "Must have",
    recommended: "Recommended",
    optional: "Nice to have"
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>New Zealand Travel Checklist 2026 | Everything You Need Before You Fly</title>
        <meta name="description" content="Complete New Zealand travel checklist. Passport, visa, NZeTA, eSIM, travel insurance, airport transfer, what to pack, and essential preparation tips. Free printable checklist." />
        <meta name="keywords" content="New Zealand travel checklist, NZ travel preparation, what to bring to New Zealand, New Zealand visa requirements, NZeTA, NZ travel essentials, packing list New Zealand, New Zealand travel tips" />
        <link rel="canonical" href="https://bookaride.co.nz/new-zealand-travel-checklist" />
        <meta property="og:title" content="New Zealand Travel Checklist 2026 - Everything You Need" />
        <meta property="og:description" content="Don't forget anything. Complete checklist for travelling to New Zealand — documents, tech, money, transport, health, and packing." />
        <meta property="og:url" content="https://bookaride.co.nz/new-zealand-travel-checklist" />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507699622108-4be3abd695ad?auto=format&fit=crop&w=1920&q=80"
            alt="New Zealand landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/70 to-gray-900" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block bg-gold/20 text-gold text-sm font-semibold px-4 py-2 rounded-full border border-gold/30 mb-6">
              TRAVEL CHECKLIST
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              New Zealand <span className="text-gold">Travel Checklist</span>
            </h1>
            <p className="text-xl text-white/80 mb-8">
              Everything you need to prepare before flying to New Zealand — don't leave home without checking these off
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">Must have</span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">Recommended</span>
              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-300 border border-gray-500/30">Nice to have</span>
            </div>
          </div>
        </div>
      </section>

      {/* Checklist Sections */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            {checklistSections.map((section, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gray-900 px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                    <section.icon className="w-5 h-5 text-gold" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{section.title}</h2>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3">
                        <div className="mt-0.5 flex-shrink-0">
                          <div className="w-5 h-5 rounded border-2 border-gray-300" />
                        </div>
                        <span className="text-gray-700 flex-1">{item.text}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${priorityStyles[item.priority]}`}>
                          {priorityLabels[item.priority]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Essential New Zealand Travel Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Globe, title: "Time Zone", desc: "UTC+12 (UTC+13 during daylight saving, Sep-Apr). NZ is one of the first countries to see the new day." },
                { icon: Thermometer, title: "Climate", desc: "Temperate. Summer (Dec-Feb) 20-30°C, Winter (Jun-Aug) 5-15°C. Weather changes quickly — always carry layers." },
                { icon: CreditCard, title: "Currency", desc: "New Zealand Dollar (NZD). Cards accepted almost everywhere. Contactless payments (tap to pay) widely used." },
                { icon: Wifi, title: "Connectivity", desc: "Free WiFi at airports and cafes. Mobile coverage good in cities, patchy in rural areas. Get an eSIM at zoobicon.com for reliable data from the moment you land." },
                { icon: Shield, title: "Safety", desc: "New Zealand is very safe. Emergency number: 111. ACC covers accident injuries for all visitors. Tap water is safe to drink." },
                { icon: Plane, title: "Getting Around", desc: "Domestic flights connect major cities. Intercity buses available. Rental cars popular for road trips. Drive on the LEFT." }
              ].map((info, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <info.icon className="w-8 h-8 text-gold mb-4" />
                  <h3 className="font-bold text-gray-900 mb-2">{info.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{info.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Common Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq, idx) => (
                <details key={idx} className="group bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <summary className="p-6 cursor-pointer font-semibold text-gray-900 flex items-center justify-between hover:bg-gray-50 transition-colors">
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
            Tick Off Your Airport Transfer
          </h2>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            One less thing to worry about. Book your airport transfer now and your driver will be waiting when you land.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-yellow-500 text-black font-bold text-lg px-8 py-4 rounded-xl">
                Book Airport Transfer <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/auckland-airport-arrivals-guide">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 rounded-xl">
                Read Arrivals Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NZTravelChecklist;
