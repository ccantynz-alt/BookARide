import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, X } from 'lucide-react';

// Realistic NZ names and suburbs for social proof
const recentBookings = [
  { name: "Sarah", suburb: "Orewa", service: "airport transfer", time: "2 mins ago" },
  { name: "Mike", suburb: "Takapuna", service: "airport shuttle", time: "5 mins ago" },
  { name: "Emma", suburb: "Albany", service: "Hobbiton tour", time: "8 mins ago" },
  { name: "David", suburb: "Whangaparaoa", service: "airport transfer", time: "12 mins ago" },
  { name: "Lisa", suburb: "Silverdale", service: "cruise terminal transfer", time: "15 mins ago" },
  { name: "James", suburb: "North Shore", service: "airport shuttle", time: "18 mins ago" },
  { name: "Sophie", suburb: "Devonport", service: "airport transfer", time: "22 mins ago" },
  { name: "Chris", suburb: "Gulf Harbour", service: "Hamilton airport shuttle", time: "25 mins ago" },
  { name: "Anna", suburb: "Hibiscus Coast", service: "airport transfer", time: "28 mins ago" },
  { name: "Tom", suburb: "Matakana", service: "wine tour transfer", time: "32 mins ago" },
  { name: "Rachel", suburb: "Browns Bay", service: "airport shuttle", time: "35 mins ago" },
  { name: "Ben", suburb: "Milford", service: "airport transfer", time: "38 mins ago" },
  { name: "Kate", suburb: "Mairangi Bay", service: "cruise transfer", time: "42 mins ago" },
  { name: "Daniel", suburb: "Torbay", service: "airport shuttle", time: "45 mins ago" },
  { name: "Grace", suburb: "Long Bay", service: "Hobbiton transfer", time: "48 mins ago" },
  { name: "Josh", suburb: "Puhoi", service: "airport transfer", time: "52 mins ago" },
  { name: "Olivia", suburb: "Warkworth", service: "airport shuttle", time: "55 mins ago" },
  { name: "Ryan", suburb: "Snells Beach", service: "airport transfer", time: "58 mins ago" },
  { name: "Mia", suburb: "Stanmore Bay", service: "airport shuttle", time: "1 hour ago" },
  { name: "Jack", suburb: "Red Beach", service: "corporate transfer", time: "1 hour ago" },
];

const RecentBookingsNotification = () => {
  const [currentBooking, setCurrentBooking] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [bookingIndex, setBookingIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Don't show on admin pages
    if (window.location.pathname.startsWith('/admin') || 
        window.location.pathname.startsWith('/driver')) {
      return;
    }

    // Initial delay before first notification (5 seconds)
    const initialDelay = setTimeout(() => {
      showNextBooking();
    }, 5000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (isDismissed) return;

    let hideTimer;
    let nextTimer;

    if (isVisible && !isHovered) {
      // Hide after 6 seconds
      hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);

      // Show next booking after 25-40 seconds (randomized for authenticity)
      const nextDelay = 25000 + Math.random() * 15000;
      nextTimer = setTimeout(() => {
        showNextBooking();
      }, nextDelay);
    }

    return () => {
      clearTimeout(hideTimer);
      clearTimeout(nextTimer);
    };
  }, [isVisible, isHovered, isDismissed]);

  const showNextBooking = () => {
    if (isDismissed) return;
    
    // Get a random booking (not the same as current)
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * recentBookings.length);
    } while (newIndex === bookingIndex && recentBookings.length > 1);
    
    setBookingIndex(newIndex);
    setCurrentBooking(recentBookings[newIndex]);
    setIsVisible(true);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      {isVisible && currentBooking && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-6 z-50 max-w-sm"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Gold accent top bar */}
            <div className="h-1 bg-gradient-to-r from-gold via-yellow-400 to-gold"></div>
            
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar/Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-black font-bold text-lg">
                      {currentBooking.name.charAt(0)}
                    </span>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 font-semibold text-sm">
                    {currentBooking.name} from {currentBooking.suburb}
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    just booked an <span className="text-gold font-medium">{currentBooking.service}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {currentBooking.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Verified booking
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Subtle animation bar at bottom */}
            {!isHovered && (
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-0.5 bg-gold"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RecentBookingsNotification;
