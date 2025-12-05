import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  // WhatsApp number (format: country code + number without + or spaces)
  const whatsappNumber = '6421745327';
  const message = 'Hi! I would like to book a ride.';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-5 h-5 animate-pulse" />
      <span className="hidden md:inline font-semibold">WhatsApp Us</span>
      <span className="md:hidden font-semibold">Chat</span>
    </a>
  );
};

export default WhatsAppButton;