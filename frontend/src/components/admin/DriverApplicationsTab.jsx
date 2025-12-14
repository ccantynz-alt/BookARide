import React, { useState, useEffect } from 'react';
import { FileText, Mail, Phone, MapPin, Car, Clock, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const DriverApplicationsTab = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API}/driver-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Ensure we always have an array
      setApplications(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load driver applications');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus, notes = '') => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API}/driver-applications/${applicationId}?status=${newStatus}&notes=${encodeURIComponent(notes)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Application ${newStatus}`);
      fetchApplications();
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    } finally {
      setUpdating(false);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      reviewing: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Pending'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Driver Applications</h2>
          <p className="text-gray-400">Review and manage driver recruitment applications</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={fetchApplications} 
            variant="outline" 
            className="border-gold text-gold hover:bg-gold hover:text-black"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{applications.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {applications.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-green-500">
                  {applications.filter(a => a.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-red-500">
                  {applications.filter(a => a.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No applications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredApplications.map((app) => (
            <Card key={app.id} className="bg-gray-800 border-gray-700 hover:border-gold/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{app.name}</h3>
                      {getStatusBadge(app.status)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{app.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{app.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{app.suburb}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        <span>{app.vehicle_type} ({app.vehicle_year})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Applied: {formatDate(app.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      setSelectedApplication(app);
                      setShowDetailsModal(true);
                    }}
                    className="bg-gold hover:bg-gold/90 text-black"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-gold">Driver Application Details</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Full Name</Label>
                  <p className="text-white font-medium">{selectedApplication.name}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="text-white">{selectedApplication.email}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Phone</Label>
                  <p className="text-white">{selectedApplication.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Suburb/Area</Label>
                  <p className="text-white">{selectedApplication.suburb}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Applied On</Label>
                  <p className="text-white">{formatDate(selectedApplication.created_at)}</p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gold mb-3">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Vehicle Type</Label>
                    <p className="text-white">{selectedApplication.vehicle_type}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Vehicle Year</Label>
                    <p className="text-white">{selectedApplication.vehicle_year}</p>
                  </div>
                </div>
              </div>

              {/* Experience & Availability */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gold mb-3">Experience & Availability</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Driving Experience</Label>
                    <p className="text-white">{selectedApplication.experience}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Availability</Label>
                    <p className="text-white">{selectedApplication.availability}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedApplication.message && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gold mb-3">Additional Message</h3>
                  <p className="text-gray-300 bg-gray-800 p-3 rounded-lg">{selectedApplication.message}</p>
                </div>
              )}

              {/* Admin Notes */}
              {selectedApplication.notes && (
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold text-gold mb-3">Admin Notes</h3>
                  <p className="text-gray-300 bg-gray-800 p-3 rounded-lg">{selectedApplication.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gold mb-3">Update Status</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'reviewing')}
                    disabled={updating || selectedApplication.status === 'reviewing'}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Mark as Reviewing
                  </Button>
                  <Button 
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                    disabled={updating || selectedApplication.status === 'approved'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                    disabled={updating || selectedApplication.status === 'rejected'}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-lg font-semibold text-gold mb-3">Contact Applicant</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={() => window.location.href = `mailto:${selectedApplication.email}`}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                  <Button
                    onClick={() => window.location.href = `tel:${selectedApplication.phone}`}
                    variant="outline"
                    className="border-gray-600 text-white hover:bg-gray-800"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverApplicationsTab;
