import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Loader2, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { toast } from 'sonner';
import axios from 'axios';
import { API, BACKEND_URL } from '../config/api';

export const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [gisReady, setGisReady] = useState(false);
  const [gisError, setGisError] = useState(false);
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();

  const handleGoogleCredential = useCallback(async (response) => {
    setGoogleLoading(true);
    try {
      const result = await axios.post(`${API}/admin/google-auth/verify-token`, {
        credential: response.credential,
      });
      localStorage.setItem('adminToken', result.data.access_token);
      localStorage.setItem('adminAuth', 'true');
      toast.success('Google login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      const msg = error.response?.data?.detail || 'Google sign-in failed. Please try again.';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const initGoogleSignIn = async () => {
      try {
        const res = await axios.get(`${API}/admin/google-auth/client-id`);
        if (cancelled) return;
        const clientId = res.data.client_id;

        if (!document.querySelector(`script[src="${GOOGLE_GIS_SCRIPT}"]`)) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = GOOGLE_GIS_SCRIPT;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredential,
          auto_select: false,
        });

        // Render Google's own sign-in button into our hidden container
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: googleBtnRef.current.offsetWidth,
            text: 'signin_with',
          });
        }

        if (!cancelled) setGisReady(true);
      } catch {
        if (!cancelled) setGisError(true);
      }
    };

    initGoogleSignIn();
    return () => { cancelled = true; };
  }, [handleGoogleCredential]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/login`, {
        username: username,
        password: password
      });

      localStorage.setItem('adminToken', response.data.access_token);
      localStorage.setItem('adminAuth', 'true');

      toast.success('Login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Incorrect username or password');
      } else {
        toast.error('Login failed. Please try again.');
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or sign in with Google</span>
            </div>
          </div>

          <a
            href={`${BACKEND_URL}/api/admin/google-auth/start`}
            className="flex items-center justify-center w-full gap-2 py-3 px-4 border-2 border-gray-300 rounded-md bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors font-medium text-gray-700 no-underline shadow-sm"
          >
            {!gisReady && !gisError && (
              <div className="flex items-center justify-center w-full gap-2 py-3 px-4 border-2 border-gray-200 rounded-md bg-gray-50 text-gray-400 font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Google Sign-In...
              </div>
            )}
          </div>

          {gisError && (
            <p className="text-sm text-red-500 text-center mt-2">
              Google Sign-In unavailable. Please use username and password.
            </p>
          )}

          {googleLoading && (
            <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying your Google account...
            </div>
          )}

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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
