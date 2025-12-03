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
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Book Now' }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-gold/20">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.png" 
              alt="Book A Ride NZ" 
              className="h-12 w-auto transform group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-light tracking-wider uppercase transition-colors duration-300 hover:text-gold ${
                  isActive(link.path) ? 'text-gold' : 'text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="tel:+6491234567" className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-300">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-light tracking-wide">+64 9 123 4567</span>
            </a>
            <Link to="/contact">
              <Button className="bg-gold hover:bg-gold/90 text-black font-light tracking-wider uppercase px-6 transition-all duration-300 hover:shadow-lg hover:shadow-gold/20">
                Reserve Now
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white hover:text-gold transition-colors duration-300"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-6 pb-6 space-y-4 border-t border-gold/20 pt-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-light tracking-wider uppercase transition-colors duration-300 hover:text-gold ${
                  isActive(link.path) ? 'text-gold' : 'text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a href="tel:+6491234567" className="flex items-center space-x-2 text-white/80 hover:text-gold transition-colors duration-300">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-light tracking-wide">+64 9 123 4567</span>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};
