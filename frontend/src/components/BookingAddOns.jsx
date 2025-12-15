import React from 'react';
import { motion } from 'framer-motion';
import { Baby, Briefcase, Coffee, Crown, Users, Wifi, Wine, Plane } from 'lucide-react';

const addOns = [
  {
    id: 'meet_greet',
    name: 'Meet & Greet',
    description: 'Driver meets you at arrivals with a name sign',
    price: 15,
    icon: Plane,
    popular: true
  },
  {
    id: 'child_seat',
    name: 'Child Seat',
    description: 'Safe and secure child/booster seat',
    price: 10,
    icon: Baby,
    popular: false
  },
  {
    id: 'extra_luggage',
    name: 'Extra Luggage',
    description: 'Additional large suitcases or equipment',
    price: 15,
    icon: Briefcase,
    popular: false
  },
  {
    id: 'luxury_upgrade',
    name: 'Luxury Vehicle',
    description: 'Upgrade to premium Mercedes or BMW',
    price: 50,
    icon: Crown,
    popular: false
  },
  {
    id: 'coffee_stop',
    name: 'Coffee Stop',
    description: 'Quick stop at a café on the way',
    price: 10,
    icon: Coffee,
    popular: false
  },
  {
    id: 'wifi_tablet',
    name: 'WiFi & Tablet',
    description: 'Stay connected during your journey',
    price: 5,
    icon: Wifi,
    popular: false
  },
  {
    id: 'extra_passengers',
    name: 'Extra Passengers',
    description: 'Additional passengers beyond standard',
    price: 5,
    icon: Users,
    popular: false
  },
  {
    id: 'wine_tour_cooler',
    name: 'Wine Cooler',
    description: 'Keep your wine purchases chilled',
    price: 15,
    icon: Wine,
    popular: false
  }
];

const BookingAddOns = ({ selectedAddOns = [], onAddOnChange, showAll = false }) => {
  const displayedAddOns = showAll ? addOns : addOns.slice(0, 4);

  const handleToggle = (addOnId) => {
    if (selectedAddOns.includes(addOnId)) {
      onAddOnChange(selectedAddOns.filter(id => id !== addOnId));
    } else {
      onAddOnChange([...selectedAddOns, addOnId]);
    }
  };

  const totalAddOnPrice = selectedAddOns.reduce((total, id) => {
    const addOn = addOns.find(a => a.id === id);
    return total + (addOn?.price || 0);
  }, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Enhance Your Journey</h3>
        {totalAddOnPrice > 0 && (
          <span className="text-sm font-medium text-gold">+${totalAddOnPrice} added</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {displayedAddOns.map((addOn, index) => {
          const isSelected = selectedAddOns.includes(addOn.id);
          const Icon = addOn.icon;

          return (
            <motion.button
              key={addOn.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleToggle(addOn.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-gold bg-gold/5 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {/* Popular badge */}
              {addOn.popular && (
                <span className="absolute -top-2 -right-2 bg-gold text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  Popular
                </span>
              )}

              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'bg-gold border-gold' : 'border-gray-300'
                }`}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-gold/20' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-gold' : 'text-gray-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                      {addOn.name}
                    </span>
                    <span className={`font-semibold ${isSelected ? 'text-gold' : 'text-gray-500'}`}>
                      +${addOn.price}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{addOn.description}</p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!showAll && addOns.length > 4 && (
        <button
          type="button"
          className="text-sm text-gold hover:text-yellow-600 font-medium"
          onClick={() => {}}
        >
          + Show more options
        </button>
      )}
    </div>
  );
};

export { addOns };
export default BookingAddOns;
