import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader2, Phone, User, Play, Square, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function DriverTracking() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, pending, active, completed, error
  const [error, setError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const watchIdRef = useRef(null);

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tracking/driver/${sessionId}`);
        if (response.status === 404) {
          setError('Tracking session not found. The link may have expired or is invalid.');
          setStatus('error');
          return;
        }
        if (response.status === 410) {
          setStatus('completed');
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to load session');
        }
        const data = await response.json();
        setSession(data);
        setStatus(data.status || 'pending');
      } catch (err) {
        setError(err.message);
        setStatus('error');
      }
    };

    fetchSession();
  }, [sessionId]);

  // Send location to server
  const sendLocation = useCallback(async (position) => {
    if (!sessionId || status !== 'active') return;

    try {
      await fetch(`${API_URL}/api/tracking/driver/${sessionId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy
        })
      });
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to send location:', err);
    }
  }, [sessionId, status]);

  // Start location tracking
  const startTracking = async () => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocationError('Location services not available on this device');
      toast.error('GPS not supported on this device');
      return;
    }

    // Start the session on the server
    try {
      const response = await fetch(`${API_URL}/api/tracking/driver/${sessionId}/start`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to start tracking');
      }
      
      setStatus('active');
      toast.success('📍 Location sharing started! Customer has been notified.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        setLocationError(null);
        sendLocation(position);
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError('Please allow location access to share your location');
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable');
            break;
          case err.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Unable to get location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );
  };

  // Stop tracking
  const stopTracking = async () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    try {
      await fetch(`${API_URL}/api/tracking/driver/${sessionId}/stop`, {
        method: 'POST'
      });
      toast.success('Location sharing stopped');
    } catch (err) {
      console.error('Failed to stop tracking:', err);
    }

    setStatus('completed');
  };

  // Open navigation to pickup address (OpenStreetMap)
  const openNavigation = () => {
    if (session?.pickupAddress) {
      window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(session.pickupAddress)}`, '_blank');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-amber-400" />
          <p>Loading tracking session...</p>
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
        <div className="bg-green-900/50 border border-green-500 rounded-xl p-6 text-center max-w-md">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Tracking Complete</h2>
          <p className="text-green-200">Location sharing has ended. Drive safe!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <MapPin className="w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold">BookaRide Driver</h1>
            <p className="text-sm opacity-90">Live Location Sharing</p>
          </div>
        </div>
        
        {status === 'active' && (
          <div className="flex items-center gap-2 mt-3 bg-black/20 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Location sharing active</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 max-w-lg mx-auto">
        {/* Job Info */}
        {session && (
          <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-400" />
              Job Details
            </h2>
            <div className="space-y-3 text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium text-white">{session.customerName}</span>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Pickup Address:</span>
                <p className="text-white text-sm bg-gray-700/50 rounded-lg p-3">
                  <MapPin className="w-4 h-4 inline mr-1 text-amber-400" />
                  {session.pickupAddress}
                </p>
              </div>
              <div>
                <span className="text-gray-500 block mb-1">Drop-off:</span>
                <p className="text-white text-sm">{session.dropoffAddress}</p>
              </div>
            </div>
            
            {/* Navigation Button */}
            <button
              onClick={openNavigation}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Navigation className="w-5 h-5" />
              Open in Google Maps
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Location Error */}
        {locationError && (
          <div className="bg-red-900/50 border border-red-500 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{locationError}</p>
            </div>
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && status === 'active' && (
          <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                <span className="font-medium">Sharing Location</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-mono">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
            {lastUpdate && (
              <p className="text-xs text-gray-500 mt-1">
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
            {currentLocation.accuracy && (
              <p className="text-xs text-gray-500">
                Accuracy: ±{Math.round(currentLocation.accuracy)}m
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        {status === 'pending' && (
          <button
            onClick={startTracking}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <Play className="w-6 h-6" />
            Start Sharing My Location
          </button>
        )}

        {status === 'active' && (
          <button
            onClick={stopTracking}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <Square className="w-6 h-6" />
            Stop Sharing Location
          </button>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-white font-medium mb-2">How it works:</h3>
          <ul className="text-gray-400 text-sm space-y-2">
            {status === 'pending' ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">1.</span>
                  Tap "Start Sharing My Location" when you're ready to drive
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">2.</span>
                  Customer will automatically receive a tracking link via SMS
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">3.</span>
                  They'll see your live location on a map
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">4.</span>
                  Tap "Stop" when you've arrived and picked them up
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  Customer has been notified with tracking link
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  Keep this page open while driving
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  Your location updates automatically every few seconds
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  Tap "Stop Sharing" when pickup is complete
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-700 text-center">
          <p className="text-gray-500 text-xs">BookaRide NZ • Driver Tracking</p>
        </div>
      </div>
    </div>
  );
}
