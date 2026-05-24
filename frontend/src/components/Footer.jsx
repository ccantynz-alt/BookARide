import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin } from 'lucide-react';
import { companyInfo } from '../mock';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 border-t border-white/10 relative overflow-hidden">
      {/* Glass decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div>
            <img
              src="/logo.png"
              alt="Book A Ride NZ"
              width="180"
              height="56"
              className="h-14 w-auto mb-4"
              loading="lazy"
            />
            <p className="text-sm text-gray-400 mb-4">
              Your reliable transportation partner in New Zealand. Safe, comfortable rides available 24/7.
            </p>
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
                <Link to="/suburbs" className="text-sm hover:text-gold transition-colors duration-200">
                  All Routes
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm hover:text-gold transition-colors duration-200">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-gold font-semibold mb-4">Our Services</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/auckland-airport-shuttle" className="text-sm hover:text-gold transition-colors duration-200">
                  Auckland Airport Shuttle
                </Link>
              </li>
              <li>
                <Link to="/auckland-cbd-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Auckland CBD to Airport
                </Link>
              </li>
              <li>
                <Link to="/hibiscus-coast-airport-shuttle" className="text-sm hover:text-gold transition-colors duration-200">
                  Hibiscus Coast Shuttle
                </Link>
              </li>
              <li>
                <Link to="/north-shore-airport-shuttle" className="text-sm hover:text-gold transition-colors duration-200">
                  North Shore Shuttle
                </Link>
              </li>
              <li>
                <Link to="/hobbiton-transfers" className="text-sm hover:text-gold transition-colors duration-200">
                  Hobbiton Transfers
                </Link>
              </li>
              <li>
                <Link to="/cruise-transfers" className="text-sm hover:text-gold transition-colors duration-200">
                  Cruise Transfers
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Routes — internal linking pulls SEO equity into orphaned suburb pages */}
          <div>
            <h3 className="text-gold font-semibold mb-4">Popular Routes</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/orewa-to-auckland-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Orewa to Airport
                </Link>
              </li>
              <li>
                <Link to="/whangaparoa-airport-transfer" className="text-sm hover:text-gold transition-colors duration-200">
                  Whangaparoa to Airport
                </Link>
              </li>
              <li>
                <Link to="/takapuna-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Takapuna to Airport
                </Link>
              </li>
              <li>
                <Link to="/albany-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Albany to Airport
                </Link>
              </li>
              <li>
                <Link to="/ponsonby-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Ponsonby to Airport
                </Link>
              </li>
              <li>
                <Link to="/parnell-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Parnell to Airport
                </Link>
              </li>
              <li>
                <Link to="/newmarket-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Newmarket to Airport
                </Link>
              </li>
              <li>
                <Link to="/remuera-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Remuera to Airport
                </Link>
              </li>
              <li>
                <Link to="/mt-eden-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Mt Eden to Airport
                </Link>
              </li>
              <li>
                <Link to="/grey-lynn-to-airport" className="text-sm hover:text-gold transition-colors duration-200">
                  Grey Lynn to Airport
                </Link>
              </li>
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
