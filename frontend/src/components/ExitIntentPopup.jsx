import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, ArrowRight, Mail } from 'lucide-react';
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

    // Store email (you can connect this to your backend)
    try {
      // Optional: Send to backend
      // await fetch('/api/subscribe', { method: 'POST', body: JSON.stringify({ email }) });
      
      localStorage.setItem('discountEmail', email);
      localStorage.setItem('discountCode', 'WELCOME10');
      setIsSubmitted(true);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

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

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg mx-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {!isSubmitted ? (
                <>
                  {/* Header with gradient */}
                  <div className="bg-gradient-to-r from-black via-gray-900 to-black p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gold rounded-full mb-4">
                      <Gift className="w-8 h-8 text-black" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Wait! Don't Leave Empty-Handed
                    </h2>
                    <p className="text-gold text-xl font-semibold">
                      Get 10% OFF Your First Ride!
                    </p>
                  </div>

                  {/* Form */}
                  <div className="p-8">
                    <p className="text-gray-600 text-center mb-6">
                      Enter your email and we'll send you an exclusive discount code for your first airport transfer.
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
                        className="w-full bg-gold hover:bg-yellow-500 text-black font-semibold py-6 text-lg group"
                      >
                        Claim My 10% Discount
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    You're All Set!
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Your exclusive discount code is:
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <span className="text-2xl font-bold text-gold tracking-wider">WELCOME10</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Enter this code in the <strong>"Have a promo code?"</strong> box when booking to save 10%!
                  </p>
                  <p className="text-xs text-gray-400">
                    Code saved to your clipboard ✓
                  </p>
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
