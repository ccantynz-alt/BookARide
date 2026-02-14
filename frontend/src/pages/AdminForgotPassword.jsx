import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!BACKEND_URL || BACKEND_URL.includes('localhost')) {
        console.warn('AdminForgotPassword BACKEND_URL looks suspicious:', BACKEND_URL);
      }
      await axios.post(`${API}/admin/password-reset/request`, {
        email: email
      });

      setSubmitted(true);
      toast.success('If this email is registered, you will receive a reset link.');
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      console.error('Password reset error:', {
        backendUrl: BACKEND_URL,
        apiBase: API,
        status,
        detail,
        data: error.response?.data,
        message: error.message
      });
      if (!status) {
        toast.error('Network/CORS error reaching backend. Check REACT_APP_BACKEND_URL.');
      } else {
        toast.error(detail || `Failed to request reset (HTTP ${status}).`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2 border-gold/30">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              If <strong>{email}</strong> is registered as an admin, you&apos;ll receive a password reset link shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The link will expire in 1 hour. Don&apos;t forget to check your spam folder.
            </p>
            <Link 
              to="/admin/login" 
              className="inline-flex items-center text-gold hover:text-gold/80 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 border-gold/30">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600">Enter your admin email to receive a reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bookaride.co.nz"
                required
                disabled={loading}
                className="transition-all duration-200 focus:ring-2 focus:ring-gold"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading || !email}
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              to="/admin/login" 
              className="text-sm text-gray-600 hover:text-gold inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-4 break-all">
            API: {API}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminForgotPassword;
