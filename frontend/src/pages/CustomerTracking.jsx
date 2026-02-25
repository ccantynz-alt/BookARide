import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Clock, Car, User, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function CustomerTracking() {
  const { trackingRef } = useParams();
  const [tracking, setTracking] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, pending, active, completed, error
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Fetch tracking data
  const fetchTracking = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/tracking/${trackingRef}`);
      
      if (response.status === 404) {
        setError('Tracking not found. The link may have expired or is invalid.');
        setStatus('error');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to load tracking');
      }
      
      const data = await response.json();
      setTracking(data);
      setStatus(data.status || 'pending');
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching tracking:', err);
      if (status === 'loading') {
        setError(err.message);
        setStatus('error');
      }
    }
  }, [trackingRef, status]);

  // Initial fetch
  useEffect(() => {
    fetchTracking();
  }, []);

  // Poll for updates when active
  useEffect(() => {
    if (status !== 'active' && status !== 'pending') return;
    
    const interval = setInterval(fetchTracking, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [status, fetchTracking]);

  const openLocationInMaps = () => {
    const loc = tracking?.currentLocation;
    const address = tracking?.pickupAddress;
    if (loc?.lat != null && loc?.lng != null) {
      window.open(`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}&zoom=16#map=16/${loc.lat}/${loc.lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-amber-400" />
          <p>Loading tracking...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center max-w-md">
          <Car className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tracking Ended</h2>
          <p className="text-gray-400">Your driver has completed the location sharing. Hope you had a great ride!</p>
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-sm text-gray-500">BookaRide NZ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Car className="w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold">Track Your Driver</h1>
            <p className="text-sm opacity-90">BookaRide NZ</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto">
        {/* Status Banner */}
        {status === 'pending' && (
          <div className="bg-amber-900/30 border border-amber-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
              <div>
                <p className="font-medium text-amber-300">Waiting for driver</p>
                <p className="text-sm text-amber-400/70">Your driver hasn't started sharing their location yet</p>
              </div>
            </div>
          </div>
        )}

        {status === 'active' && tracking?.currentLocation && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Car className="w-6 h-6 text-green-400" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-green-300">Driver is on the way!</p>
                  {tracking.etaMinutes && (
                    <p className="text-sm text-green-400/70">
                      Estimated arrival: ~{tracking.etaMinutes} min{tracking.etaMinutes !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
              {lastFetch && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <RefreshCw className="w-3 h-3" />
                  {lastFetch.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View location in maps (OpenStreetMap) */}
        {(tracking?.currentLocation || tracking?.pickupAddress) && (
          <div className="bg-gray-800 rounded-xl p-3 mb-4 border border-gray-700">
            <button
              type="button"
              onClick={openLocationInMaps}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg transition-colors"
            >
              <MapPin className="w-5 h-5" />
              View driver location on map
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Driver Info */}
        {tracking && (
          <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="font-medium text-white">{tracking.driverName || 'Your Driver'}</p>
                <p className="text-sm text-gray-400">BookaRide Driver</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2 p-2 bg-gray-700/50 rounded-lg">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs">Pickup Location</p>
                  <p className="text-white">{tracking.pickupAddress}</p>
                </div>
              </div>
              
              {tracking.dropoffAddress && (
                <div className="flex items-start gap-2 p-2 bg-gray-700/50 rounded-lg">
                  <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Drop-off Location</p>
                    <p className="text-white">{tracking.dropoffAddress}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ETA Card */}
        {status === 'active' && tracking?.etaMinutes && (
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl p-4 text-center">
            <p className="text-sm opacity-80">Estimated Time of Arrival</p>
            <p className="text-4xl font-bold">
              {tracking.etaMinutes} <span className="text-xl">min{tracking.etaMinutes !== 1 ? 's' : ''}</span>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-xs">BookaRide NZ • Premium Airport Transfers</p>
          <p className="text-gray-600 text-xs mt-1">bookaride.co.nz</p>
        </div>
      </div>
    </div>
  );
}
