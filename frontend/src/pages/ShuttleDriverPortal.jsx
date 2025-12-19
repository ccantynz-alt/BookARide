import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Bus,
  MapPin,
  Navigation,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Phone,
  Play,
  Square,
  Send,
  Loader2,
  MapPinned,
  Route,
  Zap
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

// Craig Canty's driver ID (testing phase)
const ALLOWED_DRIVER_ID = '5a78ccb4-a2cb-4bcb-80a7-eb6a4364cee8';

const ShuttleDriverPortal = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shuttleData, setShuttleData] = useState(null);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [notifiedPickups, setNotifiedPickups] = useState(new Set());
  const [pickupETAs, setPickupETAs] = useState({});
  
  const watchIdRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  // Check if driver is logged in
  useEffect(() => {
    const token = localStorage.getItem('driverToken');
    const driverId = localStorage.getItem('driverId');
    const driverName = localStorage.getItem('driverName');
    
    if (token && driverId) {
      // Only allow Craig Canty during testing
      if (driverId === ALLOWED_DRIVER_ID) {
        setDriver({ id: driverId, name: driverName, token });
        setIsAuthenticated(true);
        fetchTodaysShuttles();
      } else {
        toast.error('Shuttle tracking is only available for authorized drivers during testing');
        setIsAuthenticated(false);
      }
    }
  }, []);

  const fetchTodaysShuttles = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const token = localStorage.getItem('driverToken');
      const response = await axios.get(`${API}/shuttle/driver/departures?date=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShuttleData(response.data);
    } catch (error) {
      console.error('Error fetching shuttles:', error);
      // If unauthorized, try fetching without auth (public endpoint might exist)
    }
  };

  // Start GPS tracking
  const startTracking = useCallback((departure) => {
    if (!navigator.geolocation) {
      toast.error('GPS not supported on this device');
      return;
    }

    setSelectedDeparture(departure);
    setIsTracking(true);
    setNotifiedPickups(new Set());
    toast.success('GPS tracking started! Customers will be notified automatically.');

    // Watch position continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude, accuracy });
        setLocationError(null);
        
        // Send location to server
        updateDriverLocation(latitude, longitude, departure);
      },
      (error) => {
        console.error('GPS Error:', error);
        setLocationError(error.message);
        toast.error(`GPS Error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    // Also poll every 30 seconds as backup
    trackingIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateDriverLocation(latitude, longitude, departure);
        },
        (error) => console.error('Backup GPS error:', error),
        { enableHighAccuracy: true }
      );
    }, 30000);
  }, []);

  // Update driver location on server and check ETAs
  const updateDriverLocation = async (lat, lng, departure) => {
    try {
      const token = localStorage.getItem('driverToken');
      const response = await axios.post(`${API}/shuttle/driver/location`, {
        driverId: driver.id,
        latitude: lat,
        longitude: lng,
        date: departure.date || format(new Date(), 'yyyy-MM-dd'),
        departureTime: departure.time,
        notifiedPickups: Array.from(notifiedPickups)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.etas) {
        setPickupETAs(response.data.etas);
      }

      // Track which pickups have been notified
      if (response.data.newlyNotified && response.data.newlyNotified.length > 0) {
        setNotifiedPickups(prev => {
          const updated = new Set(prev);
          response.data.newlyNotified.forEach(id => updated.add(id));
          return updated;
        });
        toast.success(`📱 "Arriving soon" SMS sent to ${response.data.newlyNotified.length} customer(s)!`);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
    setIsTracking(false);
    setSelectedDeparture(null);
    setCurrentLocation(null);
    setPickupETAs({});
    toast.info('GPS tracking stopped');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, []);

  // Login form for driver
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const response = await axios.post(`${API}/driver/login`, {
        phone: loginPhone,
        password: loginPassword
      });
      
      if (response.data.driver_id === ALLOWED_DRIVER_ID) {
        localStorage.setItem('driverToken', response.data.token);
        localStorage.setItem('driverId', response.data.driver_id);
        localStorage.setItem('driverName', response.data.name);
        setDriver({ id: response.data.driver_id, name: response.data.name, token: response.data.token });
        setIsAuthenticated(true);
        fetchTodaysShuttles();
        toast.success(`Welcome ${response.data.name}!`);
      } else {
        toast.error('Shuttle tracking is only available for Craig Canty during testing phase');
      }
    } catch (error) {
      toast.error('Invalid credentials');
    } finally {
      setLoggingIn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <Helmet>
          <title>Driver Shuttle Portal | Book A Ride</title>
        </Helmet>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-2xl p-8 w-full max-w-md border border-gray-700"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bus className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Shuttle Driver Portal</h1>
            <p className="text-gray-400 mt-2">GPS tracking for shared shuttles</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
              <input
                type="tel"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value)}
                placeholder="+64 21 339 030"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg flex items-center justify-center gap-2"
            >
              {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" />}
              {loggingIn ? 'Logging in...' : 'Login to Start Tracking'}
            </button>
          </form>
          
          <p className="text-center text-gray-500 text-sm mt-6">
            Testing phase: Only authorized drivers can access this portal
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <Helmet>
        <title>Shuttle Tracking | {driver?.name}</title>
      </Helmet>
      
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Bus className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{driver?.name}</h1>
                <p className="text-gray-400 text-sm">Shuttle Driver Portal</p>
              </div>
            </div>
            {isTracking && (
              <div className="flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">GPS Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Current Location */}
        {currentLocation && (
          <div className="bg-blue-900/30 rounded-xl p-4 mb-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <MapPinned className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-blue-300 text-sm">Current Location</p>
                <p className="text-white font-mono text-sm">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                <p className="text-blue-400/60 text-xs">Accuracy: ±{Math.round(currentLocation.accuracy)}m</p>
              </div>
            </div>
          </div>
        )}

        {locationError && (
          <div className="bg-red-900/30 rounded-xl p-4 mb-6 border border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-300">{locationError}</p>
            </div>
          </div>
        )}

        {/* Active Tracking View */}
        {isTracking && selectedDeparture && (
          <div className="bg-gray-800 rounded-2xl p-6 mb-6 border border-yellow-500/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Route className="w-5 h-5 text-yellow-400" />
                  {selectedDeparture.time} Shuttle
                </h2>
                <p className="text-gray-400 text-sm">{selectedDeparture.bookings?.length || 0} pickups</p>
              </div>
              <button
                onClick={stopTracking}
                className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2 hover:bg-red-500/30"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </div>

            {/* Pickup List with ETAs */}
            <div className="space-y-3">
              {selectedDeparture.bookings?.map((booking, idx) => {
                const eta = pickupETAs[booking.id];
                const isNotified = notifiedPickups.has(booking.id);
                const isNearby = eta && eta.minutes <= 5;
                
                return (
                  <div
                    key={booking.id}
                    className={`p-4 rounded-xl border ${
                      isNotified ? 'bg-green-900/30 border-green-500/50' :
                      isNearby ? 'bg-yellow-900/30 border-yellow-500/50 animate-pulse' :
                      'bg-gray-700/50 border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">#{idx + 1}</span>
                          <span className="text-white font-medium">{booking.name}</span>
                          <span className="text-gray-400">({booking.passengers} pax)</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.pickupAddress}
                        </p>
                        <a href={`tel:${booking.phone}`} className="text-blue-400 text-sm flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {booking.phone}
                        </a>
                      </div>
                      <div className="text-right">
                        {eta ? (
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isNotified ? 'bg-green-500/20 text-green-400' :
                            isNearby ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-600 text-gray-300'
                          }`}>
                            {isNotified ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4" /> Notified
                              </span>
                            ) : (
                              <span>{eta.minutes} min</span>
                            )}
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-gray-600 rounded-full text-gray-400 text-sm">
                            Calculating...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Shuttles */}
        {!isTracking && (
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Today's Shuttles
            </h2>
            
            {shuttleData?.departures ? (
              <div className="space-y-3">
                {Object.entries(shuttleData.departures)
                  .filter(([_, data]) => data.totalPassengers > 0)
                  .map(([time, data]) => (
                    <div
                      key={time}
                      className="p-4 bg-gray-700/50 rounded-xl border border-gray-600"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-bold text-lg">{time.replace(/(\d{2}):(\d{2})/, (m, h, min) => {
                            const hour = parseInt(h);
                            const ampm = hour >= 12 ? 'PM' : 'AM';
                            const hour12 = hour % 12 || 12;
                            return `${hour12}:${min} ${ampm}`;
                          })}</p>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {data.totalPassengers} passengers • {data.bookings?.length || 0} pickups
                          </p>
                        </div>
                        <button
                          onClick={() => startTracking({ time, ...data, date: format(new Date(), 'yyyy-MM-dd') })}
                          className="px-4 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl flex items-center gap-2"
                        >
                          <Play className="w-5 h-5" />
                          Start Route
                        </button>
                      </div>
                    </div>
                  ))}
                
                {Object.values(shuttleData.departures).every(d => d.totalPassengers === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <Bus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No shuttle bookings for today</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-yellow-400" />
                <p className="text-gray-400 mt-2">Loading shuttles...</p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            How it works
          </h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Tap "Start Route" when you begin your shuttle run</li>
            <li>• Your GPS location is tracked automatically</li>
            <li>• Customers get an SMS when you're ~5 mins away</li>
            <li>• Keep this page open while driving</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ShuttleDriverPortal;
