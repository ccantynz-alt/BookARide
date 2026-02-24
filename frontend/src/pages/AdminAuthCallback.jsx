import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API } from '../config/api';

export const AdminAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      // Handle error from backend redirect (e.g. non-admin email)
      if (params.get('error') === 'unauthorized') {
        setStatus('error');
        setErrorMessage(params.get('message') || 'This Google account is not authorized as an admin.');
        return;
      }

      // New flow: token in URL hash from backend redirect
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminAuth', 'true');
        setStatus('success');
        toast.success('Google login successful!');
        setTimeout(() => navigate('/admin/dashboard', { replace: true }), 1000);
        return;
      }

      // Legacy flow: session_id from Emergent
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      if (sessionIdMatch) {
        try {
          const response = await axios.post(
            `${API}/admin/google-auth/session`,
            { session_id: sessionIdMatch[1] },
            { withCredentials: true }
          );
          if (response.data.access_token) {
            localStorage.setItem('adminToken', response.data.access_token);
            localStorage.setItem('adminAuth', 'true');
          }
          if (response.data.admin) {
            localStorage.setItem('adminInfo', JSON.stringify(response.data.admin));
          }
          setStatus('success');
          toast.success('Google login successful!');
          setTimeout(() => navigate('/admin/dashboard', { state: { user: response.data.admin }, replace: true }), 1000);
        } catch (error) {
          setStatus('error');
          setErrorMessage(error.response?.data?.detail || 'Authentication failed.');
        }
        return;
      }

      setStatus('error');
      setErrorMessage('No session found. Please try logging in again.');
    };

    processAuth();
  }, [navigate]);

  const handleRetry = () => {
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 border-gold/30">
        <CardContent className="p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h2>
              <p className="text-gray-600">Please wait while we verify your Google account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Successful!</h2>
              <p className="text-gray-600">Redirecting to dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-red-600 mb-6">{errorMessage}</p>
              <button
                onClick={handleRetry}
                className="bg-gold hover:bg-gold/90 text-black font-semibold py-3 px-6 rounded-md transition-colors"
              >
                Back to Login
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthCallback;
