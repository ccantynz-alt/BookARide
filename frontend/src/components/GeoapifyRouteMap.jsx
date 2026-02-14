/**
 * Route map using Geoapify (no Google Maps required).
 * Uses Leaflet + Geoapify tiles + Geoapify Routing API.
 * Set REACT_APP_GEOAPIFY_API_KEY in your environment.
 */
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, Route, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import 'leaflet/dist/leaflet.css';

const GEOAPIFY_KEY = process.env.REACT_APP_GEOAPIFY_API_KEY;

// Fix Leaflet default icon (broken with bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AUCKLAND_CENTER = [-36.8485, 174.7633];

async function geocodeAddress(address, apiKey) {
  if (!address?.trim() || !apiKey) return null;
  const res = await fetch(
    `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&apiKey=${apiKey}&limit=1&filter=countrycode:nz`
  );
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  const [lon, lat] = feat.geometry?.coordinates || [];
  return lat != null && lon != null ? [lat, lon] : null;
}

async function fetchRoute(waypoints, apiKey) {
  if (!waypoints?.length || waypoints.length < 2 || !apiKey) return null;
  const wp = waypoints.map(([lat, lon]) => `${lat},${lon}`).join('|');
  const url = `https://api.geoapify.com/v1/routing?waypoints=${wp}&mode=drive&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat) return null;
  const coords = feat.geometry?.coordinates;
  if (!coords?.length) return null;
  const routeCoords = coords.map(([lon, lat]) => [lat, lon]);
  const props = feat.properties || {};
  return {
    coords: routeCoords,
    distance: props.distance,
    time: props.time,
  };
}

function MapUpdater({ center, coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      try {
        const b = L.latLngBounds(coords);
        map.fitBounds(b, { padding: [30, 30], maxZoom: 14 });
      } catch {
        map.setView(center || AUCKLAND_CENTER, 12);
      }
    } else if (center) {
      map.setView(center, 12);
    }
  }, [map, center, coords]);
  return null;
}

const GeoapifyRouteMap = ({
  pickupAddress,
  pickupAddresses = [],
  dropoffAddress,
  pickupTime,
  pickupDate,
}) => {
  const [routeCoords, setRouteCoords] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const allPickups = [pickupAddress, ...(pickupAddresses || [])].filter((a) => a?.trim());
  const hasMultipleStops = allPickups.length > 1;

  useEffect(() => {
    if (!GEOAPIFY_KEY || !pickupAddress || !dropoffAddress) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const addresses = [...allPickups, dropoffAddress];
        const coords = [];
        for (const addr of addresses) {
          const c = await geocodeAddress(addr, GEOAPIFY_KEY);
          if (!c) {
            if (!cancelled) setError('Could not find address: ' + addr);
            return;
          }
          coords.push(c);
        }

        if (cancelled) return;

        const route = await fetchRoute(coords, GEOAPIFY_KEY);
        if (cancelled) return;

        if (route) {
          setRouteCoords(route.coords);
          setMarkers(coords);
          if (route.distance != null && route.time != null) {
            setRouteInfo({
              distance: (route.distance / 1000).toFixed(1),
              duration: Math.round(route.time / 60),
              stops: coords.length,
            });
          }
        } else {
          setError('Could not calculate route');
        }
      } catch (e) {
        if (!cancelled) setError('Failed to load route');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pickupAddress, dropoffAddress, allPickups.join('|')]);

  const getEstimatedArrival = () => {
    if (!pickupTime || !routeInfo?.duration) return null;
    try {
      const [h, m] = pickupTime.split(':').map(Number);
      const d = new Date();
      d.setHours(h, m + routeInfo.duration, 0, 0);
      return d.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return null;
    }
  };

  const estimatedArrival = getEstimatedArrival();

  const fitCoords = (routeCoords?.length ? routeCoords : markers) || [];

  if (!pickupAddress || !dropoffAddress) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-emerald-100/50 transition-colors"
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
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
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
            <div className="px-4 pb-4">
              {loading && (
                <div className="h-[250px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center">
                  <span className="text-gray-500">Loading map...</span>
                </div>
              )}

              {error && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-sm">
                  {error}
                </div>
              )}

              {!loading && !error && GEOAPIFY_KEY && (
                <div className="rounded-xl overflow-hidden shadow-inner border border-emerald-200" style={{ height: 250 }}>
                  <MapContainer
                    center={AUCKLAND_CENTER}
                    zoom={10}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url={`https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`}
                      attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a>'
                    />
                    <MapUpdater center={AUCKLAND_CENTER} coords={fitCoords} />
                    {routeCoords && (
                      <Polyline
                        positions={routeCoords}
                        pathOptions={{ color: '#059669', weight: 4, opacity: 0.8 }}
                      />
                    )}
                    {markers.map((pos, i) => (
                      <Marker key={i} position={pos}>
                        <Popup>
                          {i === 0 && 'Start: '}
                          {i > 0 && i < markers.length - 1 && `Stop ${i}: `}
                          {i === markers.length - 1 && 'End: '}
                          {(i < allPickups.length ? allPickups[i] : dropoffAddress) || `Point ${i + 1}`}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}

              {/* Stop list - use addresses not markers for display */}
              <div className="mt-3 space-y-2">
                {allPickups.map((addr, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                      {index + 1}
                    </div>
                    <MapPin className={`w-4 h-4 flex-shrink-0 ${index === 0 ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <span className="text-gray-700 truncate flex-1">{addr}</span>
                    {index === 0 && <span className="text-xs text-emerald-600 font-medium">Start</span>}
                    {index > 0 && <span className="text-xs text-amber-600 font-medium">+Stop</span>}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-600">
                    <Navigation className="w-3 h-3 text-white" />
                  </div>
                  <MapPin className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span className="text-gray-700 truncate flex-1">{dropoffAddress}</span>
                  <span className="text-xs text-red-600 font-medium">End</span>
                </div>
              </div>

              {hasMultipleStops && (
                <p className="text-xs text-emerald-700 mt-3 bg-emerald-100 p-2 rounded-lg text-center">
                  ✓ Route with {allPickups.length} pickup locations
                </p>
              )}

              {estimatedArrival && (
                <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">Estimated Arrival</p>
                        <p className="text-lg font-bold text-blue-800">{estimatedArrival}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Pickup at</p>
                      <p className="text-sm font-semibold text-gray-700">{pickupTime}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GeoapifyRouteMap;
