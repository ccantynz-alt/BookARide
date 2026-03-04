import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, DollarSign } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const MobileStickyButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  // Pages where we don't show the sticky button
  const excludedPaths = ['/book-now', '/admin', '/driver', '/payment', '/checkout'];
  const shouldShow = !excludedPaths.some(path => location.pathname.startsWith(path));

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 300);
    };

    // Show after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  if (!shouldShow || !isVisible) return null;

  return (
    <AnimatePresence>
      {isScrolled && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        >
          {/* Gradient fade */}
          <div className="h-4 bg-gradient-to-t from-white to-transparent" />
          
          {/* Button container */}
          <div className="bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
            <Link to="/book-now" className="block">
              <button className="w-full bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-black font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg transform active:scale-[0.98] transition-all">
                <DollarSign className="w-5 h-5" />
                <span>Get Instant Quote</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <p className="text-center text-xs text-gray-500 mt-2">
              Enter pickup & dropoff for live pricing
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileStickyButton;
