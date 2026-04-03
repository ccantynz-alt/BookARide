import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Mail, DollarSign, CheckCircle, XCircle, Clock, Eye, Edit2, Users, BookOpen, Settings, Trash2, MapPin, Calendar, RefreshCw, Send, Bell, Square, CheckSquare, FileText, Smartphone, RotateCcw, AlertTriangle, AlertCircle, Home, Upload, Archive, Activity, Download, Shield, Car, UserPlus, BarChart3, Megaphone, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { CustomDatePicker } from '../components/DateTimePicker';
import axios from 'axios';
import { CustomersTab } from '../components/admin/CustomersTab';
import { DriverApplicationsTab } from '../components/admin/DriverApplicationsTab';
import { DriversTab } from '../components/admin/DriversTab';
import { AnalyticsTab } from '../components/admin/AnalyticsTab';
import { LandingPagesTab } from '../components/admin/LandingPagesTab';
import { AdminBreadcrumb } from '../components/admin/AdminBreadcrumb';
import ReturnsOverviewPanel from '../components/admin/ReturnsOverviewPanel';
import { API } from '../config/api';
import Cockpit from '../admin/Cockpit';
import CreateBookingModal from '../components/admin/CreateBookingModal';
import EditBookingModal from '../components/admin/EditBookingModal';
import DeletedTab from '../components/admin/DeletedTab';
import ArchiveTab from '../components/admin/ArchiveTab';
import EmailModal from '../components/admin/EmailModal';
import PasswordModal from '../components/admin/PasswordModal';
import BulkDeleteDialog from '../components/admin/BulkDeleteDialog';
import PreviewConfirmationModal from '../components/admin/PreviewConfirmationModal';
import BookingDetailsModal from '../components/admin/BookingDetailsModal';
import DriverAssignPreviewModal from '../components/admin/DriverAssignPreviewModal';
import BookingsTable from '../components/admin/BookingsTable';
import GoogleAddressInput from '../components/GoogleAddressInput';

// Helper function to format date to DD/MM/YYYY
const formatDate = (dateString) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

// SAFE date parser — NEVER use new Date("YYYY-MM-DD") directly!
// JavaScript parses "YYYY-MM-DD" as UTC midnight, which shows as the
// previous day in NZ timezone. This function parses as LOCAL time.
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
  return null;
};

// Get today's date as YYYY-MM-DD in NZ timezone (string comparison safe)
const getNZTodayStr = () => {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Auckland' }).format(new Date());
};

// Helper function to get day of week from date string
const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (!date) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

// Helper function to get short day of week
const getShortDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const date = parseLocalDate(dateString);
  if (!date) return '';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Helper function to check if date is today (string comparison — timezone safe)
const isToday = (dateString) => {
  if (!dateString) return false;
  return dateString === getNZTodayStr();
};

// Helper function to check if date is tomorrow (string comparison — timezone safe)
const isTomorrow = (dateString) => {
  if (!dateString) return false;
  const nzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Pacific/Auckland' }));
  nzNow.setDate(nzNow.getDate() + 1);
  const y = nzNow.getFullYear();
  const m = String(nzNow.getMonth() + 1).padStart(2, '0');
  const d = String(nzNow.getDate()).padStart(2, '0');
  return dateString === `${y}-${m}-${d}`;
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
          <p className="text-gray-700 font-medium mb-2">📅 Sync All Bookings to Google Calendar</p>
          <p className="text-sm text-gray-500 mb-4">
            Add all bookings that are not yet on the calendar. Only bookings missing a calendar event will be synced (cancelled trips are skipped).
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
  // Initialized to no-ops so never in TDZ (minifier can reorder; avoids "Cannot access 'mr' before initialization")
  let fetchBookings = () => {};
  let filterBookings = () => {};
  const fetchBookingsRef = useRef(null);
  const filterBookingsRef = useRef(null);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return 'bookings';
  });
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
  const [orphanPayments, setOrphanPayments] = useState([]);
  const [loadingOrphans, setLoadingOrphans] = useState(false);
  const [syncingPayments, setSyncingPayments] = useState(false);
  const [recoverSessionId, setRecoverSessionId] = useState('');
  const [recovering, setRecovering] = useState(false);
  const [showPaymentTroubleshooting, setShowPaymentTroubleshooting] = useState(false);
  const [loadingDeleted, setLoadingDeleted] = useState(false);
  const [restoringAll, setRestoringAll] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [retentionCounts, setRetentionCounts] = useState(null); // { active, deleted } when list empty
  const [deletedCountForBanner, setDeletedCountForBanner] = useState(null); // deleted count for "Restore all" banner on Bookings tab

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailCC, setEmailCC] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
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

  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('');
  const [showEditBookingModal, setShowEditBookingModal] = useState(false);
  // Bulk delete state
  const [selectedBookings, setSelectedBookings] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  


  // useMemo guarantees stable render-time ordering that minifiers cannot reorder,
  // fixing the "Cannot read properties of undefined (reading 'add')" crash that
  // occurred when minifier reordered the let-based two-step assignment.
  const safeSelectedSet = useMemo(
    () => (selectedBookings instanceof Set ? selectedBookings : new Set()),
    [selectedBookings]
  );

  // Preview confirmation modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewBookingInfo, setPreviewBookingInfo] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  




  // Pagination state (must be before useEffects that depend on dateFrom/dateTo)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const [bookingsPerPage] = useState(50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loadAllBookings, setLoadAllBookings] = useState(true); // MUST load all — missing bookings when paginated

  // Use refs only - never reference fetchBookings/filterBookings here (they are declared later)
  useEffect(() => {
    if (filterBookingsRef.current) filterBookingsRef.current();
  }, [bookings, searchTerm, statusFilter]);
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) return;
    if (dateFrom || dateTo) fetchBookingsRef.current?.(1, false);
  }, [dateFrom, dateTo]);

  // Debounced server-side search: when searchTerm changes, re-fetch from API after 300ms
  const searchDebounceRef = useRef(null);
  useEffect(() => {
    if (!localStorage.getItem('adminToken')) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchBookingsRef.current?.(1, false);
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchTerm]);

  // When list is empty (no active bookings in DB at all), fetch active/deleted counts so we can show "0 active, 47 deleted"
  // NOTE: use bookings.length (raw fetch result), NOT filteredBookings.length — filters can hide bookings that exist
  useEffect(() => {
    if (loading || bookings.length > 0) {
      setRetentionCounts(null);
      return;
    }
    let cancelled = false;
    axios.get(`${API}/admin/bookings/retention-counts`, getAuthHeaders()).then((r) => {
      if (!cancelled && r.data) setRetentionCounts({ active: r.data.active ?? 0, deleted: r.data.deleted ?? 0 });
    }).catch(() => { if (!cancelled) setRetentionCounts(null); });
    return () => { cancelled = true; };
  }, [loading, bookings.length]);

  // When on Bookings tab, fetch deleted count so we can show "Restore all" banner if any are in Deleted
  useEffect(() => {
    if (activeTab !== 'bookings') return;
    let cancelled = false;
    axios.get(`${API}/admin/bookings/retention-counts`, getAuthHeaders()).then((r) => {
      if (!cancelled && r.data && typeof r.data.deleted === 'number') setDeletedCountForBanner(r.data.deleted);
    }).catch(() => { if (!cancelled) setDeletedCountForBanner(null); });
    return () => { cancelled = true; };
  }, [activeTab]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  fetchBookings = async (page = 1, append = false, isRetry = false) => {
    try {
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);
      
      const params = {
        page: loadAllBookings ? 1 : page,
        limit: loadAllBookings ? 0 : bookingsPerPage   // 0 = return ALL active bookings (never miss one)
      };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (searchTerm && searchTerm.trim().length >= 2) params.search = searchTerm.trim();

      const response = await axios.get(`${API}/bookings`, {
        ...getAuthHeaders(),
        params
      });

      // Support both { bookings, total } wrapper and plain array (backward compat)
      const responseData = response.data;
      const newBookings = Array.isArray(responseData) ? responseData : (Array.isArray(responseData?.bookings) ? responseData.bookings : []);
      if (responseData?.total !== undefined) setTotalBookings(responseData.total);

      // Cache a small subset for offline fallback (keeps localStorage fast)
      try {
        const toCache = (append ? newBookings : newBookings.slice(0, 50));
        localStorage.setItem('cachedBookings', JSON.stringify(toCache));
        localStorage.setItem('cachedBookingsTime', new Date().toISOString());
      } catch (e) {
        // localStorage full or unavailable - not critical
      }
      
      // Defer heavy state update to next tick to avoid "[Violation] 'load' handler took Xms"
      const doUpdate = () => {
        if (append) {
          setBookings(prev => [...(Array.isArray(prev) ? prev : []), ...newBookings]);
        } else {
          setBookings(newBookings);
        }
        setCurrentPage(1);
        setLoading(false);
        setIsLoadingMore(false);
        if (page === 1) fetchBookingCounts();
      };
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(doUpdate);
      } else {
        setTimeout(doUpdate, 0);
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
      const isRetriable = !error.response || error.response.status >= 500 || error.response.status === 408;
      if (isRetriable && !isRetry) {
        setTimeout(() => fetchBookingsRef.current?.(page, append, true), 1500);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }
      try {
        const cached = JSON.parse(localStorage.getItem('cachedBookings') || '[]');
        if (Array.isArray(cached) && cached.length > 0) {
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
  fetchBookingsRef.current = fetchBookings;

  // ── Optimistic helpers: update UI instantly without full reload ──
  const updateBookingLocally = (bookingId, updates) => {
    setBookings(prev => prev.map(b => b && b.id === bookingId ? { ...b, ...updates } : b));
  };

  const removeBookingLocally = (bookingId) => {
    setBookings(prev => prev.filter(b => b && b.id !== bookingId));
  };

  // Silent background refresh — syncs with server without showing spinner
  const silentRefresh = async () => {
    try {
      const params = {
        page: loadAllBookings ? 1 : 1,
        limit: loadAllBookings ? 0 : bookingsPerPage
      };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (searchTerm && searchTerm.trim().length >= 2) params.search = searchTerm.trim();
      const response = await axios.get(`${API}/bookings`, { ...getAuthHeaders(), params });
      const rd = response.data;
      const fresh = Array.isArray(rd) ? rd : (Array.isArray(rd?.bookings) ? rd.bookings : []);
      if (rd?.total !== undefined) setTotalBookings(rd.total);
      setBookings(fresh);
      try {
        localStorage.setItem('cachedBookings', JSON.stringify(fresh.slice(0, 50)));
        localStorage.setItem('cachedBookingsTime', new Date().toISOString());
      } catch (e) { /* localStorage full — not critical */ }
    } catch (error) {
      // Silent refresh failed — not critical, optimistic state is still valid
      console.error('Silent refresh failed:', error);
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
    fetchBookingsRef.current?.(currentPage + 1, true);
  };

  const fetchDrivers = async () => {
    try {
      const response = await axios.get(`${API}/drivers`, getAuthHeaders());
      setDrivers(Array.isArray(response.data?.drivers) ? response.data.drivers : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  const fetchDeletedBookings = async () => {
    setLoadingDeleted(true);
    try {
      const response = await axios.get(`${API}/bookings/deleted`, getAuthHeaders());
      setDeletedBookings(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching deleted bookings:', error);
      toast.error('Failed to load deleted bookings');
    } finally {
      setLoadingDeleted(false);
    }
  };

  const syncPendingPayments = async () => {
    setSyncingPayments(true);
    try {
      const response = await axios.post(`${API}/bookings/sync-pending-payments`, {}, getAuthHeaders());
      const data = response.data;
      if (data.count > 0) {
        toast.success(`Synced ${data.count} booking(s) — they were paid in Stripe but stuck as pending. Now confirmed.`);
        silentRefresh();
      } else if (data.checked > 0) {
        toast.info(`Checked ${data.checked} pending booking(s) — none have been paid in Stripe yet.`);
      } else {
        toast.info('No pending bookings with payment links to check.');
      }
    } catch (error) {
      console.error('Error syncing payments:', error);
      toast.error(error.response?.data?.detail || 'Failed to sync payment statuses');
    } finally {
      setSyncingPayments(false);
    }
  };

  const fetchOrphanPayments = async () => {
    setLoadingOrphans(true);
    try {
      const response = await axios.get(`${API}/bookings/orphan-payments`, getAuthHeaders());
      setOrphanPayments(response.data?.orphan_payments || []);
      if ((response.data?.count || 0) > 0) {
        toast.info(`Found ${response.data.count} paid Stripe payment(s) with no booking in the list. You can recover them below.`);
      }
    } catch (error) {
      console.error('Error fetching orphan payments:', error);
      toast.error(error.response?.data?.detail || 'Failed to check for missing payments');
    } finally {
      setLoadingOrphans(false);
    }
  };

  const recoverBookingFromPayment = async (sessionId = null, bookingId = null) => {
    setRecovering(true);
    try {
      const payload = sessionId ? { session_id: sessionId } : { booking_id: bookingId };
      const response = await axios.post(`${API}/bookings/recover-from-payment`, payload, getAuthHeaders());
      toast.success(response.data?.message || 'Booking recovered and added to the list.');
      setRecoverSessionId('');
      setOrphanPayments(prev => prev.filter(o => o.booking_id !== (response.data?.booking_id || bookingId)));
      silentRefresh();
    } catch (error) {
      const detail = error.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Recover failed');
    } finally {
      setRecovering(false);
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
      removeBookingLocally(bookingId);
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
      silentRefresh();
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
        silentRefresh(); // Refresh active bookings list
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

  // Initial load: bookings first; drivers deferred to lighten first paint
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    // Fire all initial loads in parallel for faster first paint
    Promise.all([
      fetchBookingsRef.current?.(),
      fetchDrivers(),
      fetchArchivedCount(),
    ]).catch(() => {});
  }, [navigate]);

  const handleRestoreBooking = async (bookingId) => {
    try {
      await axios.post(`${API}/bookings/restore/${bookingId}`, {}, getAuthHeaders());
      toast.success('Booking restored successfully!');
      fetchDeletedBookings();
      silentRefresh();
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

  const handleRestoreAllBookings = async () => {
    const countToShow = deletedBookings.length > 0 ? deletedBookings.length : (deletedCountForBanner ?? 0);
    if (countToShow === 0) {
      toast.info('No deleted bookings to restore');
      return;
    }
    if (!window.confirm(`Restore all ${countToShow} deleted booking(s) back to active bookings? This will reinstate your full list.`)) return;
    setRestoringAll(true);
    try {
      const res = await axios.post(`${API}/bookings/restore-all`, {}, getAuthHeaders());
      const count = res.data?.restored_count ?? 0;
      toast.success(count ? `Restored ${count} booking(s). Your list is reinstated.` : res.data?.message || 'Done');
      setDeletedCountForBanner(0);
      fetchDeletedBookings();
      silentRefresh();
    } catch (error) {
      console.error('Error restoring all bookings:', error);
      toast.error(error.response?.data?.detail || 'Failed to restore all bookings');
    } finally {
      setRestoringAll(false);
    }
  };

  // State for JSON backup file restore
  const [restoringFromFile, setRestoringFromFile] = useState(false);
  const [restoringFromServerBackup, setRestoringFromServerBackup] = useState(false);
  const [backupRestoreResult, setBackupRestoreResult] = useState(null);
  const backupFileInputRef = useRef(null);

  // Auto daily backup state
  const [autoBackups, setAutoBackups] = useState([]);
  const [loadingAutoBackups, setLoadingAutoBackups] = useState(false);
  const [triggeringBackup, setTriggeringBackup] = useState(false);
  const [restoringAutoBackup, setRestoringAutoBackup] = useState(null);

  const fetchAutoBackups = async () => {
    setLoadingAutoBackups(true);
    try {
      const res = await axios.get(`${API}/admin/backups`, getAuthHeaders());
      setAutoBackups(res.data.backups || []);
    } catch (e) {
      console.error('Failed to load auto-backups', e);
    } finally {
      setLoadingAutoBackups(false);
    }
  };

  const handleTriggerBackup = async () => {
    setTriggeringBackup(true);
    try {
      const res = await axios.post(`${API}/admin/backups/trigger`, {}, getAuthHeaders());
      toast.success(`Backup saved: ${res.data.activeCount} active + ${res.data.deletedCount} deleted bookings`);
      fetchAutoBackups();
    } catch (e) {
      toast.error('Backup failed');
    } finally {
      setTriggeringBackup(false);
    }
  };

  const handleRestoreAutoBackup = async (label) => {
    if (!window.confirm(`Restore missing bookings from the ${label} backup?\n\nThis is safe — it only adds back bookings that are no longer in your active list.`)) return;
    setRestoringAutoBackup(label);
    try {
      const res = await axios.post(`${API}/admin/backups/${label}/restore`, {}, getAuthHeaders());
      if (res.data.restored > 0) {
        toast.success(`Restored ${res.data.restored} missing booking(s) from ${label}`);
        silentRefresh();
      } else {
        toast.info(`No missing bookings found in ${label} backup — all bookings already present`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Restore failed');
    } finally {
      setRestoringAutoBackup(null);
    }
  };

  const handleRestoreFromBackupFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }
    if (!window.confirm(`Restore bookings from "${file.name}"? Existing bookings with the same ID will be skipped (no duplicates).`)) {
      e.target.value = '';
      return;
    }
    setRestoringFromFile(true);
    setBackupRestoreResult(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Handle both formats: plain array OR export format { active: [...], deleted: [...] }
      let bookings = [];
      if (Array.isArray(parsed)) {
        bookings = parsed;
      } else if (parsed.active && Array.isArray(parsed.active)) {
        bookings = [...parsed.active, ...(parsed.deleted || [])];
      } else {
        toast.error('Unrecognised backup format. Expected a JSON array or export file.');
        return;
      }
      const res = await axios.post(`${API}/bookings/restore-backup`, { bookings }, getAuthHeaders());
      setBackupRestoreResult(res.data);
      const { imported_count, skipped_count, error_count } = res.data;
      toast.success(`Restored ${imported_count} booking(s) from backup. Skipped ${skipped_count} duplicates.${error_count ? ` ${error_count} errors.` : ''}`);
      silentRefresh();
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || 'Restore failed';
      toast.error(msg);
      setBackupRestoreResult({ error: msg });
    } finally {
      setRestoringFromFile(false);
      e.target.value = '';
    }
  };

  const handleRestoreFromServerBackup = async () => {
    if (!window.confirm('Restore bookings from the backup file stored on the server (backup_bookings_full.json)? Existing bookings will not be duplicated.')) return;
    setRestoringFromServerBackup(true);
    setBackupRestoreResult(null);
    try {
      const res = await axios.post(`${API}/admin/bookings/restore-from-repo-backup`, {}, getAuthHeaders());
      setBackupRestoreResult(res.data);
      const { imported_count, skipped_count, source_file } = res.data;
      toast.success(`Restored ${imported_count} booking(s) from ${source_file || 'server backup'}. Skipped ${skipped_count} duplicates.`);
      silentRefresh();
    } catch (error) {
      const msg = error.response?.data?.detail || error.message || 'Restore failed';
      toast.error(msg);
      setBackupRestoreResult({ error: msg });
    } finally {
      setRestoringFromServerBackup(false);
    }
  };

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await axios.get(`${API}/admin/bookings/export-backup`, getAuthHeaders());
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Backup downloaded: ${res.data?.activeCount ?? 0} active, ${res.data?.deletedCount ?? 0} deleted`);
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error(error.response?.data?.detail || 'Failed to download backup');
    } finally {
      setDownloadingBackup(false);
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
      // Optimistic: update driver info in local booking
      const confirmAssignedDriver = drivers.find(d => d.id === selectedDriver);
      if (tripType === 'return') {
        updateBookingLocally(selectedBooking.id, {
          return_driver_id: selectedDriver,
          return_driver_name: confirmAssignedDriver?.name || '',
          return_driver_phone: confirmAssignedDriver?.phone || '',
          return_driver_email: confirmAssignedDriver?.email || '',
        });
      } else {
        updateBookingLocally(selectedBooking.id, {
          driver_id: selectedDriver,
          driver_name: confirmAssignedDriver?.name || '',
          driver_phone: confirmAssignedDriver?.phone || '',
          driver_email: confirmAssignedDriver?.email || '',
        });
      }
      silentRefresh();
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
      // Optimistic: update driver info in local booking
      const assignedDriverObj = drivers.find(d => d.id === selectedDriver);
      if (tripType === 'return') {
        updateBookingLocally(selectedBooking.id, {
          return_driver_id: selectedDriver,
          return_driver_name: assignedDriverObj?.name || '',
          return_driver_phone: assignedDriverObj?.phone || '',
          return_driver_email: assignedDriverObj?.email || '',
        });
      } else {
        updateBookingLocally(selectedBooking.id, {
          driver_id: selectedDriver,
          driver_name: assignedDriverObj?.name || '',
          driver_phone: assignedDriverObj?.phone || '',
          driver_email: assignedDriverObj?.email || '',
        });
      }
      silentRefresh();
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
      // Optimistic: clear driver info in local booking
      if (tripType === 'return') {
        updateBookingLocally(selectedBooking.id, {
          return_driver_id: null, return_driver_name: null,
          return_driver_phone: null, return_driver_email: null,
        });
      } else {
        updateBookingLocally(selectedBooking.id, {
          driver_id: null, driver_name: null,
          driver_phone: null, driver_email: null, driverConfirmed: false,
        });
      }
      silentRefresh();
    } catch (error) {
      console.error('Error unassigning driver:', error);
      toast.error(error.response?.data?.detail || 'Failed to unassign driver');
    }
  };

  filterBookings = () => {
    let filtered = Array.isArray(bookings) ? bookings : [];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b && b.status === statusFilter);
    }

    // Search filter (local only - archive search is debounced separately below)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(b => b && (
        b.name?.toLowerCase().includes(searchLower) ||
        b.email?.toLowerCase().includes(searchLower) ||
        b.phone?.includes(searchTerm) ||
        b.pickupAddress?.toLowerCase().includes(searchLower) ||
        b.dropoffAddress?.toLowerCase().includes(searchLower) ||
        String(b.referenceNumber)?.includes(searchTerm)
      ));
    }

    setFilteredBookings(filtered);
  };
  filterBookingsRef.current = filterBookings;

  // Search across all bookings (active + archived) - debounced separately from filter
  const [archiveSearchResults, setArchiveSearchResults] = useState([]);
  const archiveSearchDebounceRef = useRef(null);
  const archiveSearchRequestRef = useRef(0);
  useEffect(() => {
    if (!searchTerm || searchTerm.length < 2) {
      setArchiveSearchResults([]);
      return;
    }
    // Debounce archive search to avoid hammering API on every keystroke
    if (archiveSearchDebounceRef.current) clearTimeout(archiveSearchDebounceRef.current);
    archiveSearchDebounceRef.current = setTimeout(async () => {
      const requestId = ++archiveSearchRequestRef.current;
      try {
        const response = await axios.get(`${API}/bookings/search-all?search=${encodeURIComponent(searchTerm)}&include_archived=true`, getAuthHeaders());
        if (requestId !== archiveSearchRequestRef.current) return; // Discard stale
        const results = Array.isArray(response.data?.results) ? response.data.results : [];
        const archivedOnly = results.filter(b => b && b.isArchived);
        setArchiveSearchResults(archivedOnly);
      } catch (error) {
        if (requestId !== archiveSearchRequestRef.current) return;
        console.error('Error searching all bookings:', error);
      }
    }, 500);
    return () => { if (archiveSearchDebounceRef.current) clearTimeout(archiveSearchDebounceRef.current); };
  }, [searchTerm]);

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
        await fetchBookingsRef.current?.();
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
      updateBookingLocally(bookingId, { status: newStatus });
      silentRefresh();
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
      removeBookingLocally(bookingId);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }
      console.error('Error deleting booking:', error);
      const detail = error.response?.data?.detail;
      if (error.response?.status === 400 && detail && detail.includes('paid Stripe payment')) {
        const forceCancel = window.confirm(
          `This booking has a paid Stripe payment.\n\nDo you want to force-cancel it anyway?\n\n⚠️ You may need to process a refund separately in Stripe.`
        );
        if (forceCancel) {
          try {
            await axios.delete(`${API}/bookings/${bookingId}?send_notification=${sendNotification}&force=true`, getAuthHeaders());
            if (sendNotification) {
              toast.success('Paid booking force-cancelled - Customer notified');
            } else {
              toast.success('Paid booking force-deleted silently');
            }
            removeBookingLocally(bookingId);
            return;
          } catch (retryError) {
            console.error('Error force-deleting booking:', retryError);
            toast.error(retryError.response?.data?.detail || 'Failed to force-cancel booking');
            return;
          }
        }
        return;
      }
      toast.error(detail || 'Failed to cancel booking');
    }
  };

  // Bulk delete without notifications
  const handleBulkDelete = async () => {
    if (safeSelectedSet.size === 0) return;
    
    setShowBulkDeleteConfirm(false);
    const count = safeSelectedSet.size;
    let deleted = 0;
    let failed = 0;

    toast.loading(`Deleting ${count} bookings...`);

    for (const bookingId of safeSelectedSet) {
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
    silentRefresh();
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
  

  const exportToCSV = () => {
    try {
      // Define CSV headers
      const headers = ['Booking ID', 'Date', 'Time', 'Customer Name', 'Email', 'Phone', 'Service Type', 'Pickup Address', 'Dropoff Address', 'Passengers', 'Price', 'Payment Status', 'Status', 'Notes', 'Created At'];
      
      const list = Array.isArray(filteredBookings) ? filteredBookings : [];
      const rows = list.map(booking => [
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
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `bookings-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Exported ${list.length} bookings to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export bookings');
    }
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
      updateBookingLocally(selectedBooking.id, {
        pricing: { ...selectedBooking.pricing, totalPrice: newPrice, overridden: true }
      });
      silentRefresh();
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
        updateBookingLocally(selectedBooking.id, { payment_status: selectedPaymentStatus });
        setShowDetailsModal(false);
        silentRefresh();
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
      pickupAddresses: booking.pickupAddresses || [],
      // Normalize flight field names: customer bookings use arrivalFlightNumber/departureFlightNumber,
      // admin bookings use flightArrivalNumber/flightDepartureNumber — merge both so the edit form works
      flightArrivalNumber: booking.flightArrivalNumber || booking.arrivalFlightNumber || '',
      flightArrivalTime: booking.flightArrivalTime || booking.arrivalTime || '',
      flightDepartureNumber: booking.flightDepartureNumber || booking.departureFlightNumber || '',
      flightDepartureTime: booking.flightDepartureTime || booking.departureTime || '',
    });
    setShowEditBookingModal(true);
  };

  // Handle edit booking save
  const handleSaveEditedBooking = async () => {
    if (!editingBooking) return;

    try {
      const flightNum = editingBooking.flightNumber || editingBooking.flightArrivalNumber || editingBooking.flightDepartureNumber || '';
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
        // Single flight number synced to all field name variants
        flightNumber: flightNum,
        flightArrivalNumber: flightNum,
        flightDepartureNumber: flightNum,
        arrivalFlightNumber: flightNum,
        departureFlightNumber: flightNum,
        // Return trip - inferred from filled return date + time
        bookReturn: !!(editingBooking.returnDate && editingBooking.returnTime),
        returnDate: editingBooking.returnDate || '',
        returnTime: editingBooking.returnTime || '',
        returnFlightNumber: editingBooking.returnFlightNumber || editingBooking.returnDepartureFlightNumber || '',
        returnDepartureFlightNumber: editingBooking.returnDepartureFlightNumber || editingBooking.returnFlightNumber || ''
      }, getAuthHeaders());

      toast.success('Booking updated successfully!');
      setShowEditBookingModal(false);
      setEditingBooking(null);
      fetchBookingsRef.current?.();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error(error.response?.data?.detail || 'Failed to update booking');
    }
  };

  // Multi-pickup handlers removed per CLAUDE.md rule 10 (one pickup address only)

  // Manual calendar sync
  const handleManualCalendarSync = async (bookingId) => {
    setCalendarLoading(true);
    try {
      const response = await axios.post(`${API}/bookings/${bookingId}/sync-calendar`, {}, getAuthHeaders());
      toast.success(response.data.message || 'Booking synced to Google Calendar!');
      silentRefresh();
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
      const link = response.data?.payment_link;
      if (response.data?.email_sent) {
        toast.success(response.data.message || 'Payment link sent!');
      } else if (link) {
        // Email failed but we have the link — show it so admin can copy
        toast.success(
          <div>
            <p className="font-medium">Payment link ready (email may not have delivered):</p>
            <p className="text-xs mt-1 break-all select-all bg-gray-100 p-2 rounded mt-2">{link}</p>
            <button className="mt-2 text-xs text-blue-600 underline" onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copied!'); }}>Copy link</button>
          </div>,
          { duration: 30000 }
        );
      } else {
        toast.success(response.data.message || 'Payment link sent!');
      }
      fetchBookings();
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
      silentRefresh();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending_approval': return 'text-orange-600 bg-orange-100 animate-pulse';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const bookList = Array.isArray(bookings) ? bookings : [];
  const stats = {
    total: bookList.length,
    pending: bookList.filter(b => b && b.status === 'pending').length,
    pendingApproval: bookList.filter(b => b && b.status === 'pending_approval').length,
    confirmed: bookList.filter(b => b && b.status === 'confirmed').length,
    completed: bookList.filter(b => b && b.status === 'completed').length,
    cancelled: bookList.filter(b => b && b.status === 'cancelled').length,
    totalRevenue: bookList
      .filter(b => b && (b.status === 'confirmed' || b.status === 'completed'))
      .reduce((sum, b) => sum + (b.pricing?.totalPrice || b.totalPrice || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 pt-20">
      {/* Header — Premium, minimal */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 py-5">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">BookARide</h1>
              <p className="text-slate-400 text-xs mt-0.5 font-medium tracking-wide">ADMIN</p>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <button onClick={() => window.open('/', '_blank')} className="text-xs text-slate-400 hover:text-slate-900 transition-colors font-medium px-3 py-1.5">
                View Site
              </button>
              <button onClick={handleSyncContactsToiPhone} disabled={syncingContacts} className="text-xs text-slate-400 hover:text-slate-900 transition-colors font-medium px-3 py-1.5">
                {syncingContacts ? 'Syncing...' : 'Sync Contacts'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-xs text-slate-400 hover:text-slate-900 transition-colors font-medium px-3 py-1.5"
              >
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button onClick={() => setShowPasswordModal(true)} className="text-xs text-slate-400 hover:text-slate-900 transition-colors font-medium px-3 py-1.5">
                Password
              </button>
              <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-600 transition-colors font-medium px-3 py-1.5">
                Logout
              </button>
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
          if (val === 'deleted') { fetchDeletedBookings(); fetchAutoBackups(); }
          if (val === 'archive') fetchArchivedBookings(1, '');
        }} className="w-full">
          <TabsList className="flex flex-wrap w-full gap-1 mb-4 md:mb-8 bg-transparent">
            <TabsTrigger value="bookings" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4">
              <BookOpen className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Bookings</span>
              <span className="sm:hidden">Book</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4">
              <Car className="w-3 h-3 md:w-4 md:h-4" />
              <span>Drivers</span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4">
              <Users className="w-3 h-3 md:w-4 md:h-4" />
              <span>Customers</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4">
              <UserPlus className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Applications</span>
              <span className="md:hidden">Apps</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4">
              <BarChart3 className="w-3 h-3 md:w-4 md:h-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="cockpit" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-slate-600">
              <Activity className="w-3 h-3 md:w-4 md:h-4" />
              <span>Cockpit</span>
            </TabsTrigger>
            <TabsTrigger value="deleted" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-gray-500">
              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Deleted</span>
              <span className="md:hidden">Del</span>
              {deletedBookings.length > 0 && <span className="text-[10px]">({deletedBookings.length})</span>}
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-gray-500">
              <Archive className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden md:inline">Archive</span>
              <span className="md:hidden">Arc</span>
              {archivedCount > 0 && <span className="text-[10px]">({archivedCount})</span>}
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-gray-500">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span>Import</span>
            </TabsTrigger>
            <TabsTrigger value="marketing" className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-4 text-gray-500">
              <Megaphone className="w-3 h-3 md:w-4 md:h-4" />
              <span>Marketing</span>
            </TabsTrigger>
          </TabsList>


          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
        
        {/* Compact deleted bookings notification */}
        {deletedCountForBanner != null && deletedCountForBanner > 0 && (
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span><strong>{deletedCountForBanner}</strong> deleted booking{deletedCountForBanner !== 1 ? 's' : ''} in trash</span>
            </div>
            <Button
              onClick={handleRestoreAllBookings}
              disabled={restoringAll}
              size="sm"
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-100 h-7 text-xs"
            >
              {restoringAll ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Restore all
                </>
              )}
            </Button>
          </div>
        )}

        {/* ALERT: Bookings needing approval */}
        {stats.pendingApproval > 0 && (
          <Card className="border-orange-400 bg-orange-50 shadow-md">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-600 shrink-0 animate-pulse" />
                <div>
                  <p className="font-bold text-orange-900">{stats.pendingApproval} booking{stats.pendingApproval !== 1 ? 's' : ''} need{stats.pendingApproval === 1 ? 's' : ''} your approval!</p>
                  <p className="text-sm text-orange-800 mt-0.5">These are last-minute bookings (within 24 hours). They won't be confirmed until you approve them.</p>
                </div>
              </div>
              <Button
                onClick={() => setStatusFilter('pending_approval')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold shrink-0"
              >
                View &amp; Approve
              </Button>
            </CardContent>
          </Card>
        )}

        {/* RETURNS OVERVIEW - Shows bookings with return trips attached */}
        <ReturnsOverviewPanel
          bookings={bookings}
          drivers={drivers}
          onViewBooking={(booking) => {
            setSelectedBooking(booking);
            setShowDetailsModal(true);
          }}
        />
        
        {/* Stats — Glass cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <button onClick={() => setStatusFilter('all')} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 p-5 shadow-sm shadow-black/5 hover:shadow-md hover:bg-white/80 transition-all text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Total</p>
            <p className="text-3xl font-bold text-gold mt-2 tabular-nums">{stats.total}</p>
          </button>
          <button onClick={() => setStatusFilter('pending')} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 p-5 shadow-sm shadow-black/5 hover:shadow-md hover:bg-white/80 transition-all text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Pending</p>
            <p className="text-3xl font-bold text-amber-600 mt-2 tabular-nums">{stats.pending}</p>
          </button>
          <button onClick={() => setStatusFilter('confirmed')} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 p-5 shadow-sm shadow-black/5 hover:shadow-md hover:bg-white/80 transition-all text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Confirmed</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2 tabular-nums">{stats.confirmed}</p>
          </button>
          <button onClick={() => setStatusFilter('completed')} className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 p-5 shadow-sm shadow-black/5 hover:shadow-md hover:bg-white/80 transition-all text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Completed</p>
            <p className="text-3xl font-bold text-blue-600 mt-2 tabular-nums">{stats.completed}</p>
          </button>
          <div className="bg-gold rounded-2xl p-5 shadow-lg shadow-gold/20">
            <p className="text-[10px] font-bold text-black/50 uppercase tracking-[0.15em]">Revenue</p>
            <p className="text-3xl font-bold text-white mt-2 tabular-nums">${(stats.totalRevenue ?? 0).toFixed(0)}</p>
          </div>
        </div>

        {/* Filter Bar — Glass */}
        <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-sm shadow-black/5 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/50 border-slate-200/60 focus:bg-white focus:border-slate-400 focus:ring-slate-400/20 h-10 rounded-xl text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[150px] h-10 bg-white/50 border-slate-200/60 rounded-xl text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending_approval">Needs Approval</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <div className="w-[140px]">
                <CustomDatePicker
                  selected={dateFrom ? new Date(dateFrom.replace(/-/g, '/')) : null}
                  onChange={(date) => {
                    if (date) {
                      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      setDateFrom(val);
                      if (dateTo && val > dateTo) setDateTo('');
                    } else {
                      setDateFrom('');
                    }
                  }}
                  placeholder="From date"
                  allowPastDates
                  isClearable
                />
              </div>
              <span className="text-slate-400 text-xs">to</span>
              <div className="w-[140px]">
                <CustomDatePicker
                  selected={dateTo ? new Date(dateTo.replace(/-/g, '/')) : null}
                  onChange={(date) => {
                    if (date) {
                      const val = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                      setDateTo(val);
                    } else {
                      setDateTo('');
                    }
                  }}
                  placeholder="To date"
                  allowPastDates
                  minDate={dateFrom ? new Date(dateFrom.replace(/-/g, '/')) : null}
                  isClearable
                />
              </div>
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-[11px] text-slate-400 hover:text-slate-700 underline underline-offset-2">Clear</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportToCSV} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2">
                Export
              </button>
              <button onClick={handleSendReminders} className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors px-3 py-2" title="Remind tomorrow's bookings">
                <Bell className="w-3.5 h-3.5 inline mr-1" />Remind
              </button>
              <button onClick={() => setShowCreateBookingModal(true)} className="bg-gold hover:bg-gold/90 text-black text-sm font-semibold h-10 px-5 rounded-xl transition-colors">
                + New Booking
              </button>
            </div>
          </div>
        </div>

        {/* Payment Troubleshooting — collapsible */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowPaymentTroubleshooting(!showPaymentTroubleshooting)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showPaymentTroubleshooting ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>Payment Troubleshooting</span>
          </button>
          {showPaymentTroubleshooting && (
            <div className="mt-3 space-y-3">
              {/* Sync pending payments */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="font-medium text-blue-900">Booking shows "pending" but customer says they paid?</p>
                      <p className="text-sm text-blue-800">Checks Stripe for all pending bookings and updates any that have actually been paid.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={syncPendingPayments} disabled={syncingPayments} className="border-blue-500 text-blue-800 hover:bg-blue-100">
                      {syncingPayments ? 'Checking Stripe...' : 'Sync Pending Payments'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recover missing bookings */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-900">Payment received in Stripe but booking missing from the list?</p>
                      <p className="text-sm text-amber-800">Use this if a customer paid but the booking never appeared in the admin panel.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchOrphanPayments} disabled={loadingOrphans} className="border-amber-500 text-amber-800 hover:bg-amber-100">
                      {loadingOrphans ? 'Checking...' : 'Check for missing payments'}
                    </Button>
                  </div>
                  {Array.isArray(orphanPayments) && orphanPayments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-amber-900">Paid payments with no booking in list:</p>
                      {orphanPayments.map((o) => (
                        <div key={o.booking_id} className="flex flex-wrap items-center gap-2 py-2 px-3 bg-white rounded border border-amber-200">
                          <span className="text-sm">{o.customer_name || 'Unknown'} – {o.customer_email || 'No email'} – ${Number(o.amount || 0).toFixed(2)}</span>
                          <Button size="sm" onClick={() => recoverBookingFromPayment(null, o.booking_id)} disabled={recovering} className="bg-amber-600 hover:bg-amber-700">
                            Recover into list
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      placeholder="Or paste Stripe session ID (cs_...)"
                      value={recoverSessionId || ''}
                      onChange={(e) => setRecoverSessionId(e.target.value || '')}
                      className="border rounded px-2 py-1.5 text-sm w-64"
                    />
                    <Button size="sm" onClick={() => recoverBookingFromPayment((recoverSessionId || '').trim(), null)} disabled={recovering || !(recoverSessionId || '').trim()} className="bg-amber-600 hover:bg-amber-700">
                      {recovering ? 'Recovering...' : 'Recover from session ID'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Bookings Table — Redesigned */}
        <BookingsTable
          bookings={filteredBookings}
          loading={loading}
          totalBookings={totalBookings || bookings.length}
          selectedBookings={safeSelectedSet}
          onSelectBooking={(id) => {
            const next = new Set(safeSelectedSet);
            next.has(id) ? next.delete(id) : next.add(id);
            setSelectedBookings(next);
          }}
          onSelectAll={() => setSelectedBookings(new Set(filteredBookings.map(b => b.id)))}
          onClearSelection={() => setSelectedBookings(new Set())}
          onBulkDelete={() => setShowBulkDeleteConfirm(true)}
          onViewDetails={openDetailsModal}
          onEditBooking={openEditBookingModal}
          onSendEmail={(booking) => { setSelectedBooking(booking); setShowEmailModal(true); }}
          onResendConfirmation={handleResendConfirmation}
          onArchiveBooking={handleArchiveBooking}
          onDeleteBooking={handleDeleteBooking}
          onStatusUpdate={handleStatusUpdate}
          onSendPaymentLink={handleResendPaymentLink}
          dateFrom={dateFrom}
          dateTo={dateTo}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onClearFilters={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); setStatusFilter('all'); }}
          onOpenDeletedTab={() => setActiveTab('deleted')}
          onRestoreFromServer={handleRestoreFromServerBackup}
          restoringFromServerBackup={restoringFromServerBackup}
          loadAllBookings={loadAllBookings}
          onLoadAll={() => { setLoadAllBookings(true); fetchBookingsRef.current?.(1, false); }}
          currentPage={currentPage}
          bookingsPerPage={bookingsPerPage}
          onPageChange={(page) => { setCurrentPage(page); fetchBookingsRef.current?.(page, false); }}
        />

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

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          {/* Marketing Tab - Landing Pages & Social */}
          <TabsContent value="marketing">
            <LandingPagesTab />
          </TabsContent>

          {/* Deleted Bookings Tab */}
          <TabsContent value="deleted" className="space-y-6">
            <DeletedTab
              deletedBookings={deletedBookings}
              loadingDeleted={loadingDeleted}
              downloadingBackup={downloadingBackup}
              restoringFromFile={restoringFromFile}
              restoringFromServerBackup={restoringFromServerBackup}
              restoringAll={restoringAll}
              backupRestoreResult={backupRestoreResult}
              autoBackups={autoBackups}
              loadingAutoBackups={loadingAutoBackups}
              triggeringBackup={triggeringBackup}
              restoringAutoBackup={restoringAutoBackup}
              onDownloadBackup={handleDownloadBackup}
              onRestoreFromBackupFile={handleRestoreFromBackupFile}
              onRestoreFromServerBackup={handleRestoreFromServerBackup}
              onRestoreAllBookings={handleRestoreAllBookings}
              onTriggerBackup={handleTriggerBackup}
              onRestoreAutoBackup={handleRestoreAutoBackup}
              onRestoreBooking={handleRestoreBooking}
              onPermanentDelete={handlePermanentDelete}
            />
          </TabsContent>

          {/* Archive Tab */}
          <TabsContent value="archive" className="space-y-6">
            <ArchiveTab
              archivedBookings={archivedBookings}
              archivedCount={archivedCount}
              loadingArchived={loadingArchived}
              archiveSearchTerm={archiveSearchTerm}
              archivePage={archivePage}
              archiveTotalPages={archiveTotalPages}
              runningAutoArchive={runningAutoArchive}
              onSearchTermChange={setArchiveSearchTerm}
              onSearch={handleArchiveSearch}
              onClearSearch={() => { setArchiveSearchTerm(''); fetchArchivedBookings(1, ''); }}
              onRunAutoArchive={handleRunAutoArchive}
              onFetchPage={(page) => fetchArchivedBookings(page, archiveSearchTerm)}
              onViewDetails={openDetailsModal}
              onUnarchive={handleUnarchiveBooking}
            />
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
                    silentRefresh();
                    toast.success('Bookings imported successfully!');
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cockpit Tab */}
          <TabsContent value="cockpit" className="space-y-6">
            <Cockpit />
          </TabsContent>
        </Tabs>
      </div>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        booking={selectedBooking}
        drivers={drivers}
        selectedPaymentStatus={selectedPaymentStatus}
        onPaymentStatusChange={setSelectedPaymentStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        priceOverride={priceOverride}
        onPriceOverrideChange={setPriceOverride}
        onPriceOverride={handlePriceOverride}
        selectedDriver={selectedDriver}
        onDriverChange={setSelectedDriver}
        driverPayoutOverride={driverPayoutOverride}
        onDriverPayoutChange={setDriverPayoutOverride}
        onShowAssignPreview={handleShowAssignPreview}
        onUnassignDriver={handleUnassignDriver}
        onSendTrackingLink={handleSendTrackingLink}
        onSendToAdmin={handleSendToAdmin}
      />

      {/* Driver Assignment Preview Modal */}
      <DriverAssignPreviewModal
        open={showDriverAssignPreview}
        onOpenChange={setShowDriverAssignPreview}
        pendingAssignment={pendingAssignment}
        booking={selectedBooking}
        onConfirm={handleConfirmAssignDriver}
        onCancel={() => { setShowDriverAssignPreview(false); setPendingAssignment(null); }}
      />

      {/* Email Modal */}
      <EmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        booking={selectedBooking}
        emailSubject={emailSubject}
        emailMessage={emailMessage}
        emailCC={emailCC}
        onSubjectChange={setEmailSubject}
        onMessageChange={setEmailMessage}
        onCCChange={setEmailCC}
        onSend={handleSendEmail}
      />

      {/* Change Password Modal */}
      <PasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        setPasswordMode={setPasswordMode}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onSetPasswordModeChange={setSetPasswordMode}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onSubmit={handleChangePassword}
      />

      {/* Create Booking Modal */}
      <CreateBookingModal
        open={showCreateBookingModal}
        onClose={() => setShowCreateBookingModal(false)}
        onSuccess={() => silentRefresh()}
        getAuthHeaders={getAuthHeaders}
      />

      {/* Edit Booking Modal */}
      <Dialog open={showEditBookingModal} onOpenChange={(open) => {
        setShowEditBookingModal(open);
        if (!open) { setEditingBooking(null); }
      }}>
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
                    <GoogleAddressInput
                      value={editingBooking.pickupAddress}
                      onChange={(val) => setEditingBooking(prev => ({ ...prev, pickupAddress: val }))}
                      onSelect={(val) => setEditingBooking(prev => ({ ...prev, pickupAddress: val }))}
                      placeholder="Start typing address..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Drop-off Address *</Label>
                    <GoogleAddressInput
                      value={editingBooking.dropoffAddress}
                      onChange={(val) => setEditingBooking(prev => ({ ...prev, dropoffAddress: val }))}
                      onSelect={(val) => setEditingBooking(prev => ({ ...prev, dropoffAddress: val }))}
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

                  {/* Flight Number */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      Flight Number
                    </h4>
                    <div>
                      <Label>Flight Number</Label>
                      <Input
                        value={editingBooking.flightNumber || editingBooking.flightArrivalNumber || editingBooking.flightDepartureNumber || editingBooking.arrivalFlightNumber || editingBooking.departureFlightNumber || ''}
                        onChange={(e) => setEditingBooking(prev => ({
                          ...prev,
                          flightNumber: e.target.value,
                          flightArrivalNumber: e.target.value,
                          flightDepartureNumber: e.target.value,
                          arrivalFlightNumber: e.target.value,
                          departureFlightNumber: e.target.value
                        }))}
                        placeholder="e.g., NZ123"
                        className="mt-1 bg-white"
                      />
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
      <PreviewConfirmationModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        previewHtml={previewHtml}
        previewBookingInfo={previewBookingInfo}
        onClose={() => { setShowPreviewModal(false); setPreviewHtml(''); setPreviewBookingInfo(null); }}
        onSend={handleSendAfterPreview}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <BulkDeleteDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        selectedCount={safeSelectedSet.size}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
};

export default AdminDashboard;
