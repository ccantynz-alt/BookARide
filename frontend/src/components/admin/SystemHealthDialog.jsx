import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { API } from '../../config/api';

/**
 * SystemHealthDialog
 *
 * One-tap diagnostic the admin can fire from the dashboard. Hits the
 * existing /api/health/booking-system endpoint, shows a per-component
 * green/red list, and offers a "Send Test Email" button that fires
 * /api/health/email-test through the production send path.
 *
 * No fake bookings are created — the test email uses the same
 * templates and email-provider call as a real booking but writes
 * nothing to the database.
 */
const CHECK_LABELS = {
  database_connection: 'Database connection',
  database_write:      'Database read + write',
  email_provider:      'Email provider env vars',
  email_provider_live: 'Email provider live (key check)',
  stripe:              'Stripe',
  google_maps:         'Google Maps',
  pricing_engine:      'Pricing engine',
  email_template:      'Email templates',
};

const CHECK_ORDER = [
  'email_provider_live',
  'email_provider',
  'database_connection',
  'database_write',
  'stripe',
  'google_maps',
  'pricing_engine',
  'email_template',
];

function StatusRow({ label, check }) {
  if (!check) return null;
  const Icon = check.ok ? CheckCircle2 : XCircle;
  const colour = check.ok ? 'text-emerald-600' : 'text-red-600';
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colour}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5 break-words">{check.message}</p>
      </div>
    </div>
  );
}

const SystemHealthDialog = ({ open, onClose, getAuthHeaders }) => {
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthData, setHealthData]       = useState(null);
  const [healthError, setHealthError]     = useState(null);

  const [testEmail, setTestEmail]         = useState('info@bookaride.co.nz');
  const [emailSending, setEmailSending]   = useState(false);
  const [emailResult, setEmailResult]     = useState(null);

  const runHealthCheck = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    setEmailResult(null);
    try {
      // Endpoint returns 500 on broken; axios throws, but the body is in error.response.data
      const res = await axios.get(`${API}/health/booking-system`, { validateStatus: () => true });
      setHealthData(res.data);
    } catch (err) {
      setHealthError(err.message || 'Health check failed');
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) runHealthCheck();
  }, [open, runHealthCheck]);

  const sendTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) return;
    setEmailSending(true);
    setEmailResult(null);
    try {
      const res = await axios.get(
        `${API}/health/email-test?to=${encodeURIComponent(testEmail)}`,
        { ...getAuthHeaders(), validateStatus: () => true }
      );
      setEmailResult(res.data);
    } catch (err) {
      setEmailResult({
        status: 'broken',
        summary: err.message || 'Test email request failed',
        customer: { sent: false },
        admin:    { sent: false },
      });
    } finally {
      setEmailSending(false);
    }
  };

  const status        = healthData?.status;
  const summary       = healthData?.summary;
  const checks        = healthData?.checks || {};
  const orderedKeys   = CHECK_ORDER.filter(k => checks[k]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-700" />
            Booking System Health
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* === Overall status banner === */}
          {healthLoading ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Running diagnostic…</span>
            </div>
          ) : healthError ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Could not reach health endpoint</p>
                <p className="text-xs text-red-700 mt-1">{healthError}</p>
              </div>
            </div>
          ) : status === 'healthy' ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">All systems operational</p>
                <p className="text-xs text-emerald-700 mt-1">{summary}</p>
              </div>
            </div>
          ) : status === 'broken' ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900">Booking system is broken</p>
                <p className="text-xs text-red-700 mt-1">{summary}</p>
              </div>
            </div>
          ) : null}

          {/* === Per-check list === */}
          {!healthLoading && orderedKeys.length > 0 && (
            <div className="rounded-lg border border-slate-200 px-4 py-2 bg-white">
              {orderedKeys.map((key) => (
                <StatusRow
                  key={key}
                  label={CHECK_LABELS[key] || key}
                  check={checks[key]}
                />
              ))}
            </div>
          )}

          {/* === Test email block === */}
          <div className="rounded-lg border-2 border-dashed border-slate-200 px-4 py-4 bg-slate-50">
            <p className="text-sm font-semibold text-slate-900 mb-1">Send a real test email</p>
            <p className="text-xs text-slate-500 mb-3">
              Fires the production templates through the email provider. Customer template goes to
              the address below; admin template always goes to <code className="bg-slate-200 px-1 rounded">bookings@bookaride.co.nz</code>.
              No database record is created.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="info@bookaride.co.nz"
                className="flex-1"
                disabled={emailSending}
              />
              <Button
                onClick={sendTestEmail}
                disabled={emailSending || !testEmail.includes('@')}
                className="bg-slate-900 hover:bg-slate-800 text-white whitespace-nowrap"
              >
                {emailSending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending…</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" />Send Test</>
                )}
              </Button>
            </div>

            {emailResult && (
              <div className={`mt-3 rounded-lg px-3 py-2.5 border ${
                emailResult.status === 'ok'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-semibold ${
                  emailResult.status === 'ok' ? 'text-emerald-900' : 'text-red-900'
                }`}>
                  {emailResult.summary}
                </p>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    {emailResult.customer?.sent
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      : <XCircle className="w-3.5 h-3.5 text-red-600" />}
                    <span className="text-slate-700">
                      Customer template → <strong>{emailResult.customer?.to || testEmail}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {emailResult.admin?.sent
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      : <XCircle className="w-3.5 h-3.5 text-red-600" />}
                    <span className="text-slate-700">
                      Admin template → <strong>{emailResult.admin?.to || 'bookings@bookaride.co.nz'}</strong>
                    </span>
                  </div>
                </div>
                {emailResult.next_steps && (
                  <p className="text-xs text-slate-600 mt-2 italic">{emailResult.next_steps}</p>
                )}
              </div>
            )}
          </div>

          {/* === Footer actions === */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              onClick={runHealthCheck}
              disabled={healthLoading}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? 'animate-spin' : ''}`} />
              Re-run diagnostic
            </button>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default React.memo(SystemHealthDialog);
