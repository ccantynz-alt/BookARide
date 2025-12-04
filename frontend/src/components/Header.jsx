import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from './ui/button';

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
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group relative">
            <div className="absolute -inset-2 bg-gold/20 rounded-lg blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <img 
              src="/logo.png" 
              alt="Book A Ride NZ" 
              className="h-16 w-auto transform group-hover:scale-110 transition-all duration-300 relative z-10"
              style={{ 
                filter: 'brightness(1.2) contrast(1.15) drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))',
              }}
            />
            <div className="hidden lg:block relative z-10">
              <div className="text-xl font-bold text-white group-hover:text-gold transition-colors duration-300" style={{ textShadow: '0 0 10px rgba(212, 175, 55, 0.3)' }}>
                BookaRide
              </div>
              <div className="text-xs text-gold/80 font-medium tracking-wide">
                Premium Airport Shuttles
              </div>
            </div>
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

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="tel:+6491234567" className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+64 9 123 4567</span>
            </a>
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
            <a href="tel:+6491234567" className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+64 9 123 4567</span>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};
