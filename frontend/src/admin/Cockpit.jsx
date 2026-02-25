import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Calendar,
  CheckCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../config/api';

export default function Cockpit() {
  const [health, setHealth] = useState(null);
  const [seoHealth, setSeoHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runCheckLoading, setRunCheckLoading] = useState(false);
  const [fixNowLoading, setFixNowLoading] = useState(false);
  const [calendarSyncLoading, setCalendarSyncLoading] = useState(false);
  const [seoCheckLoading, setSeoCheckLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/system-health`, { headers: authHeaders });
      setHealth(response.data);
    } catch (err) {
      console.error('Cockpit fetch health:', err);
      toast.error('Could not load system health');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeoHealth = async () => {
    try {
      const response = await axios.get(`${API}/admin/seo-health`, { headers: authHeaders });
      setSeoHealth(response.data);
    } catch (err) {
      console.error('Cockpit fetch SEO health:', err);
      setSeoHealth(null);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchSeoHealth();
  }, []);

  const runErrorCheck = async () => {
    setRunCheckLoading(true);
    try {
      await axios.post(`${API}/admin/run-error-check`, {}, { headers: authHeaders });
      await fetchHealth();
      toast.success('System check completed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Run check failed');
    } finally {
      setRunCheckLoading(false);
    }
  };

  const runFixNow = async () => {
    setFixNowLoading(true);
    try {
      const response = await axios.get(`${API}/admin/fix-now`, { headers: authHeaders });
      const data = response.data;
      if (data.success) {
        toast.success(data.message || 'Fix completed');
        await fetchHealth();
      } else {
        toast.error(data.error || 'Fix failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Fix failed');
    } finally {
      setFixNowLoading(false);
    }
  };

  const runCalendarSync = async () => {
    setCalendarSyncLoading(true);
    try {
      const response = await axios.post(`${API}/admin/batch-sync-calendar`, {}, { headers: authHeaders });
      const data = response.data;
      if (data.success) {
        toast.success(data.message || 'Calendar sync started');
        await fetchHealth();
      } else {
        toast.error(data.error || 'Calendar sync failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Calendar sync failed');
    } finally {
      setCalendarSyncLoading(false);
    }
  };

  const runSeoCheck = async () => {
    setSeoCheckLoading(true);
    try {
      await axios.post(`${API}/admin/run-seo-check`, {}, { headers: authHeaders });
      await fetchSeoHealth();
      toast.success('SEO check completed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'SEO check failed');
    } finally {
      setSeoCheckLoading(false);
    }
  };

  const status = health?.health_status || 'unknown';
  const message = health?.health_message || '';
  const live = health?.live_stats || {};
  const report = health?.latest_report || {};
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const warnings = Array.isArray(report.warnings) ? report.warnings : [];

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-slate-600" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">System Cockpit</h2>
                <p className="text-sm text-slate-500">Diagnostics and self-healing</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealth}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2">Refresh</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={runErrorCheck}
                disabled={runCheckLoading}
              >
                {runCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-2">Run check</span>
              </Button>
            </div>
          </div>

          {loading && !health ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Health status */}
              <div
                className={`rounded-xl p-4 mb-6 ${
                  status === 'critical'
                    ? 'bg-red-50 border border-red-200'
                    : status === 'warning'
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-green-50 border border-green-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {status === 'critical' && <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />}
                  {status === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />}
                  {status === 'healthy' && <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />}
                  <div>
                    <p className={`font-medium ${status === 'critical' ? 'text-red-800' : status === 'warning' ? 'text-amber-800' : 'text-green-800'}`}>
                      {message || (status === 'healthy' ? 'All systems operational' : status)}
                    </p>
                    {health?.checked_at && (
                      <p className="text-xs text-slate-500 mt-1">Last checked: {health.checked_at}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Live stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Total bookings</p>
                  <p className="text-lg font-semibold text-slate-900">{live.total_bookings ?? '–'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Today</p>
                  <p className="text-lg font-semibold text-slate-900">{live.today_bookings ?? '–'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Tomorrow</p>
                  <p className="text-lg font-semibold text-slate-900">{live.tomorrow_bookings ?? '–'}</p>
                </div>
                <div className={`rounded-lg p-3 border ${(live.unassigned_today ?? 0) > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="text-xs text-slate-500">Unassigned today</p>
                  <p className="text-lg font-semibold text-slate-900">{live.unassigned_today ?? '–'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Unpaid today</p>
                  <p className="text-lg font-semibold text-slate-900">{live.unpaid_today ?? '–'}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                  <p className="text-xs text-slate-500">Active drivers</p>
                  <p className="text-lg font-semibold text-slate-900">{live.active_drivers ?? '–'}</p>
                </div>
              </div>

              {/* Last report: issues & warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                  <h3 className="font-medium text-red-800 flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    Issues ({report.issues_count ?? 0})
                  </h3>
                  {issues.length === 0 ? (
                    <p className="text-sm text-slate-500">No critical issues in last report</p>
                  ) : (
                    <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                      {issues.slice(0, 10).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                  <h3 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings ({report.warnings_count ?? 0})
                  </h3>
                  {warnings.length === 0 ? (
                    <p className="text-sm text-slate-500">No warnings in last report</p>
                  ) : (
                    <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                      {warnings.slice(0, 10).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Self-heal actions */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-medium text-slate-800 flex items-center gap-2 mb-3">
                  <Wrench className="w-4 h-4" />
                  Quick fixes
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  One-click data repairs. These do not fix application code—only booking data and sync.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={runFixNow}
                    disabled={fixNowLoading}
                  >
                    {fixNowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                    <span className="ml-2">Fix imported bookings</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={runCalendarSync}
                    disabled={calendarSyncLoading}
                  >
                    {calendarSyncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    <span className="ml-2">Sync all to calendar</span>
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Fix imported: restore deleted WordPress imports and fix date formats. Sync to calendar: add all bookings missing from Google Calendar.
                </p>
              </div>

              {/* SEO Health Agent */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 mt-6">
                <h3 className="font-medium text-slate-800 flex items-center gap-2 mb-3">
                  <Search className="w-4 h-4" />
                  SEO health (technical)
                </h3>
                <p className="text-sm text-slate-600 mb-3">
                  Sitemap and key pages checked weekly. For rank tracking and global visibility see <code className="text-xs bg-slate-200 px-1 rounded">SEO-AGENT-DESIGN.md</code>.
                </p>
                {seoHealth && (
                  <div className={`rounded-lg p-3 mb-3 ${seoHealth.status === 'critical' ? 'bg-red-50 border border-red-200' : seoHealth.status === 'warning' ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                    <p className="text-sm font-medium text-slate-800">{seoHealth.message}</p>
                    {seoHealth.checked_at && <p className="text-xs text-slate-500 mt-1">Last run: {new Date(seoHealth.checked_at).toLocaleString()}</p>}
                    {Array.isArray(seoHealth.latest_report?.issues) && seoHealth.latest_report.issues.length > 0 && (
                      <ul className="text-xs text-red-700 mt-2 list-disc list-inside">{seoHealth.latest_report.issues.slice(0, 5).map((item, i) => <li key={i}>{item}</li>)}</ul>
                    )}
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={runSeoCheck} disabled={seoCheckLoading}>
                  {seoCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-2">Run SEO check</span>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
