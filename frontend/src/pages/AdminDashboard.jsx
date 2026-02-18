import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Filter, Mail, DollarSign, CheckCircle, XCircle, Clock, Eye, Edit2, BarChart3, Users, BookOpen, Car, Settings, Trash2, MapPin, Calendar, RefreshCw, Send, Bell, Facebook, Globe, Square, CheckSquare, FileText, Smartphone, RotateCcw, AlertTriangle, AlertCircle, Home, Bus, ExternalLink, Navigation, Upload, Archive } from 'lucide-react';
import GeoapifyAutocomplete from '../components/GeoapifyAutocomplete';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { CustomDatePicker, CustomTimePicker } from '../components/DateTimePicker';
import axios from 'axios';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { DriversTab } from '../components/admin/DriversTab';
import { DriverApplicationsTab } from '../components/admin/DriverApplicationsTab';
import { LandingPagesTab } from '../components/admin/LandingPagesTab';
import { AdminBreadcrumb } from '../components/admin/AdminBreadcrumb';
import UrgentReturnsPanel from '../components/admin/UrgentReturnsPanel';
import DashboardStatsPanel from '../components/admin/DashboardStatsPanel';
import TodaysOperationsPanel from '../components/admin/TodaysOperationsPanel';
import ProfessionalStatsBar from '../components/admin/ProfessionalStatsBar';
import UrgentNotificationsCenter from '../components/admin/UrgentNotificationsCenter';
import ConfirmationStatusPanel from '../components/admin/ConfirmationStatusPanel';
import ReturnsOverviewPanel from '../components/admin/ReturnsOverviewPanel';
import { API } from '../config/api';

// Helper function to format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// Helper function to get day of week from date string
const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to get short day of week
const getShortDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Helper function to check if date is today
const isToday = (dateString) => {
  if (!dateString) return false;
  const today = new Date();
  const bookingDate = new Date(dateString);
  return (
    today.getFullYear() === bookingDate.getFullYear() &&
    today.getMonth() === bookingDate.getMonth() &&
    today.getDate() === bookingDate.getDate()
  );
};

// Helper function to check if date is tomorrow
const isTomorrow = (dateString) => {
  if (!dateString) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookingDate = new Date(dateString);
  return (
    tomorrow.getFullYear() === bookingDate.getFullYear() &&
    tomorrow.getMonth() === bookingDate.getMonth() &&
    tomorrow.getDate() === bookingDate.getDate()
  );
};

// Import Bookings Section Component
const ImportBookingsSection = ({ onSuccess }) => {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [calendarSyncing, setCalendarSyncing] = useState(false);
  const [calendarSyncResult, setCalendarSyncResult] = useState(null);
  const [calendarSyncStatus, setCalendarSyncStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch import status on mount
  useEffect(() => {
    const fetchImportStatus = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${API}/admin/import-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setImportStatus(response.data);
      } catch (error) {
        console.error('Error fetching import status:', error);
      }
    };
    fetchImportStatus();
  }, [importResult]);

  // Fetch calendar sync status on mount
  useEffect(() => {
    const fetchCalendarSyncStatus = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${API}/admin/batch-sync-calendar/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCalendarSyncStatus(response.data);
      } catch (error) {
        console.error('Error fetching calendar sync status:', error);
      }
    };
    fetchCalendarSyncStatus();
  }, [calendarSyncResult]);

  // Batch sync all imported bookings to Google Calendar
  const handleBatchCalendarSync = async () => {
    setCalendarSyncing(true);
    setCalendarSyncResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(`${API}/admin/batch-sync-calendar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCalendarSyncResult(response.data);
      if (response.data.success) {
        toast.success(response.data.message);
      }
    } catch (error) {
      console.error('Calendar sync error:', error);
      setCalendarSyncResult({
        success: false,
        error: error.response?.data?.detail || 'Calendar sync failed'
      });
      toast.error('Failed to start calendar sync');
    } finally {
      setCalendarSyncing(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
      setImportResult(null);
    } else {
      toast.error('Please select a CSV file');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('skip_notifications', 'true');

      const response = await axios.post(`${API}/admin/import-bookings`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResult(response.data);
      if (response.data.imported > 0) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Import error:', error);
      // Check if it's an authentication error
      if (error.response?.status === 401 || error.response?.status === 403) {
        setImportResult({
          success: false,
          error: 'Session expired. Please log out and log back in, then try again.'
        });
        toast.error('Session expired - please log in again');
      } else {
        setImportResult({
          success: false,
          error: error.response?.data?.detail || 'Import failed. Please try again.'
        });
      }
    } finally {
      setImporting(false);
    }
  };

  // One-click import - reads file and sends content
  const handleQuickImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first');
      return;
    }
    
    setImporting(true);
    setImportResult(null);

    try {
      // Read the file content
      const csvContent = await selectedFile.text();
      
      const response = await axios.post(`${API}/admin/quick-import-wordpress`, {
        csv_content: csvContent
      });
      setImportResult(response.data);
      if (response.data.imported > 0) {
        onSuccess?.();
        toast.success(`Successfully imported ${response.data.imported} bookings!`);
      }
    } catch (error) {
      console.error('Quick import error:', error);
      setImportResult({
        success: false,
        error: error.response?.data?.detail || 'Import failed'
      });
    } finally {
      setImporting(false);
    }
  };

  // Fix imported bookings - restore from deleted and fix dates
  const handleFixBookings = async () => {
    setImporting(true);
    setImportResult(null);

    try {
      const response = await axios.post(`${API}/admin/fix-imported-bookings`);
      setImportResult({
        success: true,
        imported: response.data.restored_from_deleted,
        skipped: response.data.dates_fixed,
        errors: [],
        message: response.data.message
      });
      onSuccess?.();
      toast.success(response.data.message);
    } catch (error) {
      console.error('Fix bookings error:', error);
      setImportResult({
        success: false,
        error: error.response?.data?.detail || 'Fix failed'
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Fix Bookings - Restore from deleted and fix dates */}
      <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-400">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
          <p className="text-gray-700 font-medium mb-2">🔧 Fix Imported Bookings</p>
          <p className="text-sm text-gray-500 mb-4">
            Restore bookings from Deleted folder and fix date format (DD-MM-YYYY → YYYY-MM-DD)
          </p>
          <Button
            onClick={handleFixBookings}
            disabled={importing}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Fix All Imported Bookings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Google Calendar Sync Section */}
      <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-400">
        <div className="text-center">
          <Calendar className="w-12 h-12 mx-auto text-blue-500 mb-3" />
          <p className="text-gray-700 font-medium mb-2">📅 Sync Imported Bookings to Google Calendar</p>
          <p className="text-sm text-gray-500 mb-4">
            Add all imported WordPress bookings to your Google Calendar. Only bookings not already synced will be processed.
          </p>
          
          {/* Calendar Sync Status */}
          {calendarSyncStatus && (
            <div className="bg-white rounded-lg p-3 mb-4 border border-blue-200 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Already Synced:</span>
                  <span className="ml-2 font-medium text-green-600">{calendarSyncStatus.already_synced || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500">Pending Sync:</span>
                  <span className="ml-2 font-medium text-blue-600">{calendarSyncStatus.remaining_to_sync || 0}</span>
                </div>
              </div>
              {calendarSyncStatus.last_task && (
                <div className="mt-2 pt-2 border-t border-blue-100 text-xs text-gray-500">
                  Last sync: {calendarSyncStatus.last_task.status === 'completed' 
                    ? `✅ ${calendarSyncStatus.last_task.synced} synced, ${calendarSyncStatus.last_task.failed} failed`
                    : calendarSyncStatus.last_task.status === 'processing' 
                    ? '⏳ In progress...'
                    : '❌ Error'}
                </div>
              )}
            </div>
          )}
          
          <Button
            onClick={handleBatchCalendarSync}
            disabled={calendarSyncing || (calendarSyncStatus?.remaining_to_sync === 0)}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {calendarSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Starting Sync...
              </>
            ) : calendarSyncStatus?.remaining_to_sync === 0 ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                All Bookings Synced!
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 mr-2" />
                Sync {calendarSyncStatus?.remaining_to_sync || 'All'} Bookings to Calendar
              </>
            )}
          </Button>
          
          {/* Calendar Sync Result */}
          {calendarSyncResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              calendarSyncResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {calendarSyncResult.success ? (
                <p>✅ {calendarSyncResult.message}</p>
              ) : (
                <p>❌ {calendarSyncResult.error}</p>
              )}
            </div>
          )}
          
          <p className="text-xs text-blue-600 mt-3">
            ⚡ Runs in background - may take 10-15 minutes for 1,500+ bookings
          </p>
        </div>
      </div>

      {/* Simple Import - Select file then click import */}
      <div className="bg-green-50 rounded-lg p-6 border-2 border-green-300">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
          <p className="text-gray-700 font-medium mb-2">Import WordPress Bookings</p>
          <p className="text-sm text-gray-500 mb-4">
            Select your CSV export file, then click Import. No login issues - just works!
          </p>
          
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex flex-col gap-3 items-center">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="border-green-400 text-green-600 hover:bg-green-50"
            >
              1. Select CSV File
            </Button>
            
            {selectedFile && (
              <span className="text-sm text-gray-600 bg-green-100 px-3 py-1 rounded-full">
                📄 {selectedFile.name}
              </span>
            )}
            
            <Button
              onClick={handleQuickImport}
              disabled={importing || !selectedFile}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  2. Import Bookings Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Current Status */}
      {importStatus && (
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <h4 className="font-semibold text-gray-700 mb-2">Current Database Status</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Bookings:</span>
              <span className="ml-2 font-medium">{importStatus.total_bookings}</span>
            </div>
            <div>
              <span className="text-gray-500">WordPress Imports:</span>
              <span className="ml-2 font-medium text-purple-600">{importStatus.wordpress_imports}</span>
            </div>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className={`rounded-lg p-4 border ${
          importResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          {importResult.success ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-800">Import Completed!</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded border border-green-200">
                  <p className="text-green-600 font-semibold text-lg">{importResult.imported}</p>
                  <p className="text-gray-500">Imported</p>
                </div>
                <div className="bg-white p-3 rounded border border-yellow-200">
                  <p className="text-yellow-600 font-semibold text-lg">{importResult.skipped}</p>
                  <p className="text-gray-500">Skipped (duplicates)</p>
                </div>
                <div className="bg-white p-3 rounded border border-red-200">
                  <p className="text-red-600 font-semibold text-lg">{importResult.total_errors || 0}</p>
                  <p className="text-gray-500">Errors</p>
                </div>
              </div>
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800 mb-1">First {importResult.errors.length} errors:</p>
                  <ul className="text-xs text-yellow-700 list-disc pl-4">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700">{importResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-2">📋 Import Instructions</h4>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal pl-5">
          <li>Install the <strong>Book A Ride Export Plugin</strong> on your WordPress site</li>
          <li>Go to WordPress Admin → Tools → Book A Ride Export</li>
          <li>Click "Download CSV Export" to get your booking data</li>
          <li>Upload the downloaded CSV file here</li>
          <li>Original booking IDs will be preserved for cross-reference</li>
          <li>Duplicate bookings (same original ID) will be automatically skipped</li>
        </ol>
        <p className="text-xs text-gray-500 mt-3">
          ⚠️ No email or SMS notifications will be sent for imported bookings
        </p>
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deletedBookings, setDeletedBookings] = useState([]);
  // Archive state
  const [archivedBookings, setArchivedBookings] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState('');
  const [archivePage, setArchivePage] = useState(1);
  const [archiveTotalPages, setArchiveTotalPages] = useState(1);
  const [runningAutoArchive, setRunningAutoArchive] = useState(false);
  // Shuttle state
  const [shuttleDate, setShuttleDate] = useState(new Date().toISOString().split('T')[0]);
  const [shuttleData, setShuttleData] = useState({});
  const [loadingShuttle, setLoadingShuttle] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [xeroConnected, setXeroConnected] = useState(false);
  const [xeroOrg, setXeroOrg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailCC, setEmailCC] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [inlinePriceBookingId, setInlinePriceBookingId] = useState(null);
  const [inlinePriceValue, setInlinePriceValue] = useState('');
  const [smsModal, setSmsModal] = useState(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [setPasswordMode, setSetPasswordMode] = useState(false);  // true = set without current (forgot/Google)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [driverPayoutOverride, setDriverPayoutOverride] = useState('');
  const [showDriverAssignPreview, setShowDriverAssignPreview] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState(null); // {tripType, driverPayout, driver}
  const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    name: '',
    email: '',
    ccEmail: '',  // CC email for confirmation
    phone: '',
    serviceType: 'airport-shuttle',
    pickupAddress: '',
    pickupAddresses: [],  // Multiple pickups support
    dropoffAddress: '',
    date: '',
    time: '',
    passengers: '1',
    paymentMethod: 'stripe',  // Default to Stripe payment link (mandatory online payment)
    notes: '',
    flightArrivalNumber: '',
    flightArrivalTime: '',
    flightDepartureNumber: '',
    flightDepartureTime: '',
    // Return trip fields
    bookReturn: false,
    returnDate: '',
    returnTime: '',
    returnDepartureFlightNumber: '',
    returnDepartureTime: '',
    returnArrivalFlightNumber: '',
    returnArrivalTime: ''
  });
  const [bookingPricing, setBookingPricing] = useState({
    distance: 0,
    basePrice: 0,
    airportFee: 0,
    passengerFee: 0,
    totalPrice: 0
  });
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [manualPriceOverride, setManualPriceOverride] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  // Bulk delete state
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Customer autocomplete state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const customerSearchRef = useRef(null);
  
  // Preview confirmation modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewBookingInfo, setPreviewBookingInfo] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Xero invoice date state (for backdating)
  const [xeroInvoiceDate, setXeroInvoiceDate] = useState(null);
  
  // Date/Time picker states for admin form
  const [adminPickupDate, setAdminPickupDate] = useState(null);
  const [adminPickupTime, setAdminPickupTime] = useState(null);
  const [adminReturnDate, setAdminReturnDate] = useState(null);
  const [adminReturnTime, setAdminReturnTime] = useState(null);
  const [adminFlightArrivalTime, setAdminFlightArrivalTime] = useState(null);
  const [adminFlightDepartureTime, setAdminFlightDepartureTime] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchBookings();
    fetchDrivers();
    checkXeroStatus();
    fetchArchivedCount(); // Load archive count on initial load
  }, [navigate]);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [bookingsPerPage] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchBookings = async (page = 1, append = false) => {
    try {
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);
      
      const response = await axios.get(`${API}/bookings`, {
        ...getAuthHeaders(),
        params: {
          page: page,
          limit: bookingsPerPage
        }
      });
      
      const newBookings = response.data;
      
      // Cache bookings in localStorage for offline access
      try {
        const cached = JSON.parse(localStorage.getItem('cachedBookings') || '[]');
        const updatedCache = append ? [...cached, ...newBookings] : newBookings;
        localStorage.setItem('cachedBookings', JSON.stringify(updatedCache.slice(0, 200))); // Cache up to 200
        localStorage.setItem('cachedBookingsTime', new Date().toISOString());
      } catch (e) {
        console.warn('Could not cache bookings:', e);
      }
      
      if (append) {
        setBookings(prev => [...prev, ...newBookings]);
      } else {
        setBookings(newBookings);
      }
      
      setCurrentPage(page);
      setLoading(false);
      setIsLoadingMore(false);
      
      // Fetch total count for stats
      if (page === 1) {
        fetchBookingCounts();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminAuth');
        navigate('/admin/login');
        return;
      }
      console.error('Error fetching bookings:', error);
      
      // Try to load from cache if offline
      try {
        const cached = JSON.parse(localStorage.getItem('cachedBookings') || '[]');
        if (cached.length > 0) {
          setBookings(cached);
          toast.info('Loaded cached bookings (offline mode)');
        } else {
          toast.error('Failed to load bookings');
        }
      } catch (e) {
        toast.error('Failed to load bookings');
      }
      
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const fetchBookingCounts = async () => {
    try {
      const response = await axios.get(`${API}/bookings/count`, getAuthHeaders());
      setTotalBookings(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching booking counts:', error);
    }
  };

  const loadMoreBookings = () => {
    fetchBookings(currentPage + 1, true);
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API}/drivers`, getAuthHeaders());
      setDrivers(response.data.drivers || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchDeletedBookings = async () => {
    setLoadingDeleted(true);
    try {
      const response = await axios.get(`${API}/bookings/deleted`, getAuthHeaders());
      setDeletedBookings(response.data || []);
    } catch (error) {
      console.error('Error fetching deleted bookings:', error);
      toast.error('Failed to load deleted bookings');
    } finally {
      setLoadingDeleted(false);
    }
  };

  // Fetch archived bookings
  const fetchArchivedBookings = async (page = 1, search = '') => {
    setLoadingArchived(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (search) params.append('search', search);
      const response = await axios.get(`${API}/bookings/archived?${params}`, getAuthHeaders());
      setArchivedBookings(response.data.bookings || []);
      setArchivedCount(response.data.total || 0);
      setArchivePage(response.data.page || 1);
      setArchiveTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching archived bookings:', error);
      toast.error('Failed to load archived bookings');
    } finally {
      setLoadingArchived(false);
    }
  };

  // Fetch archive count on load
  const fetchArchivedCount = async () => {
    try {
      const response = await axios.get(`${API}/bookings/archived/count`, getAuthHeaders());
      setArchivedCount(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching archived count:', error);
    }
  };

  // Archive a booking
  const handleArchiveBooking = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/bookings/archive/${bookingId}`, {}, getAuthHeaders());
      toast.success(`Booking #${response.data.referenceNumber} archived successfully`);
      fetchBookings();
      fetchArchivedCount();
    } catch (error) {
      console.error('Error archiving booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to archive booking');
    }
  };

  // Unarchive (restore) a booking
  const handleUnarchiveBooking = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/bookings/unarchive/${bookingId}`, {}, getAuthHeaders());
      toast.success(`Booking #${response.data.referenceNumber} restored to active bookings`);
      fetchArchivedBookings(archivePage, archiveSearchTerm);
      fetchBookings();
    } catch (error) {
      console.error('Error unarchiving booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to restore booking');
    }
  };

  // Search archived bookings
  const handleArchiveSearch = (e) => {
    e.preventDefault();
    setArchivePage(1);
    fetchArchivedBookings(1, archiveSearchTerm);
  };

  // Run auto-archive manually
  const handleRunAutoArchive = async () => {
    setRunningAutoArchive(true);
    try {
      const response = await axios.post(`${API}/admin/trigger-auto-archive`, {}, getAuthHeaders());
      const { archived, skipped } = response.data;
      if (archived > 0) {
        toast.success(`Auto-archive complete! Archived ${archived} completed bookings.`);
        fetchArchivedBookings(1, '');
        fetchArchivedCount();
        fetchBookings(); // Refresh active bookings list
      } else {
        toast.info('No bookings to archive. All completed trips are either already archived or still have pending return dates.');
      }
    } catch (error) {
      console.error('Error running auto-archive:', error);
      toast.error(error.response?.data?.detail || 'Failed to run auto-archive');
    } finally {
      setRunningAutoArchive(false);
    }
  };

  // Fetch shuttle data for admin
  const fetchShuttleData = async (date = shuttleDate) => {
    setLoadingShuttle(true);
    try {
      const response = await axios.get(`${API}/shuttle/departures?date=${date}`, getAuthHeaders());
      setShuttleData(response.data || {});
    } catch (error) {
      console.error('Error fetching shuttle data:', error);
      // Don't show error for 401 (might not have shuttle feature)
    } finally {
      setLoadingShuttle(false);
    }
  };

  // Get optimized shuttle route
  const getShuttleRoute = async (date, time) => {
    try {
      const response = await axios.get(`${API}/shuttle/route/${date}/${time}`, getAuthHeaders());
      if (response.data.googleMapsUrl) {
        window.open(response.data.googleMapsUrl, '_blank');
        toast.success('Route opened in Google Maps');
      }
      return response.data;
    } catch (error) {
      console.error('Error getting shuttle route:', error);
      toast.error('Failed to get route');
    }
  };

  // Capture all shuttle payments for a departure
  const captureShuttlePayments = async (date, time) => {
    try {
      const response = await axios.post(`${API}/shuttle/capture-all/${date}/${time}`, {}, getAuthHeaders());
      toast.success(`Captured payments for ${response.data.totalPassengers} passengers at $${response.data.finalPricePerPerson}/person`);
      fetchShuttleData(date);
    } catch (error) {
      console.error('Error capturing shuttle payments:', error);
      toast.error('Failed to capture payments');
    }
  };

  // Start shuttle run - calculates ETAs and schedules "arriving soon" SMS for all customers
  const startShuttleRun = async (date, time, driverId = null, driverName = null) => {
    try {
      toast.loading('Starting shuttle and scheduling notifications...');
      const response = await axios.post(`${API}/shuttle/start/${date}/${time}`, {
        driverId,
        driverName
      }, getAuthHeaders());
      toast.dismiss();
      
      if (response.data.success) {
        toast.success(`Shuttle started! ${response.data.scheduledNotifications} "Arriving Soon" SMS scheduled automatically.`);
        fetchShuttleData(date);
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error starting shuttle:', error);
      toast.error(error.response?.data?.detail || 'Failed to start shuttle');
    }
  };

  // Assign driver to shuttle - automatically starts the shuttle and schedules SMS
  const assignShuttleDriver = async (date, time, driverId) => {
    if (!driverId) return;
    
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    try {
      toast.loading(`Assigning ${driver.name} and scheduling notifications...`);
      
      // Call the assign endpoint which handles everything
      const response = await axios.post(`${API}/shuttle/assign-driver/${date}/${time}`, {
        driverId: driverId,
        driverName: driver.name,
        driverPhone: driver.phone
      }, getAuthHeaders());
      
      toast.dismiss();
      
      if (response.data.success) {
        toast.success(`${driver.name} assigned! Route sent to driver, ${response.data.scheduledNotifications} customer SMS scheduled.`);
        fetchShuttleData(date);
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error assigning driver:', error);
      toast.error(error.response?.data?.detail || 'Failed to assign driver');
    }
  };

  const checkXeroStatus = async () => {
    try {
      const response = await axios.get(`${API}/xero/status`, getAuthHeaders());
      setXeroConnected(response.data.connected);
      setXeroOrg(response.data.organization || '');
    } catch (error) {
      console.error('Error checking Xero status:', error);
    }
  };

  const connectXero = async () => {
    try {
      const response = await axios.get(`${API}/xero/login`, getAuthHeaders());
      window.open(response.data.authorization_url, '_blank');
      toast.info('Complete Xero authorization in the new window');
    } catch (error) {
      console.error('Error connecting Xero:', error);
      toast.error('Failed to connect Xero');
    }
  };

  const createXeroInvoice = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/xero/create-invoice/${bookingId}`, {}, getAuthHeaders());
      toast.success(response.data.message);
      fetchBookings();
    } catch (error) {
      console.error('Error creating Xero invoice:', error);
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    }
  };

  const recordXeroPayment = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/xero/record-payment/${bookingId}`, {}, getAuthHeaders());
      toast.success(response.data.message);
      fetchBookings();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.response?.data?.detail || 'Failed to record payment');
    }
  };

  const handleRestoreBooking = async (bookingId) => {
    try {
      await axios.post(`${API}/bookings/restore/${bookingId}`, {}, getAuthHeaders());
      toast.success('Booking restored successfully!');
      fetchDeletedBookings();
      fetchBookings();
    } catch (error) {
      console.error('Error restoring booking:', error);
      toast.error('Failed to restore booking');
    }
  };

  const handlePermanentDelete = async (bookingId) => {
    if (!window.confirm('This will PERMANENTLY delete this booking with NO way to recover. Are you sure?')) {
      return;
    }
    try {
      await axios.delete(`${API}/bookings/permanent/${bookingId}`, getAuthHeaders());
      toast.success('Booking permanently deleted');
      fetchDeletedBookings();
    } catch (error) {
      console.error('Error permanently deleting booking:', error);
      toast.error('Failed to permanently delete booking');
    }
  };

  // Show preview before assigning driver
  const handleShowAssignPreview = (tripType = 'outbound') => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }
    
    const driver = drivers.find(d => d.id === selectedDriver);
    const customerPrice = selectedBooking?.pricing?.totalPrice || 0;
    const paymentStatus = (selectedBooking?.payment_status || '').toLowerCase();
    const hasReturn = selectedBooking?.bookReturn || !!selectedBooking?.returnDate;
    
    // Calculate auto payout if no override
    let calculatedPayout;
    if (driverPayoutOverride && !isNaN(parseFloat(driverPayoutOverride))) {
      calculatedPayout = parseFloat(driverPayoutOverride);
    } else {
      // Use subtotal (price before Stripe fee) if available, otherwise calculate from total
      // Stripe fee formula: total = subtotal * 1.029 + 0.30
      // Therefore: subtotal = (total - 0.30) / 1.029
      const subtotal = selectedBooking?.pricing?.subtotal || 
        ((customerPrice - 0.30) / 1.029);
      
      // Determine trip price (for return bookings, split the subtotal)
      let tripPrice = subtotal;
      if (hasReturn) {
        // Use oneWayPrice if explicitly set, otherwise split evenly
        const oneWayPrice = selectedBooking?.pricing?.oneWayPrice;
        if (oneWayPrice) {
          tripPrice = tripType === 'outbound' ? oneWayPrice : (subtotal - oneWayPrice);
        } else {
          // Split evenly for return bookings without explicit oneWayPrice
          tripPrice = subtotal / 2;
        }
      }
      
      // Driver gets the full trip price (customer pays Stripe fee separately)
      calculatedPayout = Math.round(tripPrice * 100) / 100;
    }
    
    setPendingAssignment({
      tripType,
      driver,
      driverPayout: calculatedPayout,
      isOverride: !!driverPayoutOverride,
      customerPrice,
      hasReturn,
      // Stripe fee is now paid by customer, so no fee info needed
      customerPaysStripeFee: true
    });
    setShowDriverAssignPreview(true);
  };

  // Confirm and send driver assignment
  const handleConfirmAssignDriver = async () => {
    if (!pendingAssignment) return;
    
    const { tripType, driverPayout } = pendingAssignment;
    
    try {
      let url = `${API}/drivers/${selectedDriver}/assign?booking_id=${selectedBooking.id}&trip_type=${tripType}`;
      if (driverPayoutOverride && !isNaN(parseFloat(driverPayoutOverride))) {
        url += `&driver_payout=${parseFloat(driverPayoutOverride)}`;
      }
      
      const response = await axios.patch(url, {}, getAuthHeaders());
      
      // Get the driver details to update selectedBooking
      const assignedDriver = drivers.find(d => d.id === selectedDriver);
      
      // Update the selectedBooking with driver info based on trip type
      if (tripType === 'return') {
        setSelectedBooking(prev => ({
          ...prev,
          return_driver_id: selectedDriver,
          return_driver_name: assignedDriver?.name || '',
          return_driver_phone: assignedDriver?.phone || '',
          return_driver_email: assignedDriver?.email || '',
          return_driver_payout: driverPayout
        }));
      } else {
        setSelectedBooking(prev => ({
          ...prev,
          driver_id: selectedDriver,
          driver_name: assignedDriver?.name || '',
          driver_phone: assignedDriver?.phone || '',
          driver_email: assignedDriver?.email || '',
          driver_payout: driverPayout
        }));
      }
      
      toast.success(response.data?.message || 'Driver assigned successfully!');
      setSelectedDriver('');
      setDriverPayoutOverride('');
      setShowDriverAssignPreview(false);
      setPendingAssignment(null);
      fetchBookings();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const handleAssignDriver = async (tripType = 'outbound') => {
    if (!selectedDriver) {
      toast.error('Please select a driver');
      return;
    }
    
    try {
      // Build URL with optional driver payout
      let url = `${API}/drivers/${selectedDriver}/assign?booking_id=${selectedBooking.id}&trip_type=${tripType}`;
      if (driverPayoutOverride && !isNaN(parseFloat(driverPayoutOverride))) {
        url += `&driver_payout=${parseFloat(driverPayoutOverride)}`;
      }
      
      const response = await axios.patch(url, {}, getAuthHeaders());
      
      // Get the driver details to update selectedBooking
      const assignedDriver = drivers.find(d => d.id === selectedDriver);
      
      // Update the selectedBooking with driver info based on trip type
      if (tripType === 'return') {
        setSelectedBooking(prev => ({
          ...prev,
          return_driver_id: selectedDriver,
          return_driver_name: assignedDriver?.name || '',
          return_driver_phone: assignedDriver?.phone || '',
          return_driver_email: assignedDriver?.email || '',
          return_driver_payout: driverPayoutOverride ? parseFloat(driverPayoutOverride) : null
        }));
      } else {
        setSelectedBooking(prev => ({
          ...prev,
          driver_id: selectedDriver,
          driver_name: assignedDriver?.name || '',
          driver_phone: assignedDriver?.phone || '',
          driver_email: assignedDriver?.email || '',
          driver_payout: driverPayoutOverride ? parseFloat(driverPayoutOverride) : null
        }));
      }
      
      toast.success(response.data?.message || 'Driver assigned successfully!');
      setSelectedDriver('');
      setDriverPayoutOverride('');
      fetchBookings();
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast.error('Failed to assign driver');
    }
  };

  const handleUnassignDriver = async (tripType = 'outbound') => {
    if (!selectedBooking) return;
    
    const driverName = tripType === 'return' 
      ? selectedBooking.return_driver_name 
      : selectedBooking.driver_name;
    
    if (!window.confirm(`Are you sure you want to unassign ${driverName} from the ${tripType} trip?`)) {
      return;
    }
    
    try {
      const response = await axios.patch(
        `${API}/bookings/${selectedBooking.id}/unassign-driver?trip_type=${tripType}`,
        {},
        getAuthHeaders()
      );
      
      // Update the selectedBooking to clear driver info based on trip type
      if (tripType === 'return') {
        setSelectedBooking(prev => ({
          ...prev,
          return_driver_id: null,
          return_driver_name: null,
          return_driver_phone: null,
          return_driver_email: null
        }));
      } else {
        setSelectedBooking(prev => ({
          ...prev,
          driver_id: null,
          driver_name: null,
          driver_phone: null,
          driver_email: null,
          driverConfirmed: false
        }));
      }
      
      toast.success(response.data?.message || 'Driver unassigned successfully!');
      fetchBookings();
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast.error(error.response?.data?.detail || 'Failed to unassign driver');
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Search filter - also search archive via API
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.name?.toLowerCase().includes(searchLower) ||
        b.email?.toLowerCase().includes(searchLower) ||
        b.phone?.includes(searchTerm) ||
        b.pickupAddress?.toLowerCase().includes(searchLower) ||
        b.dropoffAddress?.toLowerCase().includes(searchLower) ||
        String(b.referenceNumber)?.includes(searchTerm)
      );
      
      // Also search archive for matching results
      searchAllBookings(searchTerm);
    }

    setFilteredBookings(filtered);
  };

  // Search across all bookings (active + archived)
  const [archiveSearchResults, setArchiveSearchResults] = useState([]);
  const searchAllBookings = async (term) => {
    if (!term || term.length < 2) {
      setArchiveSearchResults([]);
      return;
    }
    try {
      const response = await axios.get(`${API}/bookings/search-all?search=${encodeURIComponent(term)}&include_archived=true`, getAuthHeaders());
      // Only set archived results that aren't already in the active bookings
      const archivedOnly = response.data.results.filter(b => b.isArchived);
      setArchiveSearchResults(archivedOnly);
    } catch (error) {
      console.error('Error searching all bookings:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
    toast.success('Logged out successfully');
  };

  // Sync from production database
  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`${API}/admin/sync`);
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh bookings after sync
        await fetchBookings();
        await fetchDrivers();
      } else {
        toast.error('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error(error.response?.data?.detail || 'Failed to sync from production');
    } finally {
      setSyncing(false);
    }
  };

  const openDetailsModal = (booking) => {
    setSelectedBooking(booking);
    const totalPrice = booking.pricing?.totalPrice ?? booking.totalPrice ?? 0;
    setPriceOverride(totalPrice.toString());
    // Reset Xero invoice date to booking date
    setXeroInvoiceDate(booking.date ? new Date(booking.date + 'T00:00:00') : new Date());
    setShowDetailsModal(true);
  };

  const openEmailModal = (booking) => {
    setSelectedBooking(booking);
    setEmailSubject(`Booking Confirmation - ${booking.serviceType}`);
    const totalPrice = booking.pricing?.totalPrice ?? booking.totalPrice ?? 0;
    setEmailMessage(`Dear ${booking.name},\n\nYour booking has been confirmed!\n\nDetails:\nService: ${booking.serviceType}\nPickup: ${booking.pickupAddress}\nDrop-off: ${booking.dropoffAddress}\nDate: ${formatDate(booking.date)} (${getDayOfWeek(booking.date)})\nTime: ${booking.time}\nPassengers: ${booking.passengers}\n\nTotal Price: $${totalPrice.toFixed(2)}\n\nThank you for choosing Book A Ride NZ!`);
    setEmailCC('');
    setShowEmailModal(true);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await axios.patch(`${API}/bookings/${bookingId}`, { status: newStatus }, getAuthHeaders());
      toast.success('Status updated successfully');
      fetchBookings();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteBooking = async (bookingId, bookingName, sendNotification = true) => {
    const confirmMessage = sendNotification 
      ? `Are you sure you want to CANCEL booking for ${bookingName}?\n\n⚠️ The customer will receive a cancellation email and SMS.`
      : `SILENT DELETE for ${bookingName}?\n\n✓ No email or SMS will be sent to the customer.\n✓ Use this for duplicate bookings.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await axios.delete(`${API}/bookings/${bookingId}?send_notification=${sendNotification}`, getAuthHeaders());
      
      if (sendNotification) {
        toast.success('Booking cancelled - Customer notified via email & SMS');
      } else {
        toast.success('Booking silently deleted - No notification sent');
      }
      fetchBookings();
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error deleting booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  // Bulk delete without notifications
  const handleBulkDelete = async () => {
    if (selectedBookings.size === 0) return;
    
    setShowBulkDeleteConfirm(false);
    const count = selectedBookings.size;
    let deleted = 0;
    let failed = 0;

    toast.loading(`Deleting ${count} bookings...`);

    for (const bookingId of selectedBookings) {
      try {
        await axios.delete(`${API}/bookings/${bookingId}?send_notification=false`, getAuthHeaders());
        deleted++;
      } catch (error) {
        console.error(`Failed to delete booking ${bookingId}:`, error);
        failed++;
      }
    }

    toast.dismiss();
    
    if (failed === 0) {
      toast.success(`Successfully deleted ${deleted} booking${deleted > 1 ? 's' : ''} (no notifications sent)`);
    } else {
      toast.warning(`Deleted ${deleted} bookings, ${failed} failed`);
    }
    
    setSelectedBookings(new Set());
    fetchBookings();
  };

  const handleSendToAdmin = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/send-to-admin`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Booking details sent to admin mailbox');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error sending booking to admin:', error);
      toast.error(error.response?.data?.detail || 'Failed to send booking to admin');
    }
  };
  
  const handleRemovePickup = (index) => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index)
    }));
  };

  const handlePickupAddressChange = (index, value) => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  const handleAddPickup = () => {
    setNewBooking(prev => ({
      ...prev,
      pickupAddresses: [...prev.pickupAddresses, '']
    }));
  };

  const exportToCSV = () => {
    try {
      // Define CSV headers
      const headers = ['Booking ID', 'Date', 'Time', 'Customer Name', 'Email', 'Phone', 'Service Type', 'Pickup Address', 'Dropoff Address', 'Passengers', 'Price', 'Payment Status', 'Status', 'Notes', 'Created At'];
      
      // Convert bookings to CSV rows
      const rows = filteredBookings.map(booking => [
        booking.id || '',
        booking.date || '',
        booking.time || '',
        booking.name || '',
        booking.email || '',
        booking.phone || '',
        booking.serviceType?.replace('-', ' ').toUpperCase() || '',
        booking.pickupAddress || '',
        booking.dropoffAddress || '',
        booking.passengers || '',
        booking.totalPrice || booking.pricing?.totalPrice || '',
        booking.payment_status || '',
        booking.status || '',
        booking.notes || '',
        booking.createdAt || ''
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
      ].join('\\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${filteredBookings.length} bookings to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export bookings');
    }
  };

  const handleInlinePriceSave = async (booking) => {
    const newPrice = parseFloat(inlinePriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Enter a valid price');
      return;
    }
    try {
      await axios.patch(`${API}/bookings/${booking.id}`, {
        pricing: { ...booking.pricing, totalPrice: newPrice, overridden: true }
      }, getAuthHeaders());
      toast.success(`Price updated to $${newPrice.toFixed(2)}`);
      setInlinePriceBookingId(null);
      fetchBookings();
    } catch {
      toast.error('Failed to update price');
    }
  };

  const buildSmsMessage = (booking) => {
    const lines = [
      `BookARide #${booking.referenceNumber || booking.id?.slice(0, 6)}`,
      `Date: ${booking.date} at ${booking.time}`,
      `Customer: ${booking.name} | ${booking.phone}`,
      `Pax: ${booking.passengers || 1}`,
      `Pickup: ${booking.pickupAddress}`,
      `Dropoff: ${booking.dropoffAddress}`,
    ];
    if (booking.returnDate && booking.returnTime) {
      lines.push(`Return: ${booking.returnDate} at ${booking.returnTime}`);
    }
    const flightNum = booking.arrivalFlightNumber || booking.flightArrivalNumber || booking.departureFlightNumber || booking.flightDepartureNumber;
    if (flightNum) lines.push(`Flight: ${flightNum}`);
    if (booking.notes) lines.push(`Notes: ${booking.notes}`);
    lines.push(`Price: $${booking.pricing?.totalPrice?.toFixed(2) || booking.totalPrice || '0'}`);
    return lines.join('\n');
  };

  const openSmsApp = () => {
    const phone = smsPhone.replace(/\s/g, '');
    if (!phone) { toast.error('Enter a phone number'); return; }
    const message = buildSmsMessage(smsModal);
    window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, '_self');
    setSmsModal(null);
    setSmsPhone('');
  };

  const handlePriceOverride = async () => {
    try {
      const newPrice = parseFloat(priceOverride);
      if (isNaN(newPrice) || newPrice < 0) {
        toast.error('Please enter a valid price');
        return;
      }

      await axios.patch(`${API}/bookings/${selectedBooking.id}`, {
        pricing: {
          ...selectedBooking.pricing,
          totalPrice: newPrice,
          overridden: true
        }
      }, getAuthHeaders());
      toast.success('Price updated successfully');
      setShowDetailsModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  const handleUpdatePaymentStatus = async () => {
    if (!selectedBooking || !selectedPaymentStatus) {
      toast.error('Please select a payment status');
      return;
    }

    try {
      const response = await axios.put(`${API}/bookings/${selectedBooking.id}/payment-status`, {
        paymentStatus: selectedPaymentStatus
      }, getAuthHeaders());

      if (response.data.success) {
        toast.success('Payment status updated successfully');
        fetchBookings();
        setShowDetailsModal(false);
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.detail || 'Failed to update payment status');
    }
  };

  const handleSendEmail = async () => {
    try {
      await axios.post(`${API}/send-booking-email`, {
        bookingId: selectedBooking.id,
        email: selectedBooking.email,
        cc: emailCC,
        subject: emailSubject,
        message: emailMessage
      }, getAuthHeaders());
      toast.success('Email sent successfully!');
      setShowEmailModal(false);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  // Open edit booking modal
  const openEditBookingModal = (booking) => {
    setEditingBooking({
      ...booking,
      pickupAddresses: booking.pickupAddresses || []
    });
    setShowEditBookingModal(true);
  };

  // Handle edit booking save
  const handleSaveEditedBooking = async () => {
    if (!editingBooking) return;

    try {
      await axios.patch(`${API}/bookings/${editingBooking.id}`, {
        name: editingBooking.name,
        email: editingBooking.email,
        phone: editingBooking.phone,
        pickupAddress: editingBooking.pickupAddress,
        pickupAddresses: editingBooking.pickupAddresses?.filter(addr => addr.trim()) || [],
        dropoffAddress: editingBooking.dropoffAddress,
        date: editingBooking.date,
        time: editingBooking.time,
        passengers: editingBooking.passengers,
        notes: editingBooking.notes,
        flightArrivalNumber: editingBooking.flightArrivalNumber,
        flightArrivalTime: editingBooking.flightArrivalTime,
        flightDepartureNumber: editingBooking.flightDepartureNumber,
        flightDepartureTime: editingBooking.flightDepartureTime,
        // Return trip - inferred from filled return date + time
        bookReturn: !!(editingBooking.returnDate && editingBooking.returnTime),
        returnDate: editingBooking.returnDate,
        returnTime: editingBooking.returnTime
      }, getAuthHeaders());

      toast.success('Booking updated successfully!');
      setShowEditBookingModal(false);
      setEditingBooking(null);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to update booking');
    }
  };

  // Handle adding pickup to edit form
  const handleAddEditPickup = () => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: [...(prev.pickupAddresses || []), '']
    }));
  };

  // Handle removing pickup from edit form
  const handleRemoveEditPickup = (index) => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.filter((_, i) => i !== index)
    }));
  };

  // Handle edit pickup address change
  const handleEditPickupAddressChange = (index, value) => {
    setEditingBooking(prev => ({
      ...prev,
      pickupAddresses: prev.pickupAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  // Manual calendar sync
  const handleManualCalendarSync = async (bookingId) => {
    setCalendarLoading(true);
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/sync-calendar`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Booking synced to Google Calendar!');
      fetchBookings();
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      toast.error(error.response?.data?.detail || 'Failed to sync to calendar');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Resend confirmation email/SMS
  const handleResendConfirmation = async (bookingId) => {
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/resend-confirmation`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Confirmation resent to customer!');
    } catch (error) {
      console.error('Error resending confirmation:', error);
      toast.error(error.response?.data?.detail || 'Failed to resend confirmation');
    }
  };

  // Resend payment link to customer
  const handleResendPaymentLink = async (bookingId, paymentMethod = 'stripe') => {
    try {
      toast.loading('Sending payment link...');
      const response = await axios.post(
        `${API}/bookings/${bookingId}/resend-payment-link?payment_method=${paymentMethod}`, 
        {}, 
        getAuthHeaders()
      );
      toast.dismiss();
      toast.success(response.data.message || 'Payment link sent!');
    } catch (error) {
      toast.dismiss();
      console.error('Error sending payment link:', error);
      toast.error(error.response?.data?.detail || 'Failed to send payment link');
    }
  };

  // Send tracking link to driver
  const handleSendTrackingLink = async (bookingId) => {
    try {
      toast.loading('Sending tracking link to driver...');
      const response = await axios.post(`${API}/tracking/send-driver-link/${bookingId}`, {}, getAuthHeaders());
      toast.dismiss();
      toast.success(response.data.message || 'Tracking link sent to driver!');
      // Refresh bookings to show tracking info
      fetchBookings();
    } catch (error) {
      toast.dismiss();
      console.error('Error sending tracking link:', error);
      toast.error(error.response?.data?.detail || 'Failed to send tracking link');
    }
  };

  // Preview confirmation before sending
  const handlePreviewConfirmation = async (bookingId) => {
    setPreviewLoading(true);
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}/preview-confirmation`, getAuthHeaders());
      setPreviewHtml(response.data.html);
      setPreviewBookingInfo(response.data.booking);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Error previewing confirmation:', error);
      toast.error(error.response?.data?.detail || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Send confirmation after preview
  const handleSendAfterPreview = async () => {
    if (!previewBookingInfo) return;
    
    // Find the booking ID from the current editing context or most recent preview
    const bookingId = editingBooking?.id;
    if (!bookingId) {
      toast.error('No booking selected');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/resend-confirmation`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Confirmation sent to customer!');
      setShowPreviewModal(false);
      setPreviewHtml('');
      setPreviewBookingInfo(null);
    } catch (error) {
      console.error('Error sending confirmation:', error);
      toast.error(error.response?.data?.detail || 'Failed to send confirmation');
    }
  };

  // Send day-before reminders
  const handleSendReminders = async () => {
    if (!window.confirm('Send reminder emails and SMS to all customers with bookings tomorrow?')) {
      return;
    }
    
    try {
      const response = await axios.post(`${API}/admin/send-reminders`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Reminders sent successfully!');
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error(error.response?.data?.detail || 'Failed to send reminders');
    }
  };

  // Sync contacts to iPhone
  const [syncingContacts, setSyncingContacts] = useState(false);
  const handleSyncContactsToiPhone = async () => {
    if (!window.confirm('Sync all customer contacts to your iPhone? This will upload unique contacts from all bookings.')) {
      return;
    }
    
    setSyncingContacts(true);
    try {
      const response = await axios.post(`${API}/admin/sync-contacts-to-icloud`, {}, getAuthHeaders());
      const data = response.data;
      toast.success(`✅ Synced ${data.synced} contacts to iPhone! (${data.skipped} skipped, ${data.failed} failed)`);
    } catch (error) {
      console.error('Error syncing contacts:', error);
      toast.error(error.response?.data?.detail || 'Failed to sync contacts to iPhone');
    } finally {
      setSyncingContacts(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      const needsCurrent = !setPasswordMode;
      if (needsCurrent && (!currentPassword || !newPassword || !confirmPassword)) {
        toast.error('Please fill in all fields');
        return;
      }
      if (!needsCurrent && (!newPassword || !confirmPassword)) {
        toast.error('Please fill in new password and confirmation');
        return;
      }
      
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
      
      if (newPassword.length < 8) {
        toast.error('New password must be at least 8 characters');
        return;
      }
      
      if (setPasswordMode) {
        await axios.post(`${API}/admin/set-password`, { new_password: newPassword }, getAuthHeaders());
        toast.success('Password set successfully! You can now log in with username and password.');
      } else {
        await axios.post(`${API}/auth/change-password`, {
          current_password: currentPassword,
          new_password: newPassword
        }, getAuthHeaders());
        toast.success('Password changed successfully!');
      }
      setShowPasswordModal(false);
      setSetPasswordMode(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Current password is incorrect');
        return;
      }
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const calculateBookingPrice = async () => {
    if (!newBooking.pickupAddress || !newBooking.dropoffAddress) {
      toast.error('Please enter pickup and drop-off addresses');
      return;
    }

    const pickupCount = 1 + newBooking.pickupAddresses.filter(addr => addr.trim()).length;
    if (pickupCount > 1) {
      toast.info(`Calculating route for ${pickupCount} pickup locations...`);
    }

    setCalculatingPrice(true);
    try {
      const response = await axios.post(`${API}/calculate-price`, {
        serviceType: newBooking.serviceType,
        pickupAddress: newBooking.pickupAddress,
        pickupAddresses: newBooking.pickupAddresses.filter(addr => addr.trim()),  // Filter empty
        dropoffAddress: newBooking.dropoffAddress,
        passengers: parseInt(newBooking.passengers),
        vipAirportPickup: false,
        oversizedLuggage: false
      });

      setBookingPricing(response.data);
      toast.success(`Price calculated: $${response.data.totalPrice.toFixed(2)} for ${response.data.distance}km route`);
    } catch (error) {
      console.error('Error calculating price:', error);
      toast.error('Failed to calculate price');
    } finally {
      setCalculatingPrice(false);
    }
  };

  // Customer search for autocomplete
  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }
    
    setSearchingCustomers(true);
    try {
      const response = await axios.get(`${API}/customers/search?q=${encodeURIComponent(query)}`, getAuthHeaders());
      setCustomerSearchResults(response.data.customers || []);
      setShowCustomerDropdown(response.data.customers?.length > 0);
    } catch (error) {
      console.error('Error searching customers:', error);
      setCustomerSearchResults([]);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Debounced customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearchQuery) {
        searchCustomers(customerSearchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Select customer from autocomplete
  const selectCustomer = (customer) => {
    setNewBooking(prev => ({
      ...prev,
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      pickupAddress: customer.pickupAddress || prev.pickupAddress,
      dropoffAddress: customer.dropoffAddress || prev.dropoffAddress
    }));
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
    toast.success(`Loaded ${customer.name}'s details (${customer.totalBookings} previous bookings)`);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateManualBooking = async () => {
    // Validation
    if (!newBooking.name || !newBooking.email || !newBooking.phone) {
      toast.error('Please fill in customer details');
      return;
    }

    if (!newBooking.pickupAddress || !newBooking.dropoffAddress) {
      toast.error('Please enter pickup and drop-off addresses');
      return;
    }

    if (!newBooking.date || !newBooking.time) {
      toast.error('Please select date and time');
      return;
    }

    // Infer return trip from filled return date + time
    const hasReturnTrip = !!(newBooking.returnDate && newBooking.returnTime);
    const isAirportShuttle = (newBooking.serviceType || '').toLowerCase().includes('airport') || (newBooking.serviceType || '').toLowerCase().includes('shuttle');
    if (hasReturnTrip && isAirportShuttle && !(newBooking.returnDepartureFlightNumber || '').trim()) {
      toast.error('Return flight number is required for airport shuttle return trips');
      return;
    }

    // Check if either calculated price or manual override is provided
    const hasCalculatedPrice = bookingPricing.totalPrice > 0;
    const hasManualPrice = manualPriceOverride && parseFloat(manualPriceOverride) > 0;
    
    if (!hasCalculatedPrice && !hasManualPrice) {
      toast.error('Please calculate the price or enter a manual price override');
      return;
    }

    try {
      // Calculate final price (double if return trip)
      let finalPrice = hasManualPrice ? parseFloat(manualPriceOverride) : bookingPricing.totalPrice;
      if (hasReturnTrip && !hasManualPrice) {
        finalPrice = finalPrice * 2; // Double for return trip
      }
      
      const priceOverride = hasManualPrice ? parseFloat(manualPriceOverride) : (hasReturnTrip ? finalPrice : null);
      
      await axios.post(`${API}/bookings/manual`, {
        name: newBooking.name,
        email: newBooking.email,
        ccEmail: newBooking.ccEmail,  // CC email for confirmation
        phone: newBooking.phone,
        serviceType: newBooking.serviceType,
        pickupAddress: newBooking.pickupAddress,
        pickupAddresses: newBooking.pickupAddresses.filter(addr => addr.trim()),  // Filter empty addresses
        dropoffAddress: newBooking.dropoffAddress,
        date: newBooking.date,
        time: newBooking.time,
        passengers: newBooking.passengers,
        pricing: hasReturnTrip ? { ...bookingPricing, totalPrice: finalPrice } : bookingPricing,
        paymentMethod: newBooking.paymentMethod,
        notes: newBooking.notes,
        priceOverride: priceOverride,
        // Flight details
        flightArrivalNumber: newBooking.flightArrivalNumber,
        flightArrivalTime: newBooking.flightArrivalTime,
        flightDepartureNumber: newBooking.flightDepartureNumber,
        flightDepartureTime: newBooking.flightDepartureTime,
        // Return trip details
        bookReturn: hasReturnTrip,
        returnDate: newBooking.returnDate,
        returnTime: newBooking.returnTime,
        returnDepartureFlightNumber: newBooking.returnDepartureFlightNumber,
        returnDepartureTime: newBooking.returnDepartureTime,
        returnArrivalFlightNumber: newBooking.returnArrivalFlightNumber,
        returnArrivalTime: newBooking.returnArrivalTime
      }, getAuthHeaders());

      toast.success('Booking created successfully! Customer will receive email & SMS confirmation.');
      setShowCreateBookingModal(false);
      // Reset form
      setNewBooking({
        name: '',
        email: '',
        ccEmail: '',
        phone: '',
        serviceType: 'airport-shuttle',
        pickupAddress: '',
        pickupAddresses: [],
        dropoffAddress: '',
        date: '',
        time: '',
        passengers: '1',
        paymentMethod: 'stripe',  // Default to Stripe payment link
        notes: '',
        flightArrivalNumber: '',
        flightArrivalTime: '',
        flightDepartureNumber: '',
        flightDepartureTime: '',
        bookReturn: false,
        returnDate: '',
        returnTime: '',
        returnDepartureFlightNumber: '',
        returnDepartureTime: '',
        returnArrivalFlightNumber: '',
        returnArrivalTime: ''
      });
      setAdminReturnDate(null);
      setAdminReturnTime(null);
      setBookingPricing({
        distance: 0,
        basePrice: 0,
        airportFee: 0,
        passengerFee: 0,
        totalPrice: 0
      });
      setManualPriceOverride('');
      fetchBookings(); // Refresh bookings list
    } catch (error) {
      console.error('Error creating booking:', error);
      const detail = error.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg || e.loc?.join('.')).filter(Boolean).slice(0, 2).join('. ')
        : (typeof detail === 'string' ? detail : null) || 'Failed to create booking';
      toast.error(msg);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending_approval': return 'text-orange-600 bg-orange-100 animate-pulse';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    pendingApproval: bookings.filter(b => b.status === 'pending_approval').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    // Only count revenue from confirmed and completed bookings (not pending or cancelled)
    totalRevenue: bookings
      .filter(b => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum, b) => sum + (b.pricing?.totalPrice || b.totalPrice || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-20">
      {/* Glassy Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/10 py-5 sticky top-20 z-40 shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-white/50 text-xs mt-0.5">Manage bookings and customer communications</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={() => window.open('/', '_blank')} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                <Home className="w-4 h-4 mr-2" />
                View Site
              </Button>
              <Button onClick={handleSyncContactsToiPhone} disabled={syncingContacts} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                <Smartphone className="w-4 h-4 mr-2" />
                {syncingContacts ? 'Syncing...' : 'Sync to iPhone'}
              </Button>
              <Button onClick={() => navigate('/driver/portal')} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                <Users className="w-4 h-4 mr-2" />
                Driver Portal
              </Button>
              <Button onClick={() => navigate('/admin/seo')} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                <Settings className="w-4 h-4 mr-2" />
                SEO Management
              </Button>
              <Button
                onClick={handleSync}
                disabled={syncing}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync'}
              </Button>
              {xeroConnected ? (
                <Button variant="outline" size="sm" className="bg-green-500/20 border-green-400/40 text-green-300 hover:bg-green-500/30 backdrop-blur-sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Xero: {xeroOrg || 'Connected'}
                </Button>
              ) : (
                <Button onClick={connectXero} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Connect Xero
                </Button>
              )}
              <Button onClick={() => setShowPasswordModal(true)} variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm">
                Change Password
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm" className="bg-red-500/20 border-red-400/40 text-red-300 hover:bg-red-500/30 backdrop-blur-sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <AdminBreadcrumb
          activeTab={activeTab}
          selectedBooking={selectedBooking}
          showDetailsModal={showDetailsModal}
          showEditBookingModal={showEditBookingModal}
        />

        {/* Tabs Navigation */}
        <Tabs defaultValue="bookings" value={activeTab} onValueChange={(val) => {
          setActiveTab(val);
          if (val === 'deleted') fetchDeletedBookings();
          if (val === 'shuttle') fetchShuttleData();
          if (val === 'archive') fetchArchivedBookings(1, '');
        }} className="w-full">
          <TabsList className="flex flex-wrap w-full gap-1 mb-6 md:mb-8 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 shadow-lg">
            <TabsTrigger value="bookings" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md rounded-xl">
              <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Bookings</span>
              <span className="sm:hidden">Book</span>
            </TabsTrigger>
            <TabsTrigger value="shuttle" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-amber-300/80 data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-md rounded-xl">
              <Bus className="w-3 h-3 md:w-4 md:h-4" />
              <span>Shuttle</span>
            </TabsTrigger>
            <TabsTrigger value="deleted" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-red-300/80 data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-md rounded-xl">
              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Deleted</span>
              <span className="md:hidden">Del</span>
              {deletedBookings.length > 0 && <span className="text-[10px]">({deletedBookings.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-sky-300/80 data-[state=active]:bg-white data-[state=active]:text-sky-700 data-[state=active]:shadow-md rounded-xl">
              <Archive className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Archive</span>
              <span className="md:hidden">Arc</span>
              {archivedCount > 0 && <span className="text-[10px]">({archivedCount})</span>}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 hidden lg:flex text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md rounded-xl">
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 hidden lg:flex text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md rounded-xl">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span>Customers</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md rounded-xl">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span>Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 hidden xl:flex text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md rounded-xl">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span>Apps</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 hidden xl:flex text-white/70 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-md rounded-xl">
              <Globe className="w-3 h-3 md:w-4 md:h-4" />
              <span>Marketing</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 hidden xl:flex text-violet-300/80 data-[state=active]:bg-white data-[state=active]:text-violet-700 data-[state=active]:shadow-md rounded-xl">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span>Import</span>
            </TabsTrigger>
          </TabsList>


          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
        
        {/* PROFESSIONAL STATS BAR - Clean white theme */}
        <ProfessionalStatsBar bookings={bookings} drivers={drivers} />
        
        {/* URGENT NOTIFICATIONS CENTER - Action required items */}
        <UrgentNotificationsCenter 
          bookings={bookings} 
          drivers={drivers}
          onAssignDriver={(booking) => {
            setSelectedBooking(booking);
            setShowBookingDetails(true);
          }}
          onViewBooking={(booking) => {
            setSelectedBooking(booking);
            setShowBookingDetails(true);
          }}
        />
        
        {/* Two Column Layout for Confirmations and Returns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CONFIRMATION STATUS PANEL - Track email/SMS confirmations */}
          <ConfirmationStatusPanel bookings={bookings} />
          
          {/* RETURNS OVERVIEW PANEL - All upcoming returns */}
          <ReturnsOverviewPanel 
            bookings={bookings}
            drivers={drivers}
            onViewBooking={(booking) => {
              setSelectedBooking(booking);
              setShowBookingDetails(true);
            }}
          />
        </div>
        
        {/* TODAY'S OPERATIONS - Unified view of all pickups */}
        <TodaysOperationsPanel 
          bookings={bookings} 
          onViewBooking={(booking) => {
            setSelectedBooking(booking);
            setShowBookingDetails(true);
          }}
        />
        
        {/* Stats Cards - Professional Light Theme */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Revenue (Confirmed)</p>
                <p className="text-3xl font-bold text-emerald-600">${stats.totalRevenue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{stats.confirmed + stats.completed} jobs</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, email, phone, or address... (also searches archive)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {searchTerm && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Archive className="w-3 h-3" />
                    Search includes archived bookings
                  </p>
                )}
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending_approval">🚨 Needs Approval</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-black"
              >
                Export CSV
              </Button>
              <Button 
                onClick={handleSendReminders}
                variant="outline"
                className="border-gold text-gold hover:bg-gold hover:text-black"
                title="Send reminders to tomorrow's bookings"
              >
                <Bell className="w-4 h-4 mr-2" />
                Send Reminders
              </Button>
              <Button 
                onClick={() => setShowCreateBookingModal(true)}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
              >
                + Create Booking
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No bookings found</p>
              </div>
            ) : (
            <>
              <div className="overflow-x-auto">
                {/* Bulk Action Bar */}
                {selectedBookings.size > 0 && (
                  <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-red-800">
                        {selectedBookings.size} booking{selectedBookings.size > 1 ? 's' : ''} selected
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBookings(new Set())}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Clear
                      </Button>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="p-2 w-8">
                        <button
                          onClick={() => {
                            if (selectedBookings.size === filteredBookings.length) {
                              setSelectedBookings(new Set());
                            } else {
                              setSelectedBookings(new Set(filteredBookings.map(b => b.id)));
                            }
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Select all"
                        >
                          {selectedBookings.size === filteredBookings.length && filteredBookings.length > 0 ? (
                            <CheckSquare className="w-4 h-4 text-gold" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs">Ref/Date</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs">Customer</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs hidden md:table-cell">Route</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs hidden lg:table-cell">✈️ Flight</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs hidden xl:table-cell">🔄 Return</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs">💰 Price</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs">🚗 Driver</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs">Status</th>
                      <th className="text-left p-2 font-semibold text-gray-700 text-xs">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => {
                      const hasReturn = booking.returnDate && booking.returnTime;
                      const isUnassigned = !booking.driver_id && !booking.driver_name && !booking.assignedDriver;
                      const isUrgentUnassigned = isToday(booking.date) && isUnassigned;
                      const flightNum = booking.flightNumber || booking.flight_number || '';
                      
                      return (
                      <tr key={booking.id} className={`border-b hover:bg-gray-50 transition-colors
                        ${selectedBookings.has(booking.id) ? 'bg-gold/10' : ''} 
                        ${isUrgentUnassigned ? 'bg-red-50 border-l-4 border-l-red-500' : ''}
                        ${!isUrgentUnassigned && isToday(booking.date) ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''} 
                        ${!isUrgentUnassigned && !isToday(booking.date) && isTomorrow(booking.date) ? 'border-l-4 border-l-orange-400 bg-orange-50/30' : ''}
                        ${hasReturn ? 'border-r-4 border-r-purple-400' : ''}
                      `}>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => {
                              const newSelected = new Set(selectedBookings);
                              if (newSelected.has(booking.id)) {
                                newSelected.delete(booking.id);
                              } else {
                                newSelected.add(booking.id);
                              }
                              setSelectedBookings(newSelected);
                            }}
                            className="p-0.5 hover:bg-gray-200 rounded"
                          >
                            {selectedBookings.has(booking.id) ? (
                              <CheckSquare className="w-4 h-4 text-gold" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                        {/* REF & DATE COLUMN */}
                        <td className="px-2 py-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-xs font-bold text-gold bg-gold/10 px-1.5 py-0.5 rounded">#{booking.referenceNumber || booking.id?.slice(0, 5)}</span>
                              {isToday(booking.date) && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-600 text-white rounded animate-pulse">TODAY</span>}
                              {isTomorrow(booking.date) && <span className="px-1.5 py-0.5 text-[9px] font-bold bg-orange-500 text-white rounded">TMR</span>}
                            </div>
                            <div className="text-xs text-gray-700 font-medium">{formatDate(booking.date)}</div>
                            <div className="text-sm font-bold text-gray-900">{booking.time}</div>
                          </div>
                        </td>
                        {/* CUSTOMER COLUMN */}
                        <td className="px-2 py-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">{booking.name}</span>
                            <a href={`tel:${booking.phone}`} className="text-xs text-blue-600 hover:underline">{booking.phone}</a>
                            <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{booking.email}</span>
                            {booking.passengers > 1 && (
                              <span className="text-[10px] bg-gray-100 px-1 rounded mt-0.5 w-fit">👥 {booking.passengers} pax</span>
                            )}
                          </div>
                        </td>
                        {/* ROUTE COLUMN */}
                        <td className="px-2 py-2 hidden md:table-cell">
                          <div className="flex flex-col text-[10px] max-w-[180px]">
                            <div className="flex items-start gap-1">
                              <span className="text-green-600 font-bold">↑</span>
                              <span className="text-gray-700 truncate" title={booking.pickupAddress}>{booking.pickupAddress?.slice(0, 35)}...</span>
                            </div>
                            <div className="flex items-start gap-1 mt-0.5">
                              <span className="text-red-600 font-bold">↓</span>
                              <span className="text-gray-700 truncate" title={booking.dropoffAddress}>{booking.dropoffAddress?.slice(0, 35)}...</span>
                            </div>
                          </div>
                        </td>
                        {/* FLIGHT COLUMN */}
                        <td className="px-2 py-2 hidden lg:table-cell">
                          {flightNum ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">✈️ {flightNum}</span>
                              {booking.pickupAddress?.toLowerCase().includes('international') && (
                                <span className="text-[9px] text-gray-500 mt-0.5">Int'l Terminal</span>
                              )}
                              {booking.pickupAddress?.toLowerCase().includes('domestic') && (
                                <span className="text-[9px] text-gray-500 mt-0.5">Domestic Terminal</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        {/* RETURN COLUMN */}
                        <td className="px-2 py-2 hidden xl:table-cell">
                          {hasReturn ? (
                            <div className="flex flex-col bg-purple-50 p-1.5 rounded border border-purple-200">
                              <span className="text-[10px] font-semibold text-purple-700">🔄 RETURN</span>
                              <span className="text-xs font-bold text-purple-900">{formatDate(booking.returnDate)}</span>
                              <span className="text-sm font-bold text-purple-800">{booking.returnTime}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        {/* PRICE & PAYMENT COLUMN */}
                        <td className="px-2 py-2">
                          <div className="flex flex-col items-start">
                            {inlinePriceBookingId === booking.id ? (
                              <div className="flex items-center gap-0.5">
                                <span className="text-xs text-gray-500">$</span>
                                <input
                                  type="number"
                                  value={inlinePriceValue}
                                  onChange={e => setInlinePriceValue(e.target.value)}
                                  className="w-14 h-6 text-sm font-bold border border-gold rounded px-1 focus:outline-none focus:ring-1 focus:ring-gold/50"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleInlinePriceSave(booking);
                                    if (e.key === 'Escape') setInlinePriceBookingId(null);
                                  }}
                                />
                                <button onClick={() => handleInlinePriceSave(booking)} className="text-green-600 hover:text-green-700 font-bold text-sm leading-none px-0.5" title="Save">✓</button>
                                <button onClick={() => setInlinePriceBookingId(null)} className="text-gray-400 hover:text-gray-600 font-bold text-sm leading-none px-0.5" title="Cancel">✕</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setInlinePriceBookingId(booking.id); setInlinePriceValue(booking.pricing?.totalPrice?.toFixed(2) || booking.totalPrice || '0'); }}
                                className="group flex items-center gap-0.5 hover:bg-gold/10 rounded px-1 py-0.5 -ml-1"
                                title="Tap to override price"
                              >
                                <span className="text-sm font-bold text-gray-900">${booking.pricing?.totalPrice?.toFixed(0) || booking.totalPrice || '0'}</span>
                                <Edit2 className="w-2.5 h-2.5 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                              booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                              booking.payment_status === 'cash' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {booking.payment_status === 'paid' ? '✓ PAID' : booking.payment_status === 'cash' ? '💵 CASH' : '✗ UNPAID'}
                            </span>
                          </div>
                        </td>
                        {/* DRIVER COLUMN */}
                        <td className="px-2 py-2">
                          {booking.driver_id || booking.driver_name || booking.assignedDriver ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-medium text-gray-900">{booking.driver_name?.split(' ')[0] || 'Assigned'}</span>
                                {booking.driverAcknowledged ? (
                                  <CheckCircle className="w-3.5 h-3.5 text-green-500" title="Driver confirmed" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" title="Awaiting confirmation" />
                                )}
                              </div>
                              <span className={`text-[9px] ${booking.driverAcknowledged ? 'text-green-600' : 'text-orange-600'}`}>
                                {booking.driverAcknowledged ? '✓ Confirmed' : '⏳ Pending'}
                              </span>
                            </div>
                          ) : (
                            <div className={`flex flex-col items-start ${isToday(booking.date) ? 'animate-pulse' : ''}`}>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${isToday(booking.date) ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {isToday(booking.date) ? '⚠️ ASSIGN!' : 'No Driver'}
                              </span>
                            </div>
                          )}
                        </td>
                        {/* STATUS COLUMN */}
                        <td className="px-2 py-2">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusUpdate(booking.id, value)}
                          >
                            <SelectTrigger className="w-24 h-7 text-[10px]">
                              <SelectValue>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getStatusColor(booking.status)}`}>
                                  {booking.status?.replace('_', ' ').slice(0,10)}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending_approval">🚨 Approval</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        {/* ACTIONS COLUMN */}
                        <td className="px-1 py-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openDetailsModal(booking)}
                              className="p-1.5 hover:bg-gray-100 rounded flex flex-col items-center"
                              title="View booking details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                              <span className="text-[8px] text-gray-500">View</span>
                            </button>
                            <button
                              onClick={() => openEditBookingModal(booking)}
                              className="p-1.5 hover:bg-blue-100 rounded flex flex-col items-center"
                              title="Edit booking details"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                              <span className="text-[8px] text-blue-500">Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowEmailModal(true);
                              }}
                              className="p-1.5 hover:bg-green-100 rounded flex flex-col items-center"
                              title="Send custom email (won't send SMS)"
                            >
                              <Mail className="w-4 h-4 text-green-600" />
                              <span className="text-[8px] text-green-500">Email</span>
                            </button>
                            <button
                              onClick={() => {
                                setSmsModal(booking);
                                setSmsPhone(booking.driver_phone || '');
                              }}
                              className="p-1.5 hover:bg-purple-100 rounded flex flex-col items-center"
                              title="Send booking details to driver via SMS"
                            >
                              <Smartphone className="w-4 h-4 text-purple-600" />
                              <span className="text-[8px] text-purple-500">Driver</span>
                            </button>
                            <button
                              onClick={() => handleResendConfirmation(booking.id)}
                              className="p-1.5 hover:bg-amber-100 rounded flex flex-col items-center border border-amber-200"
                              title="⚠️ Resend confirmation EMAIL + SMS to customer"
                            >
                              <RefreshCw className="w-4 h-4 text-amber-600" />
                              <span className="text-[8px] text-amber-600 font-medium">Resend</span>
                            </button>
                            {booking.status === 'completed' && (
                              <button
                                onClick={() => handleArchiveBooking(booking.id)}
                                className="p-1.5 hover:bg-blue-100 rounded flex flex-col items-center border border-blue-200"
                                title="Archive this completed booking"
                              >
                                <Archive className="w-4 h-4 text-blue-600" />
                                <span className="text-[8px] text-blue-600 font-medium">Archive</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteBooking(booking.id, booking.name, true)}
                              className="p-1.5 hover:bg-red-100 rounded flex flex-col items-center"
                              title="Cancel & notify customer via email/SMS"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                              <span className="text-[8px] text-red-500">Cancel</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(booking.id, booking.name, false)}
                              className="p-1.5 hover:bg-gray-200 rounded flex flex-col items-center"
                              title="Silent delete - NO notification to customer (use for duplicates)"
                            >
                              <XCircle className="w-4 h-4 text-gray-500" />
                              <span className="text-[8px] text-gray-500">Silent</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Load More Button - showing if more bookings available */}
              {bookings.length >= bookingsPerPage * currentPage && (
                <div className="flex justify-center mt-4 pb-4">
                  <Button
                    onClick={loadMoreBookings}
                    disabled={isLoadingMore}
                    variant="outline"
                    className="px-8"
                  >
                    {isLoadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>Load More Bookings</>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Archived Search Results - shown when searching */}
              {searchTerm && archiveSearchResults.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Archive className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-blue-800">
                      Found {archiveSearchResults.length} match(es) in Archive
                    </h4>
                  </div>
                  <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-blue-100 text-blue-800 text-xs">
                          <th className="px-3 py-2 text-left">Ref #</th>
                          <th className="px-3 py-2 text-left">Customer</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {archiveSearchResults.map((booking) => (
                          <tr key={booking.id} className="border-b border-blue-100 hover:bg-blue-50/50 bg-white">
                            <td className="px-3 py-2 font-medium text-blue-700">#{booking.referenceNumber}</td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-900">{booking.name}</div>
                              <div className="text-xs text-gray-500">{booking.phone}</div>
                            </td>
                            <td className="px-3 py-2">
                              <div className="text-gray-800">{formatDate(booking.date)}</div>
                              <div className="text-xs text-gray-500">{booking.time}</div>
                            </td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">ARCHIVED</span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => openDetailsModal(booking)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  onClick={() => handleUnarchiveBooking(booking.id)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  size="sm"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Restore
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Pagination Info - always visible */}
              <div className="text-center text-sm text-gray-500 pb-2">
                Showing {filteredBookings.length} of {totalBookings || bookings.length} bookings
                {archiveSearchResults.length > 0 && ` + ${archiveSearchResults.length} from archive`}
              </div>
            </>
            )}
          </CardContent>
        </Card>
        </TabsContent>

          {/* Shuttle Service Tab */}
          <TabsContent value="shuttle" className="space-y-6">
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">

                    <Bus className="w-8 h-8 text-yellow-600" />
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Shared Shuttle Service</h3>
                      <p className="text-sm text-gray-600">Auckland CBD → Airport (Every 2 Hours)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="date" 
                      value={shuttleDate} 
                      onChange={(e) => {
                        setShuttleDate(e.target.value);
                        fetchShuttleData(e.target.value);
                      }}
                      className="w-40"
                    />
                    <Button 
                      onClick={() => fetchShuttleData(shuttleDate)}
                      variant="outline"
                      disabled={loadingShuttle}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loadingShuttle ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>

                {/* Departure Times Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shuttleData.departures && Object.entries(shuttleData.departures).map(([time, data]) => (
                    <div 
                      key={time} 
                      className={`p-4 rounded-lg border-2 ${
                        data.totalPassengers > 0 
                          ? 'bg-white border-yellow-500 shadow-md' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-lg font-bold text-gray-800">
                            {time.replace(':00', ':00').replace(/(\d{2}):(\d{2})/, (m, h, min) => {
                              const hour = parseInt(h);
                              const ampm = hour >= 12 ? 'PM' : 'AM';
                              const hour12 = hour % 12 || 12;
                              return `${hour12}:${min} ${ampm}`;
                            })}
                          </p>
                          <p className="text-sm text-gray-500">{shuttleDate}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          data.totalPassengers >= 6 ? 'bg-green-100 text-green-800' :
                          data.totalPassengers >= 3 ? 'bg-yellow-100 text-yellow-800' :
                          data.totalPassengers > 0 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {data.totalPassengers || 0} pax
                        </div>
                      </div>

                      {data.bookings && data.bookings.length > 0 ? (
                        <>
                          <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                            {data.bookings.map((booking, idx) => (
                              <div key={idx} className="text-xs bg-gray-100 rounded p-2">
                                <div className="font-medium">{booking.name} ({booking.passengers})</div>
                                <div className="text-gray-500 truncate">{booking.pickupAddress}</div>
                                <div className="text-gray-400">{booking.phone}</div>
                                {booking.arrivingSoonSent && (
                                  <div className="text-green-600 text-xs mt-1">✓ Notified</div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center text-sm mb-3">
                            <span className="text-gray-600">Est. Revenue:</span>
                            <span className="font-bold text-green-600">${data.totalRevenue || 0}</span>
                          </div>
                          
                          {/* Driver Assignment - triggers auto SMS when assigned */}
                          <div className="mb-3">
                            <label className="text-xs text-gray-600 mb-1 block">Assign Driver:</label>
                            <select
                              className="w-full text-sm border border-gray-300 rounded px-2 py-2 bg-white"
                              value={data.assignedDriverId || ''}
                              onChange={(e) => assignShuttleDriver(shuttleDate, time, e.target.value)}
                            >
                              <option value="">Select driver...</option>
                              {drivers.map(driver => (
                                <option key={driver.id} value={driver.id}>{driver.name}</option>
                              ))}
                            </select>
                            {data.assignedDriverName && (
                              <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                {data.assignedDriverName} assigned - SMS scheduled!
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => getShuttleRoute(shuttleDate, time)}
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Route
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => captureShuttlePayments(shuttleDate, time)}
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Charge All
                            </Button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No bookings yet</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pricing Info */}
                <div className="mt-6 p-4 bg-white rounded-lg border">
                  <h4 className="font-semibold text-gray-700 mb-2">Dynamic Pricing Tiers</h4>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded">1-2 pax: $100/ea</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">3 pax: $70/ea</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">4 pax: $55/ea</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">5 pax: $45/ea</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">6 pax: $40/ea</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">7+ pax: $35-25/ea</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💳 Cards are authorized at booking, charged when shuttle arrives at airport
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers">
            <DriversTab />
          </TabsContent>

          {/* Driver Applications Tab */}
          <TabsContent value="applications">
            <DriverApplicationsTab />
          </TabsContent>

          {/* Marketing Tab - Landing Pages & Social */}
          <TabsContent value="marketing">
            <LandingPagesTab />
          </TabsContent>

          {/* Deleted Bookings Tab */}
          <TabsContent value="deleted" className="space-y-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-800">Recently Deleted Bookings</h3>
                </div>
                <p className="text-sm text-red-700 mb-4">
                  These bookings have been deleted but can be restored. They will be kept for 30 days before permanent deletion.
                </p>
                
                {loadingDeleted ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading deleted bookings...</p>
                  </div>
                ) : deletedBookings.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border border-red-100">
                    <Trash2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No deleted bookings</p>
                    <p className="text-sm text-gray-400">Bookings you delete will appear here for recovery</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deletedBookings.map((booking) => (
                      <div key={booking.id} className="bg-white p-4 rounded-lg border border-red-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900">{booking.customerName || booking.name}</h4>
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">DELETED</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="text-gray-400">Date:</span> {formatDate(booking.date)} {booking.time}
                              </div>
                              <div>
                                <span className="text-gray-400">Phone:</span> {booking.phone}
                              </div>
                              <div>
                                <span className="text-gray-400">Total:</span> ${booking.totalPrice || booking.total_price}
                              </div>
                              <div>
                                <span className="text-gray-400">Deleted:</span> {new Date(booking.deletedAt).toLocaleDateString('en-NZ')}
                              </div>
                            </div>
                            <div className="mt-2 text-sm">
                              <span className="text-gray-400">Pickup:</span> <span className="text-gray-600">{booking.pickup || booking.pickupAddress}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-400">Dropoff:</span> <span className="text-gray-600">{booking.dropoff || booking.dropoffAddress}</span>
                            </div>
                            {booking.deletedBy && (
                              <div className="mt-1 text-xs text-gray-400">
                                Deleted by: {booking.deletedBy}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              onClick={() => handleRestoreBooking(booking.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              size="sm"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                            <Button
                              onClick={() => handlePermanentDelete(booking.id)}
                              variant="destructive"
                              size="sm"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete Forever
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Archive Tab - Long-term booking storage (7 years retention) */}
          <TabsContent value="archive" className="space-y-6">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Archive className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Archived Bookings</h3>
                      <p className="text-sm text-blue-600">{archivedCount} bookings stored • 7-year retention • Auto-archives daily at 2 AM</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRunAutoArchive}
                    disabled={runningAutoArchive}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    {runningAutoArchive ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Archiving...
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4 mr-2" />
                        Run Auto-Archive Now
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Search Bar */}
                <form onSubmit={handleArchiveSearch} className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by name, email, phone, or reference #..."
                      value={archiveSearchTerm}
                      onChange={(e) => setArchiveSearchTerm(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  {archiveSearchTerm && (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => {
                        setArchiveSearchTerm('');
                        fetchArchivedBookings(1, '');
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </form>

                {loadingArchived ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                    <p className="text-gray-500 mt-2">Loading archived bookings...</p>
                  </div>
                ) : archivedBookings.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-lg border border-blue-100">
                    <Archive className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">No archived bookings found</p>
                    <p className="text-sm text-gray-400">
                      {archiveSearchTerm ? 'Try a different search term' : 'Archive completed bookings to move them here'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-blue-100 text-blue-800">
                            <th className="px-3 py-2 text-left">Ref #</th>
                            <th className="px-3 py-2 text-left">Customer</th>
                            <th className="px-3 py-2 text-left">Date</th>
                            <th className="px-3 py-2 text-left">Route</th>
                            <th className="px-3 py-2 text-left">Total</th>
                            <th className="px-3 py-2 text-left">Archived</th>
                            <th className="px-3 py-2 text-left">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivedBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-blue-100 hover:bg-blue-50/50 bg-white">
                              <td className="px-3 py-3 font-medium text-blue-700">#{booking.referenceNumber}</td>
                              <td className="px-3 py-3">
                                <div className="font-medium text-gray-900">{booking.name}</div>
                                <div className="text-xs text-gray-500">{booking.email}</div>
                                <div className="text-xs text-gray-500">{booking.phone}</div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-medium">{formatDate(booking.date)}</div>
                                <div className="text-xs text-gray-500">{booking.time}</div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="text-xs text-gray-600 truncate max-w-[200px]" title={booking.pickupAddress}>
                                  📍 {booking.pickupAddress}
                                </div>
                                <div className="text-xs text-gray-600 truncate max-w-[200px]" title={booking.dropoffAddress}>
                                  🎯 {booking.dropoffAddress}
                                </div>
                              </td>
                              <td className="px-3 py-3 font-medium text-green-700">
                                ${(booking.pricing?.totalPrice || booking.totalPrice || 0).toFixed(2)}
                              </td>
                              <td className="px-3 py-3 text-xs text-gray-500">
                                {booking.archivedAt ? new Date(booking.archivedAt).toLocaleDateString('en-NZ') : 'N/A'}
                              </td>
                              <td className="px-3 py-3">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => openDetailsModal(booking)}
                                    variant="ghost"
                                    size="sm"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    onClick={() => handleUnarchiveBooking(booking.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                    title="Restore to Active Bookings"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-1" />
                                    Restore
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {archiveTotalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 mt-4">
                        <Button
                          onClick={() => fetchArchivedBookings(archivePage - 1, archiveSearchTerm)}
                          disabled={archivePage <= 1}
                          variant="outline"
                          size="sm"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-gray-600">
                          Page {archivePage} of {archiveTotalPages}
                        </span>
                        <Button
                          onClick={() => fetchArchivedBookings(archivePage + 1, archiveSearchTerm)}
                          disabled={archivePage >= archiveTotalPages}
                          variant="outline"
                          size="sm"
                        >
                          Next
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Import Tab */}
          <TabsContent value="import" className="space-y-6">
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-purple-800">Import WordPress Bookings</h3>
                </div>
                <p className="text-sm text-purple-700 mb-6">
                  Import historical bookings from your WordPress Chauffeur Booking System. This preserves original booking IDs for cross-reference and won't send notifications for imported bookings.
                </p>
                
                <ImportBookingsSection 
                  onSuccess={() => {
                    fetchBookings();
                    toast.success('Bookings imported successfully!');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-6">
              {/* Booking Status & Payment Banner */}
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gold">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-600">Booking Status</span>
                    <p className={`font-semibold text-sm mt-1 ${
                      selectedBooking.status === 'confirmed' ? 'text-green-600' : 
                      selectedBooking.status === 'completed' ? 'text-blue-600' : 
                      selectedBooking.status === 'cancelled' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {selectedBooking.status?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Payment Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                        selectedBooking.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-700' 
                          : selectedBooking.payment_status === 'cash'
                          ? 'bg-yellow-100 text-yellow-700'
                          : selectedBooking.payment_status === 'pay-on-pickup'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {selectedBooking.payment_status === 'paid' && '✓ '}
                        {selectedBooking.payment_status === 'cash' && '💵 '}
                        {selectedBooking.payment_status === 'pay-on-pickup' && '🚗 '}
                        {selectedBooking.payment_status === 'unpaid' && '✗ '}
                        <span className="uppercase">{selectedBooking.payment_status?.replace('-', ' ') || 'UNPAID'}</span>
                      </span>
                      <div className="flex gap-1">
                        <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                          <SelectTrigger className="h-7 text-xs w-[100px]">
                            <SelectValue placeholder="Change" />
                          </SelectTrigger>
                          <SelectContent className="z-[9999]">
                            <SelectItem value="paid">✓ Paid</SelectItem>
                            <SelectItem value="cash">💵 Cash</SelectItem>
                            <SelectItem value="pay-on-pickup">🚗 Pay on Pickup</SelectItem>
                            <SelectItem value="xero-invoiced">📄 Xero Invoiced</SelectItem>
                            <SelectItem value="unpaid">✗ Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm"
                          onClick={handleUpdatePaymentStatus}
                          disabled={!selectedPaymentStatus}
                          className="h-7 px-2 text-xs bg-gold hover:bg-gold/90 text-black"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{selectedBooking.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{selectedBooking.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{selectedBooking.phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Passengers:</span>
                    <p className="font-medium">{selectedBooking.passengers}</p>
                  </div>
                </div>
              </div>

              {/* Trip Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Service:</span>
                    <p className="font-medium">{selectedBooking.serviceType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Pickup Addresses:</span>
                    <div className="font-medium space-y-1">
                      <p className="flex items-start">
                        <span className="text-blue-600 mr-2">1.</span>
                        <span>{selectedBooking.pickupAddress}</span>
                      </p>
                      {selectedBooking.pickupAddresses && selectedBooking.pickupAddresses.length > 0 && 
                        selectedBooking.pickupAddresses.map((addr, idx) => addr && (
                          <p key={idx} className="flex items-start">
                            <span className="text-blue-600 mr-2">{idx + 2}.</span>
                            <span>{addr}</span>
                          </p>
                        ))
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Drop-off:</span>
                    <p className="font-medium">{selectedBooking.dropoffAddress}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">{formatDate(selectedBooking.date)}</p>
                      <p className="text-sm text-blue-600 font-medium">{getDayOfWeek(selectedBooking.date)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Time:</span>
                      <p className="font-medium">{selectedBooking.time}</p>
                    </div>
                  </div>
                  
                  {/* Return Trip Info - Inline */}
                  {selectedBooking.bookReturn && (
                    <div className="mt-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm">
                        🔄 Return Trip
                      </h4>
                      <div className="text-sm">
                        <p className="text-gray-600 text-xs italic mb-2">
                          Reverse: {selectedBooking.dropoffAddress?.split(',')[0]} → {selectedBooking.pickupAddress?.split(',')[0]}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 text-xs">Return Date:</span>
                            <p className="font-medium">{formatDate(selectedBooking.returnDate)}</p>
                            <p className="text-xs text-blue-600 font-medium">{getDayOfWeek(selectedBooking.returnDate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Return Time:</span>
                            <p className="font-medium">{selectedBooking.returnTime}</p>
                          </div>
                        </div>
                        {/* Return Flight Numbers */}
                        {(selectedBooking.returnDepartureFlightNumber || selectedBooking.returnFlightNumber || selectedBooking.returnArrivalFlightNumber) && (
                          <div className="mt-3 pt-3 border-t border-amber-200">
                            <span className="text-gray-500 text-xs font-medium">✈️ Return Flight Info:</span>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {(selectedBooking.returnDepartureFlightNumber || selectedBooking.returnFlightNumber) && (
                                <div>
                                  <span className="text-gray-500 text-xs">Flight Number:</span>
                                  <p className="font-medium text-blue-700">{selectedBooking.returnDepartureFlightNumber || selectedBooking.returnFlightNumber}</p>
                                </div>
                              )}
                              {selectedBooking.returnArrivalFlightNumber && (
                                <div>
                                  <span className="text-gray-500 text-xs">Arrival Flight:</span>
                                  <p className="font-medium text-blue-700">{selectedBooking.returnArrivalFlightNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {!selectedBooking.returnDepartureFlightNumber && !selectedBooking.returnFlightNumber && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                            ⚠️ No return flight number provided - follow up required
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Flight Info */}
              {(selectedBooking.flightArrivalNumber || selectedBooking.flightDepartureNumber || selectedBooking.flightNumber) && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✈️ Flight Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Show flightNumber from WordPress imports */}
                    {selectedBooking.flightNumber && !selectedBooking.flightArrivalNumber && !selectedBooking.flightDepartureNumber && (
                      <div>
                        <span className="text-gray-600">Flight:</span>
                        <p className="font-medium">{selectedBooking.flightNumber}</p>
                      </div>
                    )}
                    {selectedBooking.flightArrivalNumber && (
                      <div>
                        <span className="text-gray-600">Arrival Flight:</span>
                        <p className="font-medium">{selectedBooking.flightArrivalNumber}</p>
                        {selectedBooking.flightArrivalTime && <p className="text-xs text-gray-500">Arrival: {selectedBooking.flightArrivalTime}</p>}
                      </div>
                    )}
                    {selectedBooking.flightDepartureNumber && (
                      <div>
                        <span className="text-gray-600">Departure Flight:</span>
                        <p className="font-medium">{selectedBooking.flightDepartureNumber}</p>
                        {selectedBooking.flightDepartureTime && <p className="text-xs text-gray-500">Departure: {selectedBooking.flightDepartureTime}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Pricing Details</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  {selectedBooking.pricing?.distance && (
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{selectedBooking.pricing.distance} km</span>
                    </div>
                  )}
                  {selectedBooking.pricing?.basePrice != null && (
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">${selectedBooking.pricing.basePrice.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.pricing?.airportFee > 0 && (
                    <div className="flex justify-between">
                      <span>Airport Fee:</span>
                      <span className="font-medium">${selectedBooking.pricing.airportFee.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedBooking.pricing?.passengerFee > 0 && (
                    <div className="flex justify-between">
                      <span>Passenger Fee:</span>
                      <span className="font-medium">${selectedBooking.pricing.passengerFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold text-base">
                    <span>Total:</span>
                    <span className="text-gold">${selectedBooking.pricing?.totalPrice?.toFixed(2) || selectedBooking.totalPrice?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {/* Price Override */}
                <div className="mt-4">
                  <Label>Override Price</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={priceOverride}
                      onChange={(e) => setPriceOverride(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handlePriceOverride} className="bg-gold hover:bg-gold/90 text-black">
                      Update Price
                    </Button>
                  </div>
                </div>
              </div>

              {/* Driver Assignment - OUTBOUND */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  🚗 Outbound Driver {selectedBooking.bookReturn && <span className="text-sm font-normal text-gray-500">(One-way to destination)</span>}
                </h3>
                {(selectedBooking.driver_id || selectedBooking.driver_name) ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Assigned Driver</p>
                        <p className="font-medium text-gray-900">
                          {drivers.find(d => d.id === selectedBooking.driver_id)?.name || selectedBooking.driver_name || 'Unknown Driver'}
                        </p>
                        <p className="text-xs text-gray-500">{selectedBooking.driver_phone}</p>
                        {/* Driver Acknowledgment Status */}
                        {selectedBooking.driverAcknowledged ? (
                          <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Driver confirmed receipt
                          </p>
                        ) : (
                          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1 animate-pulse">
                            <Clock className="w-3 h-3" /> Awaiting driver confirmation...
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          size="sm"
                          onClick={() => handleSendTrackingLink(selectedBooking.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                          title="Sends SMS to driver with tracking link"
                        >
                          📍 Send Tracking Link to Driver
                        </Button>
                        <p className="text-[10px] text-gray-500 italic">Sends SMS to driver only</p>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnassignDriver('outbound')}
                          className="text-red-600 hover:bg-red-50 border-red-200"
                        >
                          ✕ Unassign Driver
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">No outbound driver assigned yet</p>
                    <div className="flex gap-2">
                      <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a driver..." />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] bg-white">
                          {drivers.filter(d => d.status === 'active').length === 0 ? (
                            <SelectItem value="no-drivers" disabled>No active drivers</SelectItem>
                          ) : (
                            drivers.filter(d => d.status === 'active').map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.name} - {driver.phone}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 mb-1 block">Driver Payout (optional)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                          <input
                            type="number"
                            placeholder="Auto-calculated"
                            value={driverPayoutOverride}
                            onChange={(e) => setDriverPayoutOverride(e.target.value)}
                            className="w-full pl-7 pr-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={() => handleShowAssignPreview('outbound')}
                        disabled={!selectedDriver}
                        className="bg-gold hover:bg-gold/90 text-black mt-5"
                      >
                        Preview & Assign
                      </Button>
                    </div>
                    <p className="text-[10px] text-gray-400">Leave blank to auto-calculate (after Stripe fees only)</p>
                  </div>
                )}
              </div>

              {/* Driver Assignment - RETURN (only if return trip booked) */}
              {selectedBooking.bookReturn && (
                <div className="mt-4 pt-4 border-t border-dashed">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    🔄 Return Driver <span className="text-sm font-normal text-gray-500">(Return on {formatDate(selectedBooking.returnDate)} at {selectedBooking.returnTime})</span>
                  </h3>
                  {selectedBooking.return_driver_id ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Return Trip Driver</p>
                          <p className="font-medium text-gray-900">
                            {drivers.find(d => d.id === selectedBooking.return_driver_id)?.name || selectedBooking.return_driver_name || 'Unknown Driver'}
                          </p>
                          <p className="text-xs text-gray-500">{selectedBooking.return_driver_phone}</p>
                          {/* Return Driver Acknowledgment Status */}
                          {selectedBooking.returnDriverAcknowledged ? (
                            <p className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Driver confirmed receipt
                            </p>
                          ) : (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1 animate-pulse">
                              <Clock className="w-3 h-3" /> Awaiting driver confirmation...
                            </p>
                          )}
                        </div>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnassignDriver('return')}
                          className="text-red-600 hover:bg-red-50 border-red-200"
                        >
                          ✕ Unassign Return Driver
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                        ⚠️ No return driver assigned yet - assign closer to return date
                      </p>
                      <div className="flex gap-2">
                        <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select return driver..." />
                          </SelectTrigger>
                          <SelectContent className="z-[9999] bg-white">
                            {drivers.filter(d => d.status === 'active').length === 0 ? (
                              <SelectItem value="no-drivers" disabled>No active drivers</SelectItem>
                            ) : (
                              drivers.filter(d => d.status === 'active').map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.name} - {driver.phone}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">Return Driver Payout (optional)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                              type="number"
                              placeholder="Auto-calculated"
                              value={driverPayoutOverride}
                              onChange={(e) => setDriverPayoutOverride(e.target.value)}
                              className="w-full pl-7 pr-3 py-2 border rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleShowAssignPreview('return')}
                          disabled={!selectedDriver}
                          className="bg-blue-600 hover:bg-blue-700 text-white mt-5"
                        >
                          Preview & Assign Return
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Special Requests</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Xero Accounting */}
              {xeroConnected && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold text-gray-900 mb-3">💰 Xero Accounting</h3>
                  {selectedBooking.xero_invoice_id ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-green-800">Invoice #{selectedBooking.xero_invoice_number}</p>
                          <p className="text-xs text-green-600">Status: {selectedBooking.xero_status || 'Created'}</p>
                        </div>
                        {selectedBooking.xero_status !== 'PAID' && (
                          <Button
                            onClick={() => recordXeroPayment(selectedBooking.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Mark as Paid
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-500">Invoice Date (backdate if needed)</Label>
                          <CustomDatePicker
                            selected={xeroInvoiceDate || (selectedBooking.date ? new Date(selectedBooking.date + 'T00:00:00') : new Date())}
                            onChange={(date) => setXeroInvoiceDate(date)}
                            minDate={new Date('2020-01-01')}
                            maxDate={new Date('2030-12-31')}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            placeholder="Select invoice date"
                          />
                        </div>
                        <Button
                          onClick={() => {
                            const dateToUse = xeroInvoiceDate || (selectedBooking.date ? new Date(selectedBooking.date + 'T00:00:00') : new Date());
                            const formattedDate = dateToUse.toISOString().split('T')[0];
                            createXeroInvoice(selectedBooking.id, formattedDate);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Create Invoice
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        💡 Use month/year dropdowns to easily select past dates for backdating
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Admin Actions */}
              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleSendToAdmin(selectedBooking.id)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Booking Details to Admin Mailbox
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This will send a complete summary of this booking to the admin email address
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Driver Assignment Preview Modal */}
      <Dialog open={showDriverAssignPreview} onOpenChange={setShowDriverAssignPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📋 Confirm Driver Assignment</DialogTitle>
          </DialogHeader>
          {pendingAssignment && selectedBooking && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm"><strong>Booking:</strong> #{selectedBooking.referenceNumber} - {selectedBooking.name}</p>
                <p className="text-sm"><strong>Date:</strong> {formatDate(selectedBooking.date)} at {selectedBooking.time}</p>
                <p className="text-sm"><strong>Trip:</strong> {pendingAssignment.tripType === 'return' ? 'Return Trip' : 'Outbound Trip'}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600">Assigning to:</p>
                <p className="font-bold text-lg">{pendingAssignment.driver?.name}</p>
                <p className="text-sm text-gray-500">{pendingAssignment.driver?.phone}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600">Driver will see payout of:</p>
                <p className="font-bold text-2xl text-green-700">${pendingAssignment.driverPayout?.toFixed(2)}</p>
                {pendingAssignment.isOverride ? (
                  <p className="text-xs text-green-600 mt-1">✓ Custom payout set</p>
                ) : (
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <p>Auto-calculated:</p>
                    {pendingAssignment.hasReturn && (
                      <p>• {pendingAssignment.tripType === 'outbound' ? 'Outbound' : 'Return'} portion of return booking</p>
                    )}
                    <p>• <span className="text-green-600 font-medium">Full amount (customer pays Stripe fee)</span></p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDriverAssignPreview(false);
                    setPendingAssignment(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConfirmAssignDriver}
                >
                  ✓ Confirm & Send to Driver
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SMS to Driver Modal */}
      <Dialog open={!!smsModal} onOpenChange={(open) => { if (!open) { setSmsModal(null); setSmsPhone(''); } }}>
        <DialogContent className="max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              Send to Driver — #{smsModal?.referenceNumber}
            </DialogTitle>
          </DialogHeader>
          {smsModal && (
            <div className="space-y-4">
              {/* Saved drivers with phone numbers */}
              {drivers.filter(d => d.phone).length > 0 && (
                <div>
                  <Label className="text-xs text-gray-500 mb-2 block">Saved Drivers</Label>
                  <div className="flex flex-wrap gap-2">
                    {drivers.filter(d => d.phone).map(d => (
                      <button
                        key={d._id || d.id || d.name}
                        onClick={() => setSmsPhone(d.phone)}
                        className={`text-xs px-3 py-2 rounded-lg border transition-colors ${smsPhone === d.phone ? 'bg-gold border-gold text-black font-semibold' : 'bg-gray-50 border-gray-200 hover:border-gold/50 text-gray-700'}`}
                      >
                        {d.name?.split(' ')[0]} · {d.phone}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {/* Manual phone entry */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Driver Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+64 21 ..."
                  value={smsPhone}
                  onChange={e => setSmsPhone(e.target.value)}
                  className="text-sm"
                />
              </div>
              {/* Message preview */}
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Message Preview</Label>
                <pre className="text-xs bg-gray-50 border rounded-lg p-3 whitespace-pre-wrap text-gray-700 max-h-44 overflow-auto font-mono">
                  {buildSmsMessage(smsModal)}
                </pre>
              </div>
              <Button
                onClick={openSmsApp}
                disabled={!smsPhone}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12 text-base"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Open SMS App
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email Modal */}
      <Dialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Email to Customer</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <Label>To:</Label>
                <Input value={selectedBooking.email} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label>CC (optional):</Label>
                <Input
                  value={emailCC}
                  onChange={(e) => setEmailCC(e.target.value)}
                  placeholder="Additional email addresses (comma separated)"
                />
              </div>
              <div>
                <Label>Subject:</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              <div>
                <Label>Message:</Label>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Email message"
                  rows={10}
                />
              </div>
              <Button onClick={handleSendEmail} className="w-full bg-gold hover:bg-gold/90 text-black">
                <Mail className="w-4 h-4 mr-2" />
                Send Email
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={(open) => {
        setShowPasswordModal(open);
        if (!open) {
          setSetPasswordMode(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{setPasswordMode ? 'Set New Password' : 'Change Password'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {!setPasswordMode && (
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-1"
                />
                <button
                  type="button"
                  onClick={() => setSetPasswordMode(true)}
                  className="text-sm text-gold hover:text-gold/80 mt-1"
                >
                  Forgot current password? Set a new one instead.
                </button>
              </div>
            )}
            {setPasswordMode && (
              <p className="text-sm text-gray-600">
                You&apos;re logged in. Set a new password below (no current password needed).
              </p>
            )}
            
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              {setPasswordMode && (
                <Button
                  variant="ghost"
                  onClick={() => setSetPasswordMode(false)}
                >
                  Back
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  setSetPasswordMode(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                className="bg-gold hover:bg-gold/90 text-black"
              >
                {setPasswordMode ? 'Set Password' : 'Change Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Booking Modal */}
      <Dialog open={showCreateBookingModal} onOpenChange={setShowCreateBookingModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Customer Search & Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
              
              {/* Customer Search Autocomplete */}
              <div className="mb-4 relative" ref={customerSearchRef}>
                <Label className="text-amber-600 font-medium">🔍 Search Existing Customer</Label>
                <div className="relative mt-1">
                  <Input
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      if (!e.target.value) {
                        setShowCustomerDropdown(false);
                      }
                    }}
                    placeholder="Type customer name, email, or phone to search..."
                    className="pr-10"
                  />
                  {searchingCustomers && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Customer Search Results Dropdown */}
                {showCustomerDropdown && customerSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {customerSearchResults.map((customer, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 hover:bg-amber-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                            <p className="text-sm text-gray-500">{customer.phone}</p>
                          </div>
                          <div className="text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              {customer.totalBookings} bookings
                            </span>
                            {customer.lastBookingDate && (
                              <p className="text-xs text-gray-400 mt-1">Last: {customer.lastBookingDate}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Start typing to find existing customers</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={newBooking.name}
                    onChange={(e) => setNewBooking(prev => ({...prev, name: e.target.value}))}
                    placeholder="Customer name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={newBooking.email}
                    onChange={(e) => setNewBooking(prev => ({...prev, email: e.target.value}))}
                    placeholder="customer@example.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>CC Email (optional)</Label>
                  <Input
                    type="email"
                    value={newBooking.ccEmail}
                    onChange={(e) => setNewBooking(prev => ({...prev, ccEmail: e.target.value}))}
                    placeholder="copy@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">Send copy of confirmation to this email</p>
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input
                    value={newBooking.phone}
                    onChange={(e) => setNewBooking(prev => ({...prev, phone: e.target.value}))}
                    placeholder="+64 21 XXX XXXX"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Service Type *</Label>
                  <Select 
                    value={newBooking.serviceType} 
                    onValueChange={(value) => setNewBooking(prev => ({...prev, serviceType: value}))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="airport-shuttle">Airport Shuttle</SelectItem>
                      <SelectItem value="private-transfer">Private Shuttle Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Method *</Label>
                  <Select 
                    value={newBooking.paymentMethod} 
                    onValueChange={(value) => setNewBooking(prev => ({...prev, paymentMethod: value}))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">💳 Stripe - Send Payment Link</SelectItem>
                      <SelectItem value="paypal">🅿️ PayPal - Send Payment Link</SelectItem>
                      <SelectItem value="xero">📄 Xero - Send Invoice</SelectItem>
                      <SelectItem value="pay-on-pickup">💵 Pay on Pickup (Cash)</SelectItem>
                      <SelectItem value="card">✅ Card (Already Paid)</SelectItem>
                      <SelectItem value="bank-transfer">🏦 Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                  {(newBooking.paymentMethod === 'stripe' || newBooking.paymentMethod === 'paypal') && (
                    <p className="text-xs text-gold mt-1">
                      A payment link will be sent to the customer's email after booking is created.
                    </p>
                  )}
                  {newBooking.paymentMethod === 'xero' && (
                    <p className="text-xs text-purple-600 mt-1">
                      📄 An invoice will be created in Xero and emailed to the customer automatically.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
              <div className="space-y-4">
                <div>
                  <Label>Pickup Address 1 *</Label>
                  <GeoapifyAutocomplete
                    value={newBooking.pickupAddress}
                    onChange={(v) => setNewBooking(prev => ({...prev, pickupAddress: v}))}
                    onSelect={(addr) => setNewBooking(prev => ({...prev, pickupAddress: addr}))}
                    placeholder="Start typing address..."
                    className="mt-1"
                  />
                </div>

                {/* Additional Pickup Addresses */}
                {newBooking.pickupAddresses.map((pickup, index) => (
                  <div key={index} className="relative">
                    <Label>Pickup Address {index + 2}</Label>
                    <div className="flex gap-2 mt-1">
                      <GeoapifyAutocomplete
                        value={pickup}
                        onChange={(v) => handlePickupAddressChange(index, v)}
                        onSelect={(addr) => handlePickupAddressChange(index, addr)}
                        placeholder="Start typing address..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleRemovePickup(index)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Pickup Button - Elegant Design */}
                <div>
                  <button
                    type="button"
                    onClick={handleAddPickup}
                    className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border-2 border-dashed border-gold/40 hover:border-gold/60 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] hover:shadow-md"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/20 group-hover:bg-gold/30 transition-colors">
                      <MapPin className="w-4 h-4 text-gold" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                      Add Another Pickup Location
                    </span>
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gold text-white text-xs font-bold group-hover:scale-110 transition-transform">
                      +
                    </div>
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Add multiple pickup locations for shared rides or multi-stop trips
                  </p>
                </div>

                <div>
                  <Label>Drop-off Address *</Label>
                  <GeoapifyAutocomplete
                    value={newBooking.dropoffAddress}
                    onChange={(v) => setNewBooking(prev => ({...prev, dropoffAddress: v}))}
                    onSelect={(addr) => setNewBooking(prev => ({...prev, dropoffAddress: addr}))}
                    placeholder="Start typing address..."
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Date * (can backdate for invoicing)</Label>
                    <div className="mt-1">
                      <CustomDatePicker
                        selected={adminPickupDate}
                        onChange={(date) => {
                          setAdminPickupDate(date);
                          if (date) {
                            // Use local date to avoid timezone issues
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const formattedDate = `${year}-${month}-${day}`;
                            setNewBooking(prev => ({...prev, date: formattedDate}));
                          }
                        }}
                        placeholder="Select date"
                        minDate={new Date()}
                        maxDate={new Date('2030-12-31')}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <div className="mt-1">
                      <CustomTimePicker
                        selected={adminPickupTime}
                        onChange={(time) => {
                          setAdminPickupTime(time);
                          if (time) {
                            const hours = time.getHours().toString().padStart(2, '0');
                            const minutes = time.getMinutes().toString().padStart(2, '0');
                            setNewBooking(prev => ({...prev, time: `${hours}:${minutes}`}));
                          }
                        }}
                        placeholder="Select time"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Passengers *</Label>
                    <Select 
                      value={newBooking.passengers} 
                      onValueChange={(value) => setNewBooking(prev => ({...prev, passengers: value}))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Flight Details Section */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    ✈️ Flight Details (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Flight Arrival Number</Label>
                      <Input
                        value={newBooking.flightArrivalNumber}
                        onChange={(e) => setNewBooking(prev => ({...prev, flightArrivalNumber: e.target.value}))}
                        placeholder="e.g., NZ123"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label>Flight Arrival Time</Label>
                      <div className="mt-1">
                        <CustomTimePicker
                          selected={adminFlightArrivalTime}
                          onChange={(time) => {
                            setAdminFlightArrivalTime(time);
                            if (time) {
                              const hours = time.getHours().toString().padStart(2, '0');
                              const minutes = time.getMinutes().toString().padStart(2, '0');
                              setNewBooking(prev => ({...prev, flightArrivalTime: `${hours}:${minutes}`}));
                            }
                          }}
                          placeholder="Select arrival time"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Flight Departure Number</Label>
                      <Input
                        value={newBooking.flightDepartureNumber}
                        onChange={(e) => setNewBooking(prev => ({...prev, flightDepartureNumber: e.target.value}))}
                        placeholder="e.g., NZ456"
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label>Flight Departure Time</Label>
                      <div className="mt-1">
                        <CustomTimePicker
                          selected={adminFlightDepartureTime}
                          onChange={(time) => {
                            setAdminFlightDepartureTime(time);
                            if (time) {
                              const hours = time.getHours().toString().padStart(2, '0');
                              const minutes = time.getMinutes().toString().padStart(2, '0');
                              setNewBooking(prev => ({...prev, flightDepartureTime: `${hours}:${minutes}`}));
                            }
                          }}
                          placeholder="Select departure time"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Add flight details for airport pickups/drop-offs to better track and coordinate transfers
                  </p>
                </div>

                {/* Return Journey - Always visible, optional (no checkbox) */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">Return Journey <span className="text-sm font-normal text-gray-500">(Optional – leave blank for one-way)</span></h4>

                  <div className="space-y-4 mt-4">
                      <p className="text-sm text-gray-600">
                        Return trip: Drop-off → Pickup (reverse of outbound journey)
                      </p>
                      
                      {/* Return Date and Time */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Return Date *</Label>
                          <div className="mt-1">
                            <CustomDatePicker
                              selected={adminReturnDate}
                              onChange={(date) => {
                                setAdminReturnDate(date);
                                if (date) {
                                  // Use local date to avoid timezone issues
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  const formattedDate = `${year}-${month}-${day}`;
                                  setNewBooking(prev => ({...prev, returnDate: formattedDate}));
                                }
                              }}
                              placeholder="Select return date"
                              minDate={new Date('2020-01-01')}
                              maxDate={new Date('2030-12-31')}
                              showMonthDropdown
                              showYearDropdown
                              dropdownMode="select"
                            />
                          </div>
                        </div>
                        <div>
                          <Label>Return Time *</Label>
                          <div className="mt-1">
                            <CustomTimePicker
                              selected={adminReturnTime}
                              onChange={(time) => {
                                setAdminReturnTime(time);
                                if (time) {
                                  const hours = time.getHours().toString().padStart(2, '0');
                                  const minutes = time.getMinutes().toString().padStart(2, '0');
                                  setNewBooking(prev => ({...prev, returnTime: `${hours}:${minutes}`}));
                                }
                              }}
                              placeholder="Select return time"
                            />
                          </div>
                        </div>
                      </div>
                      {/* Return Flight Information */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">Return Flight Information (required if booking return)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Return Flight Number</Label>
                            <Input
                              value={newBooking.returnDepartureFlightNumber || ''}
                              onChange={(e) => setNewBooking(prev => ({...prev, returnDepartureFlightNumber: e.target.value}))}
                              placeholder="e.g. NZ456"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Return Arrival Flight (optional)</Label>
                            <Input
                              value={newBooking.returnArrivalFlightNumber || ''}
                              onChange={(e) => setNewBooking(prev => ({...prev, returnArrivalFlightNumber: e.target.value}))}
                              placeholder="e.g. NZ789"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                </div>

                <div>
                  <Label>Special Notes</Label>
                  <Textarea
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Pricing</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {bookingPricing.totalPrice > 0 ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Distance:</span>
                      <span className="font-medium">{bookingPricing.distance} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Price:</span>
                      <span className="font-medium">${bookingPricing.basePrice.toFixed(2)}</span>
                    </div>
                    {bookingPricing.airportFee > 0 && (
                      <div className="flex justify-between">
                        <span>Airport Fee:</span>
                        <span className="font-medium">${bookingPricing.airportFee.toFixed(2)}</span>
                      </div>
                    )}
                    {bookingPricing.passengerFee > 0 && (
                      <div className="flex justify-between">
                        <span>Passenger Fee:</span>
                        <span className="font-medium">${bookingPricing.passengerFee.toFixed(2)}</span>
                      </div>
                    )}
                    {(newBooking.returnDate && newBooking.returnTime) && (
                      <div className="flex justify-between text-green-700">
                        <span>🔄 Return Trip:</span>
                        <span className="font-medium">x2</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t font-semibold text-base">
                      <span>Total:</span>
                      <span className="text-gold">
                        ${((newBooking.returnDate && newBooking.returnTime) ? bookingPricing.totalPrice * 2 : bookingPricing.totalPrice).toFixed(2)}
                      </span>
                    </div>
                    {(newBooking.returnDate && newBooking.returnTime) && (
                      <p className="text-xs text-green-600 text-center mt-1">
                        Includes return trip (outbound + return)
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center">
                    Click &quot;Calculate Price&quot; to get pricing details
                  </p>
                )}
                <Button 
                  onClick={calculateBookingPrice}
                  disabled={calculatingPrice || !newBooking.pickupAddress || !newBooking.dropoffAddress}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {calculatingPrice ? 'Calculating...' : 'Calculate Price'}
                </Button>
              </div>

              {/* Price Override Section */}
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Label className="text-sm font-semibold text-gray-900 mb-2 block">
                  💰 Manual Price Override (Optional)
                </Label>
                <p className="text-xs text-gray-600 mb-3">
                  Enter a custom price to override the calculated amount. Leave empty to use calculated price.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualPriceOverride}
                      onChange={(e) => setManualPriceOverride(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                  {manualPriceOverride && (
                    <Button
                      variant="outline"
                      onClick={() => setManualPriceOverride('')}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {manualPriceOverride && parseFloat(manualPriceOverride) > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm">
                    <strong>Final Price:</strong> <span className="text-green-700 font-bold">${parseFloat(manualPriceOverride).toFixed(2)} NZD</span>
                    <span className="text-xs text-gray-600 block mt-1">
                      {bookingPricing.totalPrice > 0 && (
                        `Original: $${bookingPricing.totalPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateBookingModal(false);
                  setNewBooking({
                    name: '',
                    email: '',
                    phone: '',
                    serviceType: 'airport-shuttle',
                    pickupAddress: '',
                    dropoffAddress: '',
                    date: '',
                    time: '',
                    passengers: '1',
                    paymentMethod: 'stripe',  // Default to Stripe payment link
                    notes: ''
                  });
                  setBookingPricing({
                    distance: 0,
                    basePrice: 0,
                    airportFee: 0,
                    passengerFee: 0,
                    totalPrice: 0
                  });
                  setManualPriceOverride('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateManualBooking}
                className="bg-gold hover:bg-gold/90 text-black font-semibold"
                disabled={bookingPricing.totalPrice === 0 && (!manualPriceOverride || parseFloat(manualPriceOverride) <= 0)}
              >
                Create Booking & Send Confirmations
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Booking Modal */}
      <Dialog open={showEditBookingModal} onOpenChange={setShowEditBookingModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Booking #{editingBooking?.referenceNumber || editingBooking?.id?.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {editingBooking && (
            <div className="space-y-6 pt-4">
              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={editingBooking.name}
                      onChange={(e) => setEditingBooking(prev => ({...prev, name: e.target.value}))}
                      placeholder="Customer name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editingBooking.email}
                      onChange={(e) => setEditingBooking(prev => ({...prev, email: e.target.value}))}
                      placeholder="customer@example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <Input
                      value={editingBooking.phone}
                      onChange={(e) => setEditingBooking(prev => ({...prev, phone: e.target.value}))}
                      placeholder="+64 21 XXX XXXX"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Passengers</Label>
                    <Select 
                      value={editingBooking.passengers?.toString()} 
                      onValueChange={(value) => setEditingBooking(prev => ({...prev, passengers: value}))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Trip Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Trip Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label>Pickup Address 1 *</Label>
                    <GeoapifyAutocomplete
                      value={editingBooking.pickupAddress}
                      onChange={(v) => setEditingBooking(prev => ({...prev, pickupAddress: v}))}
                      onSelect={(addr) => setEditingBooking(prev => ({...prev, pickupAddress: addr}))}
                      placeholder="Start typing address..."
                      className="mt-1"
                    />
                  </div>

                  {/* Additional Pickup Addresses */}
                  {editingBooking.pickupAddresses?.map((pickup, index) => (
                    <div key={index} className="relative">
                      <Label>Pickup Address {index + 2}</Label>
                      <div className="flex gap-2 mt-1">
                        <GeoapifyAutocomplete
                          value={pickup}
                          onChange={(v) => handleEditPickupAddressChange(index, v)}
                          onSelect={(addr) => handleEditPickupAddressChange(index, addr)}
                          placeholder="Start typing address..."
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleRemoveEditPickup(index)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add Pickup Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleAddEditPickup}
                      className="group w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-gold/10 to-gold/5 hover:from-gold/20 hover:to-gold/10 border-2 border-dashed border-gold/40 hover:border-gold/60 rounded-lg transition-all duration-300"
                    >
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-sm font-semibold text-gray-700">Add Another Pickup Location</span>
                      <span className="w-6 h-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center">+</span>
                    </button>
                  </div>

                  <div>
                    <Label>Drop-off Address *</Label>
                    <GeoapifyAutocomplete
                      value={editingBooking.dropoffAddress}
                      onChange={(v) => setEditingBooking(prev => ({...prev, dropoffAddress: v}))}
                      onSelect={(addr) => setEditingBooking(prev => ({...prev, dropoffAddress: addr}))}
                      placeholder="Start typing address..."
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Date *</Label>
                      <Input
                        type="date"
                        value={editingBooking.date}
                        onChange={(e) => setEditingBooking(prev => ({...prev, date: e.target.value}))}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Time *</Label>
                      <Input
                        type="time"
                        value={editingBooking.time}
                        onChange={(e) => setEditingBooking(prev => ({...prev, time: e.target.value}))}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      ✈️ Flight Details (Optional)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Flight Arrival Number</Label>
                        <Input
                          value={editingBooking.flightArrivalNumber || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightArrivalNumber: e.target.value}))}
                          placeholder="e.g., NZ123"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label>Flight Arrival Time</Label>
                        <Input
                          type="time"
                          value={editingBooking.flightArrivalTime || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightArrivalTime: e.target.value}))}
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label>Flight Departure Number</Label>
                        <Input
                          value={editingBooking.flightDepartureNumber || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightDepartureNumber: e.target.value}))}
                          placeholder="e.g., NZ456"
                          className="mt-1 bg-white"
                        />
                      </div>
                      <div>
                        <Label>Flight Departure Time</Label>
                        <Input
                          type="time"
                          value={editingBooking.flightDepartureTime || ''}
                          onChange={(e) => setEditingBooking(prev => ({...prev, flightDepartureTime: e.target.value}))}
                          className="mt-1 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Return Journey - Always visible, optional */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Return Journey <span className="text-sm font-normal text-gray-500">(Optional)</span></h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <Label>Return Date *</Label>
                          <Input
                            type="date"
                            value={editingBooking.returnDate || ''}
                            onChange={(e) => setEditingBooking(prev => ({...prev, returnDate: e.target.value}))}
                            min={editingBooking.date || new Date().toISOString().split('T')[0]}
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div>
                          <Label>Return Time *</Label>
                          <Input
                            type="time"
                            value={editingBooking.returnTime || ''}
                            onChange={(e) => setEditingBooking(prev => ({...prev, returnTime: e.target.value}))}
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div>
                          <Label>Return Flight Number</Label>
                          <Input
                            value={editingBooking.returnFlightNumber || editingBooking.returnDepartureFlightNumber || ''}
                            onChange={(e) => setEditingBooking(prev => ({...prev, returnFlightNumber: e.target.value, returnDepartureFlightNumber: e.target.value}))}
                            placeholder="e.g. NZ456"
                            className="mt-1 bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-gray-600 italic">
                            Return route: {editingBooking.dropoffAddress?.split(',')[0]} → {editingBooking.pickupAddress?.split(',')[0]}
                          </p>
                        </div>
                      </div>
                  </div>

                  <div>
                    <Label>Special Notes</Label>
                    <Textarea
                      value={editingBooking.notes || ''}
                      onChange={(e) => setEditingBooking(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Any special requests or notes..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Current Pricing Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Current Pricing</h3>
                <div className="flex justify-between items-center">
                  <span>Total Price:</span>
                  <span className="text-xl font-bold text-gold">${editingBooking.pricing?.totalPrice?.toFixed(2) || '0.00'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">To change pricing, use the View Details modal and override the price.</p>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePreviewConfirmation(editingBooking.id)}
                    className="bg-white"
                    disabled={previewLoading}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {previewLoading ? 'Loading...' : 'Preview Confirmation'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendConfirmation(editingBooking.id)}
                    className="bg-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Confirmation
                  </Button>
                  {editingBooking.payment_status !== 'paid' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResendPaymentLink(editingBooking.id, 'stripe')}
                      className="bg-white text-green-600 border-green-200 hover:bg-green-50"
                    >
                      💳 Send Payment Link
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManualCalendarSync(editingBooking.id)}
                    className="bg-white"
                    disabled={calendarLoading}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Sync to Calendar
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditBookingModal(false);
                    setEditingBooking(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEditedBooking}
                  className="bg-gold hover:bg-gold/90 text-black font-semibold"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Confirmation Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview Confirmation Email
            </DialogTitle>
          </DialogHeader>
          
          {previewBookingInfo && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm"><strong>To:</strong> {previewBookingInfo.email}</p>
              {previewBookingInfo.ccEmail && (
                <p className="text-sm"><strong>CC:</strong> {previewBookingInfo.ccEmail}</p>
              )}
              <p className="text-sm"><strong>Customer:</strong> {previewBookingInfo.name}</p>
              <p className="text-sm"><strong>Phone:</strong> {previewBookingInfo.phone}</p>
            </div>
          )}
          
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="bg-white"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowPreviewModal(false);
                setPreviewHtml('');
                setPreviewBookingInfo(null);
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleSendAfterPreview}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete {selectedBookings.size} Booking{selectedBookings.size > 1 ? 's' : ''}?
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ No notifications will be sent</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                The selected bookings will be permanently deleted without sending any SMS or email notifications to customers.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              This action cannot be undone. Are you sure you want to delete these test/spam bookings?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete {selectedBookings.size} Booking{selectedBookings.size > 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
