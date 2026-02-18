import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, Loader2, Car, Mail, Clock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
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
    if (paymentMethod === 'afterpay' && orderToken) {
      handleAfterpayCallback();
      return;
    }
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
      const response = await axios.post(`${API}/afterpay/capture?token=${orderToken}`);
      if (response.data.status === 'APPROVED') {
        setPaymentStatus('success');
        setPaymentDetails({ payment_method: 'Afterpay', order_id: response.data.order_id });
      } else {
        setPaymentStatus('error');
      }
    } catch (error) {
      console.error('Error capturing Afterpay payment:', error);
      setPaymentStatus('error');
    }
  };

  const pollPaymentStatus = async (attempts = 0) => {
    if (attempts >= 5) { setPaymentStatus('timeout'); return; }
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
      setPaymentStatus('processing');
      setTimeout(() => pollPaymentStatus(attempts + 1), 2000);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('error');
    }
  };

  const isLoading = paymentStatus === 'checking' || paymentStatus === 'processing';
  const isSuccess = paymentStatus === 'success';
  const isError = !isLoading && !isSuccess;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/40 pt-20 pb-16">

      {/* Decorative background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-slate-200/60 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">

          {/* ─── LOADING ─── */}
          {isLoading && (
            <div className="bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-gold animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Confirming your booking</h1>
              <p className="text-slate-500 text-sm">Hang tight — we're verifying your payment securely…</p>
              <div className="flex justify-center gap-1.5 mt-6">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full bg-gold/40 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
          )}

          {/* ─── SUCCESS ─── */}
          {isSuccess && (
            <div className="space-y-5">

              {/* Hero success card */}
              <div className="bg-white/85 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl overflow-hidden">
                {/* Gold top bar */}
                <div className="h-1.5 bg-gradient-to-r from-gold via-amber-400 to-gold" />

                <div className="p-10 text-center">
                  {/* Animated checkmark */}
                  <div className="relative inline-flex mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 border-2 border-emerald-400/30 flex items-center justify-center shadow-lg">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                        <Check className="w-9 h-9 text-white stroke-[2.5]" />
                      </div>
                    </div>
                    <span className="absolute -top-1 -right-1 text-xl">🎉</span>
                  </div>

                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Booking Confirmed!</h1>
                  <p className="text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
                    Your payment was successful and your ride is locked in.
                    A confirmation has been sent to your email and phone.
                  </p>

                  {/* Reference number — big and prominent */}
                  {paymentDetails?.referenceNumber && (
                    <div className="inline-flex items-center gap-3 bg-gold/8 border border-gold/25 rounded-2xl px-6 py-4 mb-6">
                      <span className="text-slate-500 text-sm font-medium">Booking Reference</span>
                      <span className="text-3xl font-bold text-gold tracking-wide">#{paymentDetails.referenceNumber}</span>
                    </div>
                  )}

                  {/* Amount */}
                  {paymentDetails?.amount_total && (
                    <div className="flex items-center justify-center gap-2 text-slate-600 text-sm">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>
                        <strong className="text-slate-800">${(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}</strong>
                        {' '}paid via {paymentDetails.payment_method || 'card'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* What happens next */}
              <div className="bg-white/80 backdrop-blur-md border border-white/40 shadow-xl rounded-2xl p-7">
                <h2 className="text-base font-semibold text-slate-800 mb-5 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold">?</span>
                  What happens next
                </h2>
                <div className="space-y-4">
                  {[
                    { icon: Mail, color: 'text-blue-500 bg-blue-50', title: 'Confirmation sent', desc: 'Check your email and SMS — your booking details are on their way.' },
                    { icon: Car, color: 'text-emerald-500 bg-emerald-50', title: 'Driver assigned', desc: 'We'll confirm your driver before your trip and send their details.' },
                    { icon: Clock, color: 'text-amber-500 bg-amber-50', title: 'Day of travel', desc: 'Your driver will be on time. For airport pickups, we track your flight.' },
                  ].map(({ icon: Icon, color, title, desc }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{title}</p>
                        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact / help strip */}
              <div className="bg-white/70 backdrop-blur-sm border border-white/40 shadow-md rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-700 text-sm">Need to change something?</p>
                  <p className="text-slate-400 text-xs">Get in touch and we'll sort it out.</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="mailto:info@bookaride.co.nz"
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" /> Email us
                  </a>
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 bg-gold hover:bg-gold/90 text-black text-sm font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm"
                  >
                    Home <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ─── ERROR / EXPIRED / TIMEOUT ─── */}
          {isError && (
            <div className="bg-white/85 backdrop-blur-md border border-white/40 shadow-2xl rounded-3xl overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />
              <div className="p-10 text-center">

                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 border border-red-200/60 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  {paymentStatus === 'expired' ? 'Session Expired' :
                   paymentStatus === 'timeout' ? 'Still Checking…' :
                   paymentStatus === 'cancelled' ? 'Payment Cancelled' :
                   'Something Went Wrong'}
                </h1>

                <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
                  {paymentStatus === 'expired'
                    ? 'Your payment session expired. Please start a new booking.'
                    : paymentStatus === 'timeout'
                    ? 'We couldn't confirm your payment in time. Check your email — if payment went through, your booking is confirmed.'
                    : paymentStatus === 'cancelled'
                    ? 'Your Afterpay payment was cancelled. No charge was made.'
                    : 'There was a problem processing your payment. Please contact us or try again.'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/book-now')}
                    className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Try Again
                  </button>
                  <a
                    href="mailto:info@bookaride.co.nz"
                    className="flex items-center justify-center gap-2 bg-gold hover:bg-gold/90 text-black font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Mail className="w-4 h-4" /> Contact Us
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
