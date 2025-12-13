import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Settings } from 'lucide-react';

const AdminBackButton = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if user is logged in as admin
    const adminToken = localStorage.getItem('adminToken');
    const adminAuth = localStorage.getItem('adminAuth');
    setIsAdmin(!!(adminToken || adminAuth));
  }, [location]);

  // Don't show on admin pages or login pages
  const isAdminPage = location.pathname.startsWith('/admin');
  const isDriverPage = location.pathname.startsWith('/driver');
  
  if (!isAdmin || isAdminPage || isDriverPage) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
      >
        <Settings className="w-4 h-4" />
        <span>Back to Admin</span>
      </button>
    </div>
  );
};

export default AdminBackButton;
