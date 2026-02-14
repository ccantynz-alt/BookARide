import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!BACKEND_URL || BACKEND_URL.includes('localhost')) {
        console.warn('AdminLogin BACKEND_URL looks suspicious:', BACKEND_URL);
      }
      const response = await axios.post(`${API}/admin/login`, {
        username: username,
        password: password
      });

      // Store the token
      localStorage.setItem('adminToken', response.data.access_token);
      localStorage.setItem('adminAuth', 'true');
      
      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      console.error('Login error:', {
        backendUrl: BACKEND_URL,
        apiBase: API,
        status,
        detail,
        data: error.response?.data,
        message: error.message
      });
      if (status === 401) {
        toast.error('Incorrect username or password');
      } else if (!status) {
        toast.error('Network/CORS error reaching backend. Check REACT_APP_BACKEND_URL.');
      } else {
        toast.error(detail || `Login failed (HTTP ${status}). Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-2 border-gold/30">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gold rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Login</h1>
            <p className="text-gray-600">Sign in to access dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                required
                disabled={loading}
                className="transition-all duration-200 focus:ring-2 focus:ring-gold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                disabled={loading}
                className="transition-all duration-200 focus:ring-2 focus:ring-gold"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold py-6 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </form>

          {/* Forgot Password Link */}
          <div className="mt-6 text-center">
            <Link 
              to="/admin/forgot-password" 
              className="text-sm text-gold hover:text-gold/80 hover:underline inline-flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Forgot your password?
            </Link>
          </div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Secure admin authentication
          </p>
          <p className="text-[10px] text-gray-400 text-center mt-2 break-all">
            API: {API}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
