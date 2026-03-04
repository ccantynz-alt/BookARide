import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Check if already shown this session
    const alreadyShown = sessionStorage.getItem('exitPopupShown');
    if (alreadyShown) {
      setHasShown(true);
      return;
    }

    // Don't show on admin/driver pages or booking success
    if (window.location.pathname.startsWith('/admin') ||
        window.location.pathname.startsWith('/driver') ||
        window.location.pathname.includes('success')) {
      return;
    }

    const handleMouseLeave = (e) => {
      // Only trigger when mouse leaves through top of viewport
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        sessionStorage.setItem('exitPopupShown', 'true');
      }
    };

    // Add delay before enabling exit intent (10 seconds)
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 10000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    // Store email for potential newsletter signup
    try {
      localStorage.setItem('subscriberEmail', email);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={handleClose}
          />

          {/* Popup - centered with max-height constraint */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 left-4 right-4 bottom-4 sm:top-1/2 sm:left-1/2 sm:right-auto sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] sm:w-full sm:max-w-lg flex items-center justify-center"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-full sm:max-h-[85vh] overflow-y-auto w-full">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {!isSubmitted ? (
                <>
                  {/* Header */}
                  <div className="bg-gradient-to-r from-black via-gray-900 to-black p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gold rounded-full mb-4">
                      <Star className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Before You Go...
                    </h2>
                    <p className="text-gold text-lg font-semibold">
                      Stay Connected With Us!
                    </p>
                  </div>

                  {/* Form */}
                  <div className="p-8">
                    <p className="text-gray-600 text-center mb-6">
                      Subscribe to receive travel tips, special announcements, and updates about our Auckland airport transfer services.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 py-6 text-lg border-2 border-gray-200 focus:border-gold"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-6 text-lg flex items-center justify-center gap-2"
                      >
                        Subscribe
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </form>

                    <p className="text-xs text-gray-400 text-center mt-4">
                      No spam, ever. Unsubscribe anytime.
                    </p>
                  </div>
                </>
              ) : (
                /* Success State */
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    You're Subscribed!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Thanks for subscribing. We'll keep you updated with the latest news and travel tips.
                  </p>
                  <Button
                    onClick={handleClose}
                    className="bg-gold hover:bg-gold/90 text-black font-semibold px-8"
                  >
                    Continue Browsing
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ExitIntentPopup;
