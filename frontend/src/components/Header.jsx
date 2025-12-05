import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { LanguageSelector } from './LanguageSelector';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/services', label: 'Services' },
    { path: '/hobbiton-transfers', label: 'Hobbiton' },
    { path: '/cruise-transfers', label: 'Cruise' },
    { path: '/about', label: 'About' },
    { path: '/book-now', label: 'Book Now' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-gray-900/95 border-b border-gold/20 shadow-2xl">
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60"></div>
      
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.png" 
              alt="Book A Ride NZ" 
              className="h-16 w-auto transform group-hover:scale-105 transition-transform duration-200"
              style={{ 
                filter: 'brightness(1.8) contrast(1.3) saturate(1.2) drop-shadow(0 2px 12px rgba(212, 175, 55, 0.4))',
              }}
            />
          </Link>

          {/* Desktop Navigation - Enhanced */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 rounded-lg group ${
                  isActive(link.path) 
                    ? 'text-gold bg-gold/10' 
                    : 'text-white/90 hover:text-gold hover:bg-white/5'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gold transition-all duration-300 ${
                  isActive(link.path) ? 'w-3/4' : 'group-hover:w-3/4'
                }`}></span>
              </Link>
            ))}
          </div>

          {/* CTA Button & Language Selector - Enhanced */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <Link to="/book-now">
              <Button className="bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-500 hover:to-gold text-black font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-gold/30 hover:scale-105">
                Book a Ride
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-gold transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-gold/20 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium transition-colors duration-200 hover:text-gold ${
                  isActive(link.path) ? 'text-gold' : 'text-white/90'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a href="tel:+6421743321" className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+64 21 743 321</span>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};
