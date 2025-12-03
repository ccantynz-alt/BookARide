import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import { companyInfo } from '../mock';

export const Footer = () => {
  return (
    <footer className="bg-black text-white/70 border-t border-gold/20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div>
            <img 
              src="/logo.png" 
              alt="Book A Ride NZ" 
              className="h-16 w-auto mb-6"
            />
            <p className="text-sm text-white/60 mb-6 font-light leading-relaxed">
              Your premier transportation partner in New Zealand. Luxury, reliability, and comfort in every journey.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/50 hover:text-gold transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/50 hover:text-gold transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/50 hover:text-gold transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold font-light tracking-wider uppercase mb-6 text-sm">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm font-light hover:text-gold transition-colors duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm font-light hover:text-gold transition-colors duration-300">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm font-light hover:text-gold transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm font-light hover:text-gold transition-colors duration-300">
                  Book Now
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gold font-light tracking-wider uppercase mb-6 text-sm">Our Services</h3>
            <ul className="space-y-3">
              <li className="text-sm font-light">Airport Transfers</li>
              <li className="text-sm font-light">Corporate Travel</li>
              <li className="text-sm font-light">City Rides</li>
              <li className="text-sm font-light">Special Events</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gold font-light tracking-wider uppercase mb-6 text-sm">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <a href="tel:+6491234567" className="text-sm font-light hover:text-gold transition-colors duration-300">
                  {companyInfo.phone}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <a href="mailto:info@bookaride.co.nz" className="text-sm font-light hover:text-gold transition-colors duration-300">
                  {companyInfo.email}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm font-light">{companyInfo.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-sm text-white/50 font-light">
            © {new Date().getFullYear()} Book A Ride NZ. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
