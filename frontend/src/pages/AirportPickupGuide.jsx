import React from 'react';
import { MapPin, Plane, Clock, Phone, CheckCircle, ArrowRight, Coffee, Car, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AirportPickupGuide() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-amber-50 to-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Plane className="w-4 h-4" />
            Auckland Airport Pickup Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Where to Meet Your Driver
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Easy step-by-step instructions to find your BookaRide driver at Auckland Airport
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* International Terminal */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">International Terminal</h2>
              <p className="text-gray-500">Arriving from overseas</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Allpress Cafe Meeting Point</h3>
                <p className="text-gray-600 leading-relaxed">
                  Your driver will be waiting at the <strong>Allpress Cafe</strong> area in the arrivals hall.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-5 border border-blue-100">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                How to Find Us:
              </h4>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">1</span>
                  <p className="text-gray-700">After collecting your luggage, walk through customs into the <strong>public arrivals area</strong></p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">2</span>
                  <p className="text-gray-700"><strong>Turn LEFT</strong> once you enter the public area</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">3</span>
                  <p className="text-gray-700">Look for the <strong>Allpress Cafe</strong> (ALLPRESS signage)</p>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">4</span>
                  <p className="text-gray-700">You'll see a <strong>bench in front of the cafe</strong> - drivers stand here holding signs with passenger names</p>
                </li>
              </ol>
            </div>
            
            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-amber-800 flex items-center gap-2">
                <Users className="w-5 h-5 flex-shrink-0" />
                <span><strong>Look for your name!</strong> Your driver will be holding a sign with your name on it.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Domestic Terminal */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-green-600 rotate-45" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Domestic Terminal</h2>
              <p className="text-gray-500">Arriving from within New Zealand</p>
            </div>
          </div>
          
          <div className="space-y-6">
            
            {/* Regionals */}
            <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">R</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Regional Flights</h3>
                  <p className="text-gray-500 text-sm">Air New Zealand Regional, Sounds Air, etc.</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-green-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Luggage Claim Area</p>
                    <p className="text-gray-600 mt-1">Meet at the luggage claim, <strong>opposite Krispy Kreme Doughnuts</strong></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cities */}
            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">C</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Cities Flights</h3>
                  <p className="text-gray-500 text-sm">Air New Zealand mainline domestic</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-purple-100">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Outside Arrivals - Dunkin' Donuts</p>
                    <p className="text-gray-600 mt-1">Walk out of arrivals and look for <strong>Dunkin' Donuts</strong> - your driver will be standing there</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Jetstar */}
            <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-100 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">J</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Jetstar Flights</h3>
                  <p className="text-gray-500 text-sm">Jetstar domestic arrivals</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-orange-100">
                <div className="flex items-start gap-3">
                  <Car className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-700 font-medium">Jetstar Car Park</p>
                    <p className="text-gray-600 mt-1">Walk through <strong>Door 5 & 6</strong>, then <strong>turn LEFT</strong> into the Jetstar car park. Your driver will meet you there.</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-gray-50 rounded-2xl p-6 md:p-8 mb-12">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Helpful Tips
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Flight Delays?</p>
                  <p className="text-gray-600 text-sm mt-1">Don't worry! We track your flight and adjust pickup time automatically.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Look for Your Name</p>
                  <p className="text-gray-600 text-sm mt-1">Your driver will hold a sign with your name on it.</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Can't Find Your Driver?</p>
                  <p className="text-gray-600 text-sm mt-1">Call us: <a href="tel:+6421743321" className="text-amber-600 font-semibold">021 743 321</a></p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900">Stay in the Meeting Area</p>
                  <p className="text-gray-600 text-sm mt-1">If you can't see your driver, stay at the designated pickup point.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-2">Need Help?</h3>
          <p className="text-amber-100 mb-6">Our team is here to assist you</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+6421743321"
              className="inline-flex items-center justify-center gap-2 bg-white text-amber-600 px-6 py-3 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
            >
              <Phone className="w-5 h-5" />
              021 743 321
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 bg-amber-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-300 transition-colors"
            >
              Contact Us
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>

      </div>

      {/* Footer Note */}
      <div className="bg-gray-50 py-8 px-4 text-center">
        <p className="text-gray-500 text-sm">
          BookaRide NZ • Premium Airport Transfers • Auckland, New Zealand
        </p>
      </div>
    </div>
  );
}
