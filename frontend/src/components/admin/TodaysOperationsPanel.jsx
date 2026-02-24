import React, { useState, useEffect, useMemo } from 'react';
import { Phone, Mail, MapPin, Plane, Clock, User, ChevronRight, AlertCircle, CheckCircle2, Users, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Format time to 12-hour format
const formatTime12h = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Format date to readable format
const formatDateShort = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[parseInt(month) - 1]}`;
};

const TodaysOperationsPanel = ({ bookings = [], onViewBooking, onAssignDriver, onStatusUpdate }) => {
  const [viewMode, setViewMode] = useState('today'); // 'today', 'tomorrow', 'all'
  
  // Get today and tomorrow dates using LOCAL time, not UTC
  const getLocalDateString = (date) => {
    const d = date || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = getLocalDateString(new Date());
  const tomorrow = getLocalDateString(new Date(Date.now() + 86400000));

  // Process bookings to create unified pickup list (outbound + returns on their actual dates)
  const processedPickups = useMemo(() => {
    const pickups = [];
    
    bookings.forEach(booking => {
      if (booking.status === 'cancelled') return;
      
      // Add outbound trip
      pickups.push({
        ...booking,
        tripType: 'OUTBOUND',
        tripDate: booking.date,
        tripTime: booking.time,
        pickupLocation: booking.pickupAddress,
        dropoffLocation: booking.dropoffAddress,
        flightNumber: booking.flightNumber || booking.departureFlightNumber || booking.arrivalFlightNumber || '',
        sortKey: `${booking.date}_${booking.time || '00:00'}`
      });
      
      // Add return trip as separate entry IF return date exists
      if (booking.returnDate && booking.returnTime) {
        pickups.push({
          ...booking,
          tripType: 'RETURN',
          tripDate: booking.returnDate,
          tripTime: booking.returnTime,
          // For returns: pickup is the original dropoff, dropoff is original pickup
          pickupLocation: booking.dropoffAddress,
          dropoffLocation: booking.pickupAddress,
          flightNumber: booking.returnFlightNumber || booking.returnDepartureFlightNumber || '',
          sortKey: `${booking.returnDate}_${booking.returnTime || '00:00'}`,
          originalBookingDate: booking.date // Keep track of when originally booked
        });
      }
    });
    
    return pickups;
  }, [bookings]);

  // Filter and sort pickups based on view mode
  const filteredPickups = useMemo(() => {
    let filtered = processedPickups;
    
    if (viewMode === 'today') {
      filtered = processedPickups.filter(p => p.tripDate === today);
    } else if (viewMode === 'tomorrow') {
      filtered = processedPickups.filter(p => p.tripDate === tomorrow);
    } else {
      // Show today and tomorrow
      filtered = processedPickups.filter(p => p.tripDate === today || p.tripDate === tomorrow);
    }
    
    // Sort by time
    return filtered.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [processedPickups, viewMode, today, tomorrow]);

  // Count stats
  const todayCount = processedPickups.filter(p => p.tripDate === today).length;
  const tomorrowCount = processedPickups.filter(p => p.tripDate === tomorrow).length;
  const todayReturns = processedPickups.filter(p => p.tripDate === today && p.tripType === 'RETURN').length;
  const unassignedToday = processedPickups.filter(p => p.tripDate === today && !p.driver_id && !p.driver_name).length;

  const getDriverStatus = (pickup) => {
    if (pickup.driver_id || pickup.driver_name) {
      return pickup.driverAcknowledged ? 'confirmed' : 'pending';
    }
    return 'unassigned';
  };

  const getRowStyle = (pickup) => {
    const isToday = pickup.tripDate === today;
    const isUnassigned = !pickup.driver_id && !pickup.driver_name;
    const isReturn = pickup.tripType === 'RETURN';
    
    let baseStyle = 'border-b border-gray-100 hover:bg-gray-50 transition-colors';
    
    if (isToday && isUnassigned) {
      baseStyle += ' bg-red-50';
    } else if (isReturn) {
      baseStyle += ' bg-purple-50/30';
    } else if (isToday) {
      baseStyle += ' bg-blue-50/30';
    }
    
    return baseStyle;
  };

  return (
    <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-slate-900 text-white py-4 px-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium tracking-wide">TODAY'S OPERATIONS</CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              {todayCount} pickups today • {todayReturns} returns • {unassignedToday > 0 && <span className="text-red-400 font-semibold">{unassignedToday} unassigned</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'today' ? 'default' : 'outline'}
              onClick={() => setViewMode('today')}
              className={viewMode === 'today' ? 'bg-white text-slate-900' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
            >
              Today ({todayCount})
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'tomorrow' ? 'default' : 'outline'}
              onClick={() => setViewMode('tomorrow')}
              className={viewMode === 'tomorrow' ? 'bg-white text-slate-900' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
            >
              Tomorrow ({tomorrowCount})
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'all' ? 'default' : 'outline'}
              onClick={() => setViewMode('all')}
              className={viewMode === 'all' ? 'bg-white text-slate-900' : 'border-slate-600 text-slate-300 hover:bg-slate-800'}
            >
              Both
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Table Header */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 grid grid-cols-12 gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider">
          <div className="col-span-1">Time</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-3">Route</div>
          <div className="col-span-1">Flight</div>
          <div className="col-span-1">Pax</div>
          <div className="col-span-2">Driver</div>
          <div className="col-span-1">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {filteredPickups.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No pickups scheduled</p>
              <p className="text-sm">for {viewMode === 'today' ? 'today' : viewMode === 'tomorrow' ? 'tomorrow' : 'today or tomorrow'}</p>
            </div>
          ) : (
            filteredPickups.map((pickup, idx) => {
              const driverStatus = getDriverStatus(pickup);
              const isReturn = pickup.tripType === 'RETURN';
              
              return (
                <div 
                  key={`${pickup.id}-${pickup.tripType}-${idx}`}
                  className={getRowStyle(pickup)}
                >
                  <div className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                    {/* Time */}
                    <div className="col-span-1">
                      <div className="text-lg font-bold text-slate-900">{formatTime12h(pickup.tripTime)}</div>
                      {pickup.tripDate !== today && (
                        <div className="text-[10px] text-slate-500">{formatDateShort(pickup.tripDate)}</div>
                      )}
                    </div>

                    {/* Type Badge */}
                    <div className="col-span-1">
                      {isReturn ? (
                        <div className="flex items-center gap-1">
                          <ArrowLeft className="w-3 h-3 text-purple-600" />
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">RETURN</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-blue-600" />
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">OUT</span>
                        </div>
                      )}
                      <div className="text-[9px] text-slate-400 mt-0.5">#{pickup.referenceNumber || pickup.id?.slice(0,5)}</div>
                    </div>

                    {/* Customer */}
                    <div className="col-span-2">
                      <div className="font-semibold text-slate-900 text-sm truncate">{pickup.name}</div>
                      <a href={`tel:${pickup.phone}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {pickup.phone}
                      </a>
                    </div>

                    {/* Route */}
                    <div className="col-span-3 text-xs">
                      <div className="flex items-start gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700 truncate" title={pickup.pickupLocation}>
                          {pickup.pickupLocation?.slice(0, 40)}...
                        </span>
                      </div>
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-500 truncate" title={pickup.dropoffLocation}>
                          {pickup.dropoffLocation?.slice(0, 40)}...
                        </span>
                      </div>
                    </div>

                    {/* Flight */}
                    <div className="col-span-1">
                      {pickup.flightNumber ? (
                        <div className="flex items-center gap-1 bg-sky-100 px-2 py-1 rounded text-sky-700 text-xs font-semibold">
                          <Plane className="w-3 h-3" />
                          {pickup.flightNumber}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>

                    {/* Passengers */}
                    <div className="col-span-1">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Users className="w-3 h-3" />
                        <span className="font-medium">{pickup.passengers || 1}</span>
                      </div>
                    </div>

                    {/* Driver Status */}
                    <div className="col-span-2">
                      {driverStatus === 'confirmed' ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{pickup.driver_name?.split(' ')[0]}</div>
                            <div className="text-[10px] text-green-600">Confirmed</div>
                          </div>
                        </div>
                      ) : driverStatus === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-500" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{pickup.driver_name?.split(' ')[0]}</div>
                            <div className="text-[10px] text-amber-600">Awaiting Response</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <AlertCircle className={`w-4 h-4 ${pickup.tripDate === today ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                          <div>
                            <div className={`text-sm font-medium ${pickup.tripDate === today ? 'text-red-600' : 'text-slate-500'}`}>
                              {pickup.tripDate === today ? 'ASSIGN NOW' : 'Unassigned'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2 text-xs"
                        onClick={() => onViewBooking && onViewBooking(pickup)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{filteredPickups.length}</span> pickups
              {filteredPickups.filter(p => p.tripType === 'RETURN').length > 0 && (
                <span className="ml-2 text-purple-600">
                  ({filteredPickups.filter(p => p.tripType === 'RETURN').length} returns)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              Returns appear on their pickup date, not original booking date
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodaysOperationsPanel;
