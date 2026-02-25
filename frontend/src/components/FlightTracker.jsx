import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Clock, CheckCircle, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FlightTracker = ({ flightNumber, onFlightData, showInline = false }) => {
  const [flight, setFlight] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [manualFlightNumber, setManualFlightNumber] = useState(flightNumber || '');

  useEffect(() => {
    if (flightNumber) {
      setManualFlightNumber(flightNumber);
      trackFlight(flightNumber);
    }
  }, [flightNumber]);

  const trackFlight = async (fn) => {
    if (!fn || fn.length < 3) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/flight/track?flight_number=${encodeURIComponent(fn)}`);
      
      if (!response.ok) {
        throw new Error('Flight not found');
      }

      const data = await response.json();
      setFlight(data);
      
      if (onFlightData) {
        onFlightData(data);
      }
    } catch (err) {
      setError('Unable to track flight. Please check the flight number.');
      setFlight(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'on time':
      case 'landed':
      case 'arrived':
        return 'text-green-600 bg-green-50';
      case 'delayed':
        return 'text-orange-600 bg-orange-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'on time':
      case 'landed':
      case 'arrived':
        return <CheckCircle className="w-4 h-4" />;
      case 'delayed':
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Plane className="w-4 h-4" />;
    }
  };

  if (showInline) {
    return (
      <div className="space-y-3">
        {/* Inline flight input */}
        <div className="flex gap-2">
          <Input
            value={manualFlightNumber}
            onChange={(e) => setManualFlightNumber(e.target.value.toUpperCase())}
            placeholder="e.g., NZ123"
            className="flex-1 uppercase"
          />
          <Button
            type="button"
            onClick={() => trackFlight(manualFlightNumber)}
            disabled={isLoading || !manualFlightNumber}
            variant="outline"
            className="px-4"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
          </Button>
        </div>

        {/* Flight status display */}
        <AnimatePresence>
          {flight && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-gray-900">{flight.flightNumber}</span>
                </div>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
                  {getStatusIcon(flight.status)}
                  {flight.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Departure</p>
                  <p className="font-medium">{flight.departure?.airport}</p>
                  <p className="text-gray-600">{flight.departure?.time}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Arrival</p>
                  <p className="font-medium">{flight.arrival?.airport}</p>
                  <p className="text-gray-600">{flight.arrival?.time}</p>
                  {flight.arrival?.delay && (
                    <p className="text-orange-600 text-xs">Delayed: {flight.arrival.delay}</p>
                  )}
                </div>
              </div>

              {flight.status?.toLowerCase() === 'delayed' && (
                <div className="mt-3 p-2 bg-orange-100 rounded text-xs text-orange-800">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Don't worry! We'll adjust your pickup time automatically.
                </div>
              )}

              <button
                onClick={() => trackFlight(manualFlightNumber)}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh status
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Full card version
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
          <Plane className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Flight Tracker</h3>
          <p className="text-sm text-gray-500">We'll monitor your flight for delays</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <Input
          value={manualFlightNumber}
          onChange={(e) => setManualFlightNumber(e.target.value.toUpperCase())}
          placeholder="Enter flight number (e.g., NZ123)"
          className="flex-1 uppercase"
        />
        <Button
          onClick={() => trackFlight(manualFlightNumber)}
          disabled={isLoading || !manualFlightNumber}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Track'}
        </Button>
      </div>

      <AnimatePresence>
        {flight && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-bold">{flight.flightNumber}</span>
              <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(flight.status)}`}>
                {getStatusIcon(flight.status)}
                {flight.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-2xl font-bold">{flight.departure?.code}</p>
                <p className="text-sm text-gray-500">{flight.departure?.time}</p>
              </div>

              <div className="flex-1 mx-4 flex items-center">
                <div className="flex-1 h-0.5 bg-gray-300"></div>
                <Plane className="w-6 h-6 text-gold mx-2 transform rotate-90" />
                <div className="flex-1 h-0.5 bg-gray-300"></div>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold">{flight.arrival?.code}</p>
                <p className="text-sm text-gray-500">{flight.arrival?.time}</p>
              </div>
            </div>

            {flight.status?.toLowerCase() === 'delayed' && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg text-orange-800 text-sm">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                <strong>Flight Delayed</strong> - Don't worry! We'll automatically adjust your pickup time.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
      )}

      <p className="mt-4 text-xs text-gray-400 text-center">
        We monitor your flight and adjust pickup times for delays automatically
      </p>
    </div>
  );
};

export default FlightTracker;
