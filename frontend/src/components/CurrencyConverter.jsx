import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';

const CurrencyConverter = ({ nzdAmount }) => {
  const [selectedCurrency, setSelectedCurrency] = useState('NZD');

  // Exchange rates (as of Dec 2024 - approximate)
  const exchangeRates = {
    NZD: 1,
    USD: 0.59,
    EUR: 0.55,
    GBP: 0.47,
    AUD: 0.92,
    CNY: 4.28,
    JPY: 88.5
  };

  const currencySymbols = {
    NZD: 'NZ$',
    USD: 'US$',
    EUR: '€',
    GBP: '£',
    AUD: 'A$',
    CNY: '¥',
    JPY: '¥'
  };

  const currencies = [
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'JPY', name: 'Japanese Yen' }
  ];

  const convertedAmount = (nzdAmount * exchangeRates[selectedCurrency]).toFixed(2);

  return (
    <div className="bg-gradient-to-r from-gold/10 to-yellow-100/50 border border-gold/30 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="w-5 h-5 text-gold" />
        <span className="text-sm font-semibold text-gray-700">View Price In:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {currencies.map((currency) => (
          <button
            key={currency.code}
            onClick={() => setSelectedCurrency(currency.code)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedCurrency === currency.code
                ? 'bg-gold text-black shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {currency.code}
          </button>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gold/20">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Price in {selectedCurrency}:</span>
          <span className="text-2xl font-bold text-gray-900">
            {currencySymbols[selectedCurrency]}{convertedAmount}
          </span>
        </div>
        {selectedCurrency !== 'NZD' && (
          <p className="text-xs text-gray-500 mt-2 text-right">
            ≈ NZ${nzdAmount.toFixed(2)} • Approx. rate
          </p>
        )}
      </div>
    </div>
  );
};

export default CurrencyConverter;