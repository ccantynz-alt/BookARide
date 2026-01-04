import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useLoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { MapPin, Navigation, Route, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const libraries = ['places', 'directions'];

const mapContainerStyle = {
  width: '100%',
  height: '250px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: -36.8485,
  lng: 174.7633 // Auckland, NZ
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

const MultiStopRouteMap = ({ 
  pickupAddress, 
  pickupAddresses = [], 
  dropoffAddress,
  pickupTime,
  pickupDate
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [directions, setDirections] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [routeInfo, setRouteInfo] = useState(null);
  const mapRef = useRef(null);

  // Calculate estimated arrival time
  const getEstimatedArrival = () => {
    if (!pickupTime || !routeInfo?.duration) return null;
    
    try {
      const [hours, minutes] = pickupTime.split(':').map(Number);
      const arrivalDate = new Date();
      arrivalDate.setHours(hours, minutes + routeInfo.duration, 0, 0);
      
      return arrivalDate.toLocaleTimeString('en-NZ', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      return null;
    }
  };

  const estimatedArrival = getEstimatedArrival();

  // Create a stable string representation of pickupAddresses for dependency
  const pickupAddressesKey = pickupAddresses.filter(addr => addr && addr.trim()).join('|');

  // Get all valid addresses
  const allPickups = [pickupAddress, ...pickupAddresses].filter(addr => addr && addr.trim());
  const hasMultipleStops = allPickups.length > 1;

  useEffect(() => {
    // Early return without setState - handled by initial state
    if (!isLoaded || !pickupAddress || !dropoffAddress) {
      return;
    }

    const directionsService = new window.google.maps.DirectionsService();

    // Build waypoints from additional pickup addresses
    const validPickupAddresses = pickupAddresses.filter(addr => addr && addr.trim());
    const waypoints = validPickupAddresses.map(addr => ({
      location: addr,
      stopover: true
    }));

    const request = {
      origin: pickupAddress,
      destination: dropoffAddress,
      waypoints: waypoints,
      optimizeWaypoints: false, // Keep order as entered
      travelMode: window.google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        setDirections(result);
        
        // Calculate total distance and duration
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;
        
        route.legs.forEach(leg => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        const stopCount = 1 + validPickupAddresses.length + 1; // first pickup + additional + dropoff
        const info = {
          distance: (totalDistance / 1000).toFixed(1),
          duration: Math.round(totalDuration / 60),
          stops: stopCount
        };
        
        setRouteInfo(info);
      } else {
        console.error('Directions request failed:', status);
        setDirections(null);
        setRouteInfo(null);
      }
    });

    // Reset when addresses change
    return () => {
      setDirections(null);
      setRouteInfo(null);
    };
  }, [isLoaded, pickupAddress, pickupAddressesKey, dropoffAddress, pickupAddresses]);

  if (loadError) {
    return (
      <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-red-600 text-sm">
        Error loading map. Please refresh the page.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-pulse">
        <div className="h-[250px] bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!pickupAddress || !dropoffAddress) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-emerald-100/50 transition-colors"
        data-testid="route-map-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
            <Route className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-gray-800">Route Preview</span>
            {hasMultipleStops && (
              <span className="ml-2 text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                {allPickups.length} pickups
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {routeInfo && (
            <div className="text-right text-sm">
              <span className="font-bold text-emerald-700">{routeInfo.distance} km</span>
              <span className="text-gray-500 mx-1">•</span>
              <span className="text-gray-600">~{routeInfo.duration} min</span>
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Map */}
            <div className="px-4 pb-4">
              <div className="rounded-xl overflow-hidden shadow-inner border border-emerald-200">
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={defaultCenter}
                  zoom={10}
                  options={mapOptions}
                  onLoad={map => { mapRef.current = map; }}
                >
                  {directions && (
                    <DirectionsRenderer
                      directions={directions}
                      options={{
                        suppressMarkers: true,
                        polylineOptions: {
                          strokeColor: '#059669',
                          strokeWeight: 4,
                          strokeOpacity: 0.8
                        }
                      }}
                    />
                  )}

                  {/* Custom markers for each stop */}
                  {directions && directions.routes[0].legs.map((leg, index) => (
                    <React.Fragment key={index}>
                      {/* Start of leg */}
                      <Marker
                        position={leg.start_location}
                        icon={{
                          path: window.google.maps.SymbolPath.CIRCLE,
                          scale: index === 0 ? 12 : 10,
                          fillColor: index === 0 ? '#059669' : '#f59e0b',
                          fillOpacity: 1,
                          strokeColor: '#ffffff',
                          strokeWeight: 3
                        }}
                        label={{
                          text: (index + 1).toString(),
                          color: '#ffffff',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                      />
                    </React.Fragment>
                  ))}

                  {/* Final destination marker */}
                  {directions && (
                    <Marker
                      position={directions.routes[0].legs[directions.routes[0].legs.length - 1].end_location}
                      icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: '#dc2626',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3
                      }}
                    />
                  )}
                </GoogleMap>
              </div>

              {/* Stop List */}
              <div className="mt-3 space-y-2">
                {allPickups.map((addr, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm" data-testid={`route-stop-${index + 1}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-emerald-600' : 'bg-amber-500'
                    }`}>
                      {index + 1}
                    </div>
                    <MapPin className={`w-4 h-4 ${index === 0 ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span className="text-gray-700 truncate flex-1">{addr}</span>
                    {index === 0 && (
                      <span className="text-xs text-emerald-600 font-medium">Start</span>
                    )}
                    {index > 0 && (
                      <span className="text-xs text-amber-600 font-medium">+Stop</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm" data-testid="route-destination">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-600">
                    <Navigation className="w-3 h-3 text-white" />
                  </div>
                  <Navigation className="w-4 h-4 text-red-600" />
                  <span className="text-gray-700 truncate flex-1">{dropoffAddress}</span>
                  <span className="text-xs text-red-600 font-medium">End</span>
                </div>
              </div>

              {hasMultipleStops && (
                <p className="text-xs text-emerald-700 mt-3 bg-emerald-100 p-2 rounded-lg text-center">
                  ✓ Route optimized for {allPickups.length} pickup locations
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MultiStopRouteMap;
