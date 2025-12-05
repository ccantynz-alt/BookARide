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
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b-2 border-gold/40 shadow-xl" style={{ backgroundColor: 'rgba(17, 24, 39, 0.98)' }}>
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo - Enhanced */}
          <Link to="/" className="flex items-center space-x-3 group relative">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Logo container with background */}
            <div className="relative bg-gradient-to-br from-gold/10 to-transparent p-3 rounded-xl border border-gold/30 group-hover:border-gold/60 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-gold/20 logo-glow">
              <img 
                src="/logo.png" 
                alt="Book A Ride NZ" 
                className="h-20 w-auto transform group-hover:scale-110 transition-all duration-300 relative z-10"
                style={{ 
                  filter: 'brightness(1.4) contrast(1.2) drop-shadow(0 4px 12px rgba(212, 175, 55, 0.5))',
                }}
              />
            </div>
            
            {/* Animated ring */}
            <div className="absolute inset-0 rounded-xl border-2 border-gold/0 group-hover:border-gold/50 animate-pulse-slow transition-all duration-500" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 hover:text-gold ${
                  isActive(link.path) ? 'text-gold' : 'text-white/90'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button & Language Selector */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
            <Link to="/book-now">
              <Button className="bg-gold hover:bg-gold/90 text-black font-semibold transition-colors duration-200">
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
