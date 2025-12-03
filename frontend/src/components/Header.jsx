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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img 
              src="/logo.png" 
              alt="Book A Ride NZ" 
              className="h-12 w-auto transform group-hover:scale-105 transition-transform duration-200"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 hover:text-brand-blue ${
                  isActive(link.path) ? 'text-brand-blue' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:flex items-center space-x-4">
            <a href="tel:+6491234567" className="flex items-center space-x-2 text-gray-700 hover:text-brand-blue transition-colors duration-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+64 9 123 4567</span>
            </a>
            <Link to="/contact">
              <Button className="bg-brand-blue hover:bg-blue-700 text-white transition-colors duration-200">
                Book a Ride
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:text-brand-blue transition-colors duration-200"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-4 border-t border-gray-200 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsMenuOpen(false)}
                className={`block text-sm font-medium transition-colors duration-200 hover:text-brand-blue ${
                  isActive(link.path) ? 'text-brand-blue' : 'text-gray-700'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a href="tel:+6491234567" className="flex items-center space-x-2 text-gray-700 hover:text-brand-blue transition-colors duration-200">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">+64 9 123 4567</span>
            </a>
          </div>
        )}
      </nav>
    </header>
  );
};
