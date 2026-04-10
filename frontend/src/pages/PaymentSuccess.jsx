import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, MapPin, Calendar, Clock, Plane, Users, Smartphone } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { API } from '../config/api';

export const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('checking');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const sessionId = searchParams.get('session_id');
  const cancelledRef = React.useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (!sessionId) {
      navigate('/book-now');
      return () => { cancelledRef.current = true; };
    }

    pollPaymentStatus();
    return () => { cancelledRef.current = true; };
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    if (cancelledRef.current) return;
    const maxAttempts = 10;
    const pollInterval = 3000; // 3 seconds (total wait: 30s)

    if (attempts >= maxAttempts) {
      // Before giving up, try one last direct status check
      try {
        const lastCheck = await axios.get(`${API}/payment/status/${sessionId}`);
        if (cancelledRef.current) return;
        if (lastCheck.data?.payment_status === 'paid') {
          setPaymentStatus('success');
          setPaymentDetails(lastCheck.data);
          return;
        }
      } catch (err) {
        console.error('Final payment status check failed:', err);
      }
      if (!cancelledRef.current) setPaymentStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payment/status/${sessionId}`);
      if (cancelledRef.current) return;
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
      if (!cancelledRef.current) setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      if (cancelledRef.current) return;
      console.error('Error checking payment status:', error);
      // Don't give up on network errors — retry
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
      } else {
        setPaymentStatus('error');
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

                        {/* Trip Details */}
                        {paymentDetails.pickupAddress && (
                          <>
                            <hr className="my-3 border-gray-200" />
                            <h3 className="font-semibold text-gray-800 mb-2">Trip Details</h3>
                            {paymentDetails.pickupDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Date:</span>
                                <span className="font-medium text-gray-900">{paymentDetails.pickupDate}</span>
                              </div>
                            )}
                            {paymentDetails.pickupTime && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Time:</span>
                                <span className="font-medium text-gray-900">{paymentDetails.pickupTime}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> From:</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">{paymentDetails.pickupAddress}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> To:</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">{paymentDetails.dropoffAddress}</span>
                            </div>
                            {paymentDetails.flightNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Flight:</span>
                                <span className="font-medium text-gray-900">{paymentDetails.flightNumber}</span>
                              </div>
                            )}
                            {paymentDetails.passengers && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Passengers:</span>
                                <span className="font-medium text-gray-900">{paymentDetails.passengers}</span>
                              </div>
                            )}
                          </>
                        )}

                        {/* Return Trip Details */}
                        {paymentDetails.bookReturn && paymentDetails.returnDate && (
                          <>
                            <hr className="my-3 border-gray-200" />
                            <h3 className="font-semibold text-gray-800 mb-2">Return Trip</h3>
                            <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Return Date:</span>
                              <span className="font-medium text-gray-900">{paymentDetails.returnDate}</span>
                            </div>
                            {paymentDetails.returnTime && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Return Time:</span>
                                <span className="font-medium text-gray-900">{paymentDetails.returnTime}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> From:</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">{paymentDetails.dropoffAddress}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> To:</span>
                              <span className="font-medium text-gray-900 text-right max-w-[60%]">{paymentDetails.pickupAddress}</span>
                            </div>
                            {paymentDetails.returnFlightNumber && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-1"><Plane className="w-3.5 h-3.5" /> Return Flight:</span>
                                <span className="font-medium text-gray-900">{paymentDetails.returnFlightNumber}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        Please save this reference number for your records.
                      </p>
                    </div>
                  )}
                  {/* eSIM Upsell */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Smartphone className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-gray-900 mb-1">Need Mobile Data When You Land?</h3>
                        <p className="text-gray-600 text-sm mb-3">
                          Get an eSIM for New Zealand — instant mobile data, no physical SIM card needed.
                          Activate before your flight and stay connected from the moment you touch down.
                        </p>
                        <a
                          href="https://zoobicon.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
                        >
                          <Smartphone className="w-4 h-4" />
                          Get Your eSIM at Zoobicon.com
                        </a>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/')}
                    className="bg-gold hover:bg-gold/90 text-black font-semibold px-8 py-3 rounded-lg transition-colors"
                  >
                    Return to Home
                  </button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-4xl text-red-600">✕</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {paymentStatus === 'expired' ? 'Payment Session Expired' :
                     paymentStatus === 'timeout' ? 'Payment Check Timeout' :
                     'Payment Error'}
                  </h1>
                  <p className="text-gray-600 mb-8">
                    {paymentStatus === 'expired'
                      ? 'Your payment session has expired. Please try booking again.'
                      : paymentStatus === 'timeout'
                      ? 'We could not verify your payment in time. Please check your email for confirmation.'
                      : 'There was an error processing your payment. Please contact us for assistance.'}
                  </p>
                  <button
                    onClick={() => navigate('/book-now')}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
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
