import React from 'react';
import { ChevronRight, Home, BookOpen, BarChart3, Users, Car, FileText, Globe, Activity } from 'lucide-react';

const tabConfig = {
  bookings: { label: 'Bookings', icon: BookOpen },
  analytics: { label: 'Analytics', icon: BarChart3 },
  customers: { label: 'Customers', icon: Users },
  drivers: { label: 'Drivers', icon: Car },
  applications: { label: 'Driver Applications', icon: FileText },
  marketing: { label: 'Marketing', icon: Globe },
  cockpit: { label: 'Cockpit', icon: Activity },
};

export const AdminBreadcrumb = ({ activeTab, selectedBooking, showDetailsModal, showEditBookingModal }) => {
  const currentTab = tabConfig[activeTab] || { label: 'Dashboard', icon: Home };
  const TabIcon = currentTab.icon;

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 bg-gold px-4 py-3 rounded-lg">
      <a href="/admin" className="flex items-center text-white hover:text-white/80 transition-colors">
        <Home className="w-4 h-4 text-white" />
        <span className="ml-1 text-white">Admin</span>
      </a>
      
      <ChevronRight className="w-4 h-4 text-white/70" />
      
      <span className="flex items-center text-white font-medium">
        <TabIcon className="w-4 h-4 mr-1 text-white" />
        <span className="text-white">{currentTab.label}</span>
      </span>

      {/* Show booking context if viewing/editing a booking */}
      {activeTab === 'bookings' && selectedBooking && (showDetailsModal || showEditBookingModal) && (
        <>
          <ChevronRight className="w-4 h-4 text-white/70" />
          <span className="text-white">
            {showEditBookingModal ? 'Edit' : 'View'} Booking #{selectedBooking.booking_ref || selectedBooking.id?.slice(-6)}
          </span>
        </>
      )}
    </nav>
  );
};

export default AdminBreadcrumb;
