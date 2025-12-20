import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  Car, 
  MapPin, 
  Clock, 
  Phone, 
  Loader2, 
  AlertCircle,
  Navigation,
  User
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL + '/api';
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const CustomerTracking = () => {
  const { trackingRef } = useParams();
  const [booking, setBooking] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);

  // Fetch tracking info
  const fetchTrackingInfo = async () => {
    try {
      const response = await axios.get(`${API}/tracking/info/${trackingRef}`);
      setBooking(response.data.booking);
      
      if (response.data.driverLocation) {
        setDriverLocation(response.data.driverLocation);
        setEta(response.data.eta);
      }
      setError(null);
    } catch (err) {
      if (!booking) {
        setError('Tracking information not found');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchTrackingInfo();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchTrackingInfo, 10000);
    return () => clearInterval(interval);
  }, [trackingRef]);

  // Initialize Google Map
  useEffect(() => {
    if (!booking || !window.google || mapInstanceRef.current) return;

    const pickupLocation = booking.pickupCoords || { lat: -36.8485, lng: 174.7633 }; // Default to Auckland

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: pickupLocation,
      zoom: 14,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });

    // Add pickup marker
    pickupMarkerRef.current = new window.google.maps.Marker({
      position: pickupLocation,
      map: mapInstanceRef.current,
      title: 'Pickup Location',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        scaledSize: new window.google.maps.Size(40, 40),
      },
    });

    // Initialize directions renderer
    directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#FBBF24',
        strokeWeight: 4,
      },
    });
  }, [booking]);

  // Update driver marker and route
  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation) return;

    const driverPos = { lat: driverLocation.latitude, lng: driverLocation.longitude };

    // Update or create driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setPosition(driverPos);
    } else {
      driverMarkerRef.current = new window.google.maps.Marker({
        position: driverPos,
        map: mapInstanceRef.current,
        title: 'Driver',
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
          scaledSize: new window.google.maps.Size(45, 45),
        },
      });
    }

    // Fit bounds to show both markers
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(driverPos);
    if (pickupMarkerRef.current) {
      bounds.extend(pickupMarkerRef.current.getPosition());
    }
    mapInstanceRef.current.fitBounds(bounds, 50);

    // Draw route
    if (booking?.pickupCoords) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: driverPos,
          destination: booking.pickupCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && directionsRendererRef.current) {
            directionsRendererRef.current.setDirections(result);
          }
        }
      );
    }
  }, [driverLocation, booking]);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) return;
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900/50 border border-red-500 rounded-xl p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Tracking Not Available</h1>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 p-4 text-black">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Car className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">Your Driver is On The Way!</h1>
              <p className="text-sm opacity-80">Live tracking • Book A Ride NZ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ETA Banner */}
      {eta && (
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Estimated Arrival</p>
                <p className="text-white text-2xl font-bold">{eta.minutes} min</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-sm">Distance</p>
              <p className="text-white font-medium">{eta.distance}</p>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 relative min-h-[300px]">
        <div ref={mapRef} className="absolute inset-0" />
        
        {!driverLocation && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
            <div className="text-center p-6">
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto mb-3" />
              <p className="text-white font-medium">Waiting for driver location...</p>
              <p className="text-gray-400 text-sm mt-1">Driver will start sharing when they begin the trip</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur rounded-lg p-3 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full" />
            <span className="text-white text-sm">Driver</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full" />
            <span className="text-white text-sm">Pickup</span>
          </div>
        </div>
      </div>

      {/* Booking Details */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="max-w-lg mx-auto">
          <h3 className="text-white font-medium mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-yellow-400" />
            Your Booking
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">Pickup Time</p>
              <p className="text-white font-medium">{booking?.time}</p>
            </div>
            <div>
              <p className="text-gray-400">Date</p>
              <p className="text-white font-medium">{booking?.date}</p>
            </div>
          </div>
          
          <div className="mt-3">
            <p className="text-gray-400 text-sm">Pickup Location</p>
            <p className="text-white text-sm mt-1 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              {booking?.pickupAddress}
            </p>
          </div>

          {booking?.driverName && (
            <div className="mt-4 p-3 bg-gray-700/50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{booking.driverName}</p>
                  <p className="text-gray-400 text-sm">Your Driver</p>
                </div>
              </div>
              {booking?.driverPhone && (
                <a 
                  href={`tel:${booking.driverPhone}`}
                  className="p-3 bg-green-500 rounded-full text-white hover:bg-green-400"
                >
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerTracking;
