import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';
import { companyInfo } from '../mock';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 border-t border-white/10 relative overflow-hidden">
      {/* Glass decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <img 
              src="/logo.png" 
              alt="Book A Ride NZ" 
              className="h-14 w-auto mb-4"
            />
            <p className="text-sm text-gray-400 mb-4">
              Your reliable transportation partner in New Zealand. Safe, comfortable rides available 24/7.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-gold transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gold font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-gold transition-colors duration-200">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-sm hover:text-gold transition-colors duration-200">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-gold transition-colors duration-200">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/book-now" className="text-sm hover:text-gold transition-colors duration-200">
                  Book Now
                </Link>
              </li>
              <li>
                <Link to="/afterpay" className="text-sm hover:text-gold transition-colors duration-200 flex items-center gap-1">
                  <span className="text-[#B2FCE4]">●</span> Pay with Afterpay
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gold font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li className="text-sm">Auckland Airport Shuttle</li>
              <li className="text-sm">Hamilton Airport Shuttle</li>
              <li className="text-sm">Whangarei Airport Shuttle</li>
              <li className="text-sm">Private Auckland Transfers</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-gold font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <a href="mailto:info@bookaride.co.nz" className="text-sm hover:text-gold transition-colors duration-200">
                  {companyInfo.email}
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-sm">{companyInfo.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} Book A Ride NZ. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-gold transition-colors duration-200">
                Privacy Policy
              </Link>
              <span className="text-gray-600">|</span>
              <Link to="/terms-and-conditions" className="text-gray-400 hover:text-gold transition-colors duration-200">
                Terms & Conditions
              </Link>
              <span className="text-gray-600">|</span>
              <Link to="/website-usage-policy" className="text-gray-400 hover:text-gold transition-colors duration-200">
                Website Usage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
