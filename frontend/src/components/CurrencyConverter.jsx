import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, RefreshCw } from 'lucide-react';

const CurrencyConverter = ({ nzdPrice }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(null);
  
  // Exchange rates (approximate - in production, use a real API)
  const exchangeRates = {
    USD: 0.61,
    AUD: 0.93,
    GBP: 0.48,
    EUR: 0.56,
    CNY: 4.40,
    JPY: 91.50,
    KRW: 810.00,
    INR: 50.80,
    SGD: 0.82,
    PHP: 34.50
  };
  
  const currencyInfo = {
    USD: { symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    AUD: { symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    GBP: { symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    EUR: { symbol: '€', name: 'Euro', flag: '🇪🇺' },
    CNY: { symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    JPY: { symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    KRW: { symbol: '₩', name: 'Korean Won', flag: '🇰🇷' },
    INR: { symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
    SGD: { symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
    PHP: { symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' }
  };

  useEffect(() => {
    if (nzdPrice && exchangeRates[selectedCurrency]) {
      const converted = nzdPrice * exchangeRates[selectedCurrency];
      setConvertedPrice(converted);
    }
  }, [nzdPrice, selectedCurrency]);

  if (!nzdPrice || nzdPrice <= 0) return null;

  const formatPrice = (price, currency) => {
    const info = currencyInfo[currency];
    if (currency === 'JPY' || currency === 'KRW') {
      return `${info.symbol}${Math.round(price).toLocaleString()}`;
    }
    return `${info.symbol}${price.toFixed(2)}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200"
    >
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-blue-600" />
        <span className="font-semibold text-gray-800">Price in Your Currency</span>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {Object.keys(currencyInfo).map((currency) => (
          <button
            key={currency}
            onClick={() => setSelectedCurrency(currency)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCurrency === currency
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-blue-100 border border-gray-200'
            }`}
          >
            {currencyInfo[currency].flag} {currency}
          </button>
        ))}
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{currencyInfo[selectedCurrency].name}</p>
            <p className="text-2xl font-bold text-blue-600">
              {convertedPrice ? formatPrice(convertedPrice, selectedCurrency) : '...'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Original (NZD)</p>
            <p className="text-lg text-gray-600">${Math.round(nzdPrice)}</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Rates are approximate. Final charge in NZD.
        </p>
      </div>
    </motion.div>
  );
};

export default CurrencyConverter;
