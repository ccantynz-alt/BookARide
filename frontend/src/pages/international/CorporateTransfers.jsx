import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Clock, Shield, Globe, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';

const CorporateTransfers = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Corporate Airport Transfers NZ | Business Travel Solutions</title>
        <meta name="description" content="Professional corporate airport transfer services in New Zealand. Account management, invoicing, multiple bookings, and VIP service for business travelers." />
        <meta name="keywords" content="corporate airport transfers, business travel NZ, executive transport, company airport shuttle, business airport service" />
        <link rel="canonical" href="https://bookaridenz.com/international/corporate-transfers" />
      </Helmet>

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6">
              Corporate Airport Transfers
              <span className="block text-gold mt-2">Professional Business Travel Solutions</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Streamline your company's airport transfer needs. Account management, consolidated invoicing, and priority service for your business travelers.
            </p>
            <Link to="/contact">
              <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-8 py-6">
                Request Corporate Account
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Corporate Benefits</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Briefcase className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Account Management</h3>
              <p className="text-gray-600">Dedicated account manager for your company. Single point of contact for all bookings and inquiries.</p>
            </div>
            <div className="text-center p-6">
              <Calendar className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Simplified Billing</h3>
              <p className="text-gray-600">Consolidated monthly invoicing. Track all employee transfers in one detailed report.</p>
            </div>
            <div className="text-center p-6">
              <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-3">Priority Service</h3>
              <p className="text-gray-600">Priority booking and dispatch. VIP treatment for your executives and clients.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Corporate Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Cost Center Allocation</h3>
              <p className="text-gray-600 mb-4">Assign bookings to different departments or cost centers for accurate expense tracking.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Department-level reporting</li>
                <li>✓ Project code assignment</li>
                <li>✓ Client billing pass-through</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Multiple User Access</h3>
              <p className="text-gray-600 mb-4">Multiple employees can book under your corporate account with appropriate permissions.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Role-based access control</li>
                <li>✓ Booking on behalf of others</li>
                <li>✓ Travel coordinator tools</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Flexible Payment Terms</h3>
              <p className="text-gray-600 mb-4">Net 30 payment terms available for established corporate accounts.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Monthly consolidated invoicing</li>
                <li>✓ Credit account options</li>
                <li>✓ Purchase order support</li>
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Detailed Reporting</h3>
              <p className="text-gray-600 mb-4">Comprehensive reports for expense management and budget planning.</p>
              <ul className="space-y-2 text-gray-700">
                <li>✓ Monthly usage reports</li>
                <li>✓ Spend analysis by department</li>
                <li>✓ Custom report generation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8">Ideal for All Business Sizes</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-gold pl-6 py-4">
              <h3 className="text-xl font-semibold mb-2">Small Businesses & Startups</h3>
              <p className="text-gray-600">Occasional business travel made simple. No minimum volume requirements.</p>
            </div>
            <div className="border-l-4 border-gold pl-6 py-4">
              <h3 className="text-xl font-semibold mb-2">Medium Enterprises</h3>
              <p className="text-gray-600">Regular business travel with multiple employees. Volume discounts available.</p>
            </div>
            <div className="border-l-4 border-gold pl-6 py-4">
              <h3 className="text-xl font-semibold mb-2">Large Corporations</h3>
              <p className="text-gray-600">High-volume corporate travel programs. Dedicated account management and custom solutions.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Set Up Your Corporate Account?</h2>
          <p className="text-xl text-gray-300 mb-8">Contact us to discuss your company's airport transfer needs and get started today.</p>
          <Link to="/contact">
            <Button className="bg-gold hover:bg-gold/90 text-black text-lg px-12 py-6">
              Contact Us - Corporate Inquiries
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CorporateTransfers;