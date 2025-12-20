import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Car,
  User,
  Play,
  Square
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const DriverTracking = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [customerNotified, setCustomerNotified] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axios.get(`${API}/tracking/booking/${bookingId}`);
        setBooking(response.data);
        setCustomerNotified(response.data.customerNotified5Min || false);
      } catch (err) {
        setError('Booking not found or access denied');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Start GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }

    setIsTracking(true);
    toast.success('Location sharing started!');

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        setLocationError(null);
      },
      (error) => {
        console.error('GPS Error:', error);
        setLocationError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    );

    // Send updates to server every 10 seconds
    updateIntervalRef.current = setInterval(() => {
      if (currentLocation) {
        sendLocationUpdate(currentLocation.lat, currentLocation.lng);
      }
    }, 10000);

    // Initial update
    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendLocationUpdate(position.coords.latitude, position.coords.longitude);
      },
      (err) => console.error('Initial position error:', err),
      { enableHighAccuracy: true }
    );
  }, [currentLocation]);

  // Send location to server
  const sendLocationUpdate = async (lat, lng) => {
    try {
      const response = await axios.post(`${API}/tracking/update-location`, {
        bookingId,
        latitude: lat,
        longitude: lng
      });
      
      setLastUpdate(new Date());
      
      // Check if customer was just notified (5 min away)
      if (response.data.customerNotified && !customerNotified) {
        setCustomerNotified(true);
        toast.success('📱 Customer notified - 5 minutes away!');
      }
    } catch (err) {
      console.error('Error sending location:', err);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    setIsTracking(false);
    toast.info('Location sharing stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      if (updateIntervalRef.current) clearInterval(updateIntervalRef.current);
    };
  }, []);

  // Open Google Maps navigation
  const openNavigation = () => {
    if (booking?.pickupAddress) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.pickupAddress)}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Error</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-2xl p-6 mb-6 text-black">
          <div className="flex items-center gap-3 mb-4">
            <Car className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Driver Tracking</h1>
              <p className="text-sm opacity-80">Share your location with customer</p>
            </div>
          </div>
          
          {isTracking && (
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Location sharing active</span>
            </div>
          )}
        </div>

        {/* Booking Details */}
        <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-400" />
            Customer Details
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span className="text-white font-medium">{booking?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Phone</span>
              <a href={`tel:${booking?.phone}`} className="text-blue-400 font-medium flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {booking?.phone}
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Pickup Time</span>
              <span className="text-white font-medium">{booking?.time}</span>
            </div>
            <div>
              <span className="text-gray-400 block mb-1">Pickup Address</span>
              <p className="text-white text-sm bg-gray-700/50 rounded-lg p-3">
                <MapPin className="w-4 h-4 inline mr-1 text-yellow-400" />
                {booking?.pickupAddress}
              </p>
            </div>
          </div>
          
          <button
            onClick={openNavigation}
            className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <Navigation className="w-5 h-5" />
            Open in Google Maps
          </button>
        </div>

        {/* Current Location */}
        {currentLocation && (
          <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <MapPin className="w-4 h-4 text-green-400" />
              <span className="text-sm">Your Current Location</span>
            </div>
            <p className="text-white font-mono text-sm">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
            {lastUpdate && (
              <p className="text-gray-500 text-xs mt-1">
                Last update: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
            {locationError && (
              <p className="text-red-400 text-xs mt-1">{locationError}</p>
            )}
          </div>
        )}

        {/* Customer Notification Status */}
        {customerNotified && (
          <div className="bg-green-900/50 border border-green-500 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-300 font-medium">Customer Notified!</p>
              <p className="text-green-400/70 text-sm">They received "5 mins away" SMS with live tracking link</p>
            </div>
          </div>
        )}

        {/* Start/Stop Button */}
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg"
          >
            <Play className="w-6 h-6" />
            Start Sharing Location
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="w-full py-4 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl flex items-center justify-center gap-3 text-lg"
          >
            <Square className="w-6 h-6" />
            Stop Sharing
          </button>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-white font-medium mb-2">How it works:</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Tap "Start Sharing Location" when you begin driving</li>
            <li>• Customer will see your live location on a map</li>
            <li>• When ~5 mins away, customer gets automatic SMS</li>
            <li>• Keep this page open while driving</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DriverTracking;
