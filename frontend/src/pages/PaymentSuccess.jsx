import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { API } from '../config/api';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const sessionId = searchParams.get('session_id');
  const orderToken = searchParams.get('orderToken');
  const paymentMethod = searchParams.get('method');
  const status = searchParams.get('status');

  useEffect(() => {
    // Handle Afterpay callback
    if (paymentMethod === 'afterpay' && orderToken) {
      handleAfterpayCallback();
      return;
    }

    // Handle Stripe callback
    if (!sessionId) {
      navigate('/book-now');
      return;
    }

    pollPaymentStatus();
  }, [sessionId, orderToken, paymentMethod]);

  const handleAfterpayCallback = async () => {
    try {
      if (status === 'CANCELLED') {
        setPaymentStatus('cancelled');
        return;
      }

      // Capture the Afterpay payment
      const response = await axios.post(`${API}/afterpay/capture?token=${orderToken}`);

      if (response.data.status === 'APPROVED') {
        setPaymentStatus('success');
        setPaymentDetails({
          payment_method: 'Afterpay',
          order_id: response.data.order_id
        });
      } else {
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Error capturing Afterpay payment:', error);
      setPaymentStatus('error');
    }
  };

  const pollPaymentStatus = async (attempts = 0, errorCount = 0) => {
    const maxAttempts = 10;
    const maxErrors = 3;
    const pollInterval = 3000; // 3 seconds

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`);
      const data = response.data;

      if (data.payment_status === 'paid') {
        setPaymentStatus('success');
        setPaymentDetails(data);
        return;
      } else if (data.status === 'expired') {
        setPaymentStatus('expired');
        return;
      }

      // If payment is still pending, continue polling
      setPaymentStatus('processing');
      setTimeout(() => pollPaymentStatus(attempts + 1, 0), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      // Retry on transient errors instead of immediately showing error
      if (errorCount < maxErrors) {
        setPaymentStatus('processing');
        setTimeout(() => pollPaymentStatus(attempts + 1, errorCount + 1), pollInterval);
      } else {
        setPaymentStatus('timeout');
      }
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2">
            <CardContent className="p-12 text-center">
              {paymentStatus === 'checking' || paymentStatus === 'processing' ? (
                <>
                  <Loader2 className="w-16 h-16 mx-auto mb-6 text-gold animate-spin" />
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Processing Your Payment
                  </h1>
                  <p className="text-gray-600">
                    Please wait while we confirm your payment...
                  </p>
                </>
              ) : paymentStatus === 'success' ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Payment Successful!
                  </h1>
                  <p className="text-gray-600 mb-8">
                    Thank you for your booking. Your ride has been confirmed and you will receive a confirmation email shortly.
                  </p>
                  {paymentDetails && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-8">
                      <div className="text-left space-y-3">
                        {paymentDetails.referenceNumber && (
                          <div className="flex justify-between items-center bg-gold/10 p-3 rounded-lg mb-4">
                            <span className="text-gray-700 font-medium">Your Booking Reference:</span>
                            <span className="font-bold text-2xl text-gold">#{paymentDetails.referenceNumber}</span>
                          </div>
                        )}
                        {paymentDetails.amount_total != null && paymentDetails.currency && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount Paid:</span>
                            <span className="font-semibold text-gray-900">
                              ${(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-semibold text-green-600">Confirmed</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        Please save this reference number for your records.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/')}
                    className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
                  >
                    Return to Home
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
                    {paymentStatus === 'expired' ? (
                      <span className="text-4xl text-red-600">✕</span>
                    ) : (
                      <AlertTriangle className="w-12 h-12 text-amber-600" />
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {paymentStatus === 'expired' ? 'Payment Session Expired' :
                     'Payment Verification Pending'}
                  </h1>
                  <p className="text-gray-600 mb-8">
                    {paymentStatus === 'expired'
                      ? 'Your payment session has expired. Please try booking again.'
                      : 'Your payment may have been processed successfully but we were unable to confirm it immediately. Please check your email for a booking confirmation. If you do not receive an email within 10 minutes, please contact us and we will verify your payment.'}
                  </p>
                  {paymentStatus === 'expired' ? (
                    <button
                      onClick={() => navigate('/book-now')}
                      className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">
                        Do not attempt to pay again until you have confirmed with us.
                      </p>
                      <button
                        onClick={() => navigate('/')}
                        className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
                      >
                        Return to Home
                      </button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
