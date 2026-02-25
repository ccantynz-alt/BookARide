import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Car, Phone, MapPin, RefreshCw, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import axios from 'axios';

import { API } from '../../config/api';

const UrgentReturnsPanel = () => {
  const [urgentReturns, setUrgentReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [baseAddress, setBaseAddress] = useState('');

  const fetchUrgentReturns = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/urgent-returns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUrgentReturns(response.data.urgent_returns || []);
      setBaseAddress(response.data.base_address || '');
      setLastChecked(new Date().toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }));
    } catch (error) {
      console.error('Error fetching urgent returns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrgentReturns();
    // Refresh every 5 minutes
    const interval = setInterval(fetchUrgentReturns, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getUrgencyStyle = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'orange':
        return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'yellow':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-green-100 border-green-500 text-green-800';
    }
  };

  const getUrgencyBadge = (urgency, color) => {
    const styles = {
      red: 'bg-red-600 text-white animate-pulse',
      orange: 'bg-orange-500 text-white',
      yellow: 'bg-yellow-500 text-black',
      green: 'bg-green-500 text-white'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-bold ${styles[color] || styles.green}`}>
        {urgency}
      </span>
    );
  };

  const openInMaps = (address) => {
    window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`, '_blank');
  };

  const callCustomer = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  // Don't show if no returns
  if (urgentReturns.length === 0) {
    return null;
  }

  // Filter to show only urgent ones (leaving within 4 hours)
  const showReturns = urgentReturns.filter(r => r.minutes_until_leave <= 240);
  
  if (showReturns.length === 0) {
    return null;
  }

  return (
    <Card className="mb-4 border-2 border-amber-400 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5" />
            RETURN TRIPS - DEPARTURE MONITOR
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-80">
              Base: Mount Roskill | Updated: {lastChecked}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={fetchUrgentReturns}
              disabled={loading}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <div className="space-y-2">
          {showReturns.map((returnBooking) => (
            <div 
              key={returnBooking.booking_id}
              className={`p-3 rounded-lg border-l-4 ${getUrgencyStyle(returnBooking.urgency_color)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getUrgencyBadge(returnBooking.urgency, returnBooking.urgency_color)}
                    <span className="font-bold">#{returnBooking.booking_ref}</span>
                    <span className="font-semibold">{returnBooking.customer_name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Pickup: <strong>{returnBooking.return_time_formatted}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      <span>Drive: <strong>{returnBooking.drive_minutes} mins</strong></span>
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate" title={returnBooking.pickup_address}>
                        {returnBooking.pickup_address?.substring(0, 50)}...
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                    {returnBooking.minutes_until_leave <= 0 ? (
                      <span className="text-red-600 animate-pulse">⚠️ SHOULD HAVE LEFT ALREADY!</span>
                    ) : returnBooking.minutes_until_leave <= 60 ? (
                      <span className="text-red-600">🚨 Leave by {returnBooking.leave_by} ({returnBooking.minutes_until_leave} mins)</span>
                    ) : (
                      <span>Leave by {returnBooking.leave_by} ({Math.floor(returnBooking.minutes_until_leave / 60)}h {returnBooking.minutes_until_leave % 60}m)</span>
                    )}
                    
                    {returnBooking.driver_assigned ? (
                      <span className="text-green-600">✓ Driver: {returnBooking.driver_name}</span>
                    ) : (
                      <span className="text-red-600 font-bold">⚠️ NO DRIVER ASSIGNED</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 ml-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => openInMaps(returnBooking.pickup_address)}
                    className="text-xs"
                  >
                    <Navigation className="h-3 w-3 mr-1" />
                    Navigate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => callCustomer(returnBooking.customer_phone)}
                    className="text-xs"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UrgentReturnsPanel;
