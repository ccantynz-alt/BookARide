import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Share2, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

const TripCostSplitter = ({ totalPrice, passengers }) => {
  const [splitCount, setSplitCount] = useState(passengers || 2);
  const [copied, setCopied] = useState(false);
  
  if (!totalPrice || totalPrice <= 0) return null;
  
  const pricePerPerson = totalPrice / splitCount;
  
  const handleShare = async () => {
    const shareText = `Hey! Our airport transfer is $${Math.round(totalPrice)} total. Your share is $${pricePerPerson.toFixed(2)} (split ${splitCount} ways). Book at bookaride.co.nz 🚗✈️`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Split our ride cost',
          text: shareText,
          url: 'https://bookaride.co.nz'
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-gray-800">Split the Cost</span>
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <span className="text-sm text-gray-600">Split between:</span>
        <div className="flex items-center gap-1">
          {[2, 3, 4, 5, 6].map((num) => (
            <button
              key={num}
              onClick={() => setSplitCount(num)}
              className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                splitCount === num
                  ? 'bg-purple-600 text-white shadow-md scale-110'
                  : 'bg-white text-gray-600 hover:bg-purple-100 border border-gray-200'
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-sm text-gray-600">people</span>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-purple-100">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500">Total Trip Cost</p>
            <p className="text-xl font-bold text-gray-800">${Math.round(totalPrice)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Per Person ({splitCount} people)</p>
            <p className="text-xl font-bold text-purple-600">${pricePerPerson.toFixed(2)}</p>
          </div>
        </div>
        
        <Button
          onClick={handleShare}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {copied ? (
            <><Check className="w-4 h-4 mr-2" /> Copied!</>
          ) : (
            <><Share2 className="w-4 h-4 mr-2" /> Share with Friends</>
          )}
        </Button>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Tip: Share with your travel group to collect their share easily!
      </p>
    </motion.div>
  );
};

export default TripCostSplitter;
