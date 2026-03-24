import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Shield, Lock } from 'lucide-react';
import axios from 'axios';
import { API } from '../config/api';

const PayNow = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, redirecting, error, paid
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) {
      navigate('/book-now');
      return;
    }
    createCheckoutAndRedirect();
  }, [bookingId]);

  const createCheckoutAndRedirect = async () => {
    try {
      setStatus('loading');
      const response = await axios.post(`${API}/payment/create-checkout-link`, {
        booking_id: bookingId,
        origin_url: window.location.origin,
      });

      if (response.data?.url) {
        setStatus('redirecting');
        window.location.href = response.data.url;
      } else {
        setStatus('error');
        setError('Unable to create payment session. Please contact us.');
      }
    } catch (err) {
      const detail = err.response?.data?.detail || '';
      if (detail.includes('already been paid')) {
        setStatus('paid');
      } else {
        setStatus('error');
        setError(detail || 'Something went wrong. Please try again or contact us.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        {/* Logo / Brand */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Book A Ride NZ</h1>
          <p className="text-sm text-gray-500 mt-1">Secure Payment</p>
        </div>

        {status === 'loading' && (
          <div>
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">Preparing your secure payment...</p>
            <p className="text-gray-500 text-sm mt-2">You'll be redirected to Stripe's secure checkout.</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-xs">
              <Lock className="w-3 h-3" />
              <span>256-bit SSL encrypted</span>
            </div>
          </div>
        )}

        {status === 'redirecting' && (
          <div>
            <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">Redirecting to secure checkout...</p>
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-xs">
              <Shield className="w-3 h-3" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        )}

        {status === 'paid' && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-700 text-lg font-medium">This booking has already been paid</p>
            <p className="text-gray-500 text-sm mt-2">
              If you have questions, contact us at{' '}
              <a href="mailto:bookings@bookaride.co.nz" className="text-[#D4AF37] underline">
                bookings@bookaride.co.nz
              </a>
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">Payment Link Issue</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
            <div className="mt-6 space-y-3">
              <button
                onClick={createCheckoutAndRedirect}
                className="w-full bg-[#D4AF37] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#c4a030] transition-colors"
              >
                Try Again
              </button>
              <p className="text-gray-400 text-xs">
                Or contact us at{' '}
                <a href="mailto:bookings@bookaride.co.nz" className="underline">
                  bookings@bookaride.co.nz
                </a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayNow;
