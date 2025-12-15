import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronRight, MapPin, Utensils, Camera, Sun, DollarSign, Car, Plane, Heart } from 'lucide-react';

const NZTravelTips = () => {
  const [expandedCategory, setExpandedCategory] = useState('getting-around');

  const categories = [
    {
      id: 'getting-around',
      title: 'Getting Around',
      icon: Car,
      color: 'blue',
      tips: [
        'NZ drives on the LEFT side of the road',
        'Auckland traffic peaks 7-9am and 4-6pm',
        'Pre-book airport transfers to avoid taxi queues',
        'Toll roads use electronic tags or online payment',
        'Uber/Ola available but surge pricing common at airport'
      ]
    },
    {
      id: 'must-see',
      title: 'Must-See Near Auckland',
      icon: Camera,
      color: 'green',
      tips: [
        'Hobbiton Movie Set - 2hrs south (we do tours!)',
        'Waitomo Glowworm Caves - 2.5hrs south',
        'Waiheke Island - 40min ferry from downtown',
        'Piha Beach - stunning black sand, 45min west',
        'Rotorua geothermal area - 3hrs south'
      ]
    },
    {
      id: 'food',
      title: 'Food & Drink',
      icon: Utensils,
      color: 'orange',
      tips: [
        'Try a \'Flat White\' coffee - NZ invention!',
        'Fish & chips are a Kiwi staple',
        'Hangi (Maori feast) in Rotorua is a must',
        'NZ wines: Sauvignon Blanc & Pinot Noir',
        'Tip: 10-15% for great service (not mandatory)'
      ]
    },
    {
      id: 'weather',
      title: 'Weather & Packing',
      icon: Sun,
      color: 'yellow',
      tips: [
        'NZ has 4 seasons in one day - pack layers!',
        'Summer (Dec-Feb): 20-25°C, sunscreen essential',
        'UV is very strong - slip, slop, slap!',
        'Rain gear recommended year-round',
        'Comfortable walking shoes are a must'
      ]
    },
    {
      id: 'money',
      title: 'Money Tips',
      icon: DollarSign,
      color: 'purple',
      tips: [
        'Currency: NZ Dollar (NZD)',
        'Cards widely accepted, even for small purchases',
        'ATMs at airport charge ~$5 fee',
        'GST (15%) included in all prices',
        'Tourist Tax Refund available at airport'
      ]
    },
    {
      id: 'culture',
      title: 'Kiwi Culture',
      icon: Heart,
      color: 'red',
      tips: [
        '\'Kia Ora\' = Hello in Maori',
        'Kiwis are friendly - don\'t be shy to chat!',
        'Remove shoes when entering homes',
        '\'Sweet as\' means \'great/awesome\'',
        'Rugby is religion here - join the excitement!'
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-gold" />
        <h3 className="text-xl font-bold text-gray-800">NZ Travel Tips</h3>
      </div>
      
      <p className="text-gray-600 mb-4">
        First time in New Zealand? Here's what you need to know! 🇳🇿
      </p>
      
      <div className="space-y-3">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isExpanded = expandedCategory === category.id;
          
          return (
            <div key={category.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className={`w-full flex items-center justify-between p-4 transition-colors ${
                  isExpanded ? 'bg-gold/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isExpanded ? 'bg-gold text-black' : 'bg-white text-gray-600'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className={`font-semibold ${
                    isExpanded ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {category.title}
                  </span>
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`} />
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 space-y-2">
                      {category.tips.map((tip, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-gold mt-0.5">•</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 p-4 bg-gradient-to-r from-gold/10 to-amber-50 rounded-lg border border-gold/20">
        <p className="text-sm text-gray-700">
          <strong>🚗 Pro Tip:</strong> Book a Hobbiton day trip with us! We'll pick you up from your hotel and handle everything.
        </p>
      </div>
    </motion.div>
  );
};

export default NZTravelTips;
