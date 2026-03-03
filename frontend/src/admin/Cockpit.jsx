import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Server,
  Database,
  Clock,
  Zap,
  Shield,
  TrendingUp,
  ArrowUpRight,
  CircleDot,
  PlayCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Gauge,
  HeartPulse,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../config/api';

// --- Helpers ---
function StatusDot({ status }) {
  const color =
    status === 'critical' ? 'bg-red-500' :
    status === 'warning' ? 'bg-amber-500' :
    status === 'healthy' ? 'bg-green-500' : 'bg-slate-400';
  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${color}`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${color}`} />
    </span>
  );
}

function StatCard({ label, value, alert, icon: Icon, sub }) {
  return (
    <div className={`rounded-lg p-3 border ${alert ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
      </div>
      <p className="text-xl font-bold text-slate-900">{value ?? '-'}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3 className="font-semibold text-slate-800 flex items-center gap-2">
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Collapsible({ title, icon: Icon, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-slate-500" />}
          <span className="font-medium text-slate-800 text-sm">{title}</span>
          {badge != null && (
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}

// --- Main Cockpit ---
export default function Cockpit() {
  const [health, setHealth] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [seoHealth, setSeoHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [runCheckLoading, setRunCheckLoading] = useState(false);
  const [fixNowLoading, setFixNowLoading] = useState(false);
  const [calendarSyncLoading, setCalendarSyncLoading] = useState(false);
  const [seoCheckLoading, setSeoCheckLoading] = useState(false);
  const [healLoading, setHealLoading] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchAll = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      const [healthRes, metricsRes, dbRes, seoRes] = await Promise.allSettled([
        axios.get(`${API}/admin/system-health`, { headers: authHeaders }),
        axios.get(`${API}/admin/cockpit/metrics`, { headers: authHeaders }),
        axios.get(`${API}/admin/cockpit/db-health`, { headers: authHeaders }),
        axios.get(`${API}/admin/seo-health`, { headers: authHeaders }),
      ]);
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value.data);
      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data);
      if (dbRes.status === 'fulfilled') setDbHealth(dbRes.value.data);
      if (seoRes.status === 'fulfilled') setSeoHealth(seoRes.value.data);
      if (showToast) toast.success('Dashboard refreshed');
    } catch (err) {
      console.error('Cockpit fetch:', err);
      toast.error('Could not load cockpit data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 30s
  useEffect(() => {
    fetchAll();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchAll(), 30000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, fetchAll]);

  // --- Actions ---
  const runErrorCheck = async () => {
    setRunCheckLoading(true);
    try {
      await axios.post(`${API}/admin/run-error-check`, {}, { headers: authHeaders });
      await fetchAll();
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
      if (response.data.success) {
        toast.success(response.data.message || 'Fix completed');
        await fetchAll();
      } else {
        toast.error(response.data.error || 'Fix failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Fix failed');
    } finally {
      setFixNowLoading(false);
    }
  };

  const runCalendarSync = async () => {
    setCalendarSyncLoading(true);
    try {
      const response = await axios.post(`${API}/admin/batch-sync-calendar`, {}, { headers: authHeaders });
      if (response.data.success) {
        toast.success(response.data.message || 'Calendar sync started');
        await fetchAll();
      } else {
        toast.error(response.data.error || 'Calendar sync failed');
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
      await fetchAll();
      toast.success('SEO check completed');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'SEO check failed');
    } finally {
      setSeoCheckLoading(false);
    }
  };

  const runSelfHeal = async (action) => {
    setHealLoading(action);
    try {
      const res = await axios.post(`${API}/admin/cockpit/self-heal`, { action }, { headers: authHeaders });
      if (res.data.success) {
        toast.success(res.data.details || 'Done');
        await fetchAll();
      } else {
        toast.error(res.data.details || 'Action failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Self-heal failed');
    } finally {
      setHealLoading(null);
    }
  };

  // --- Derived data ---
  const status = health?.health_status || 'unknown';
  const message = health?.health_message || '';
  const live = health?.live_stats || {};
  const report = health?.latest_report || {};
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const warnings = Array.isArray(report.warnings) ? report.warnings : [];
  const errorRate = metrics?.error_rate_pct ?? null;
  const recentErrors = metrics?.recent_errors ?? [];
  const slowRequests = metrics?.slow_requests ?? [];
  const bgTasks = metrics?.bg_task_runs ?? [];
  const healLog = metrics?.self_heal_log ?? [];
  const topEndpoints = metrics?.top_endpoints ?? [];
  const schedulerJobs = metrics?.scheduler_jobs ?? [];
  const collections = dbHealth?.collections ?? {};
  const orphans = dbHealth?.orphans ?? {};

  const overallGrade =
    status === 'critical' ? 'CRITICAL' :
    (errorRate !== null && errorRate > 5) ? 'DEGRADED' :
    status === 'warning' ? 'WARNING' :
    'HEALTHY';

  const gradeColor = {
    CRITICAL: 'text-red-600 bg-red-50 border-red-200',
    DEGRADED: 'text-orange-600 bg-orange-50 border-orange-200',
    WARNING: 'text-amber-600 bg-amber-50 border-amber-200',
    HEALTHY: 'text-green-600 bg-green-50 border-green-200',
  }[overallGrade];

  return (
    <div className="space-y-5">
      {/* === HEADER BAR === */}
      <Card className="border-slate-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">System Cockpit</h2>
                <p className="text-xs text-slate-500">Real-time monitoring, diagnostics & self-healing agents</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Auto-refresh 30s
              </label>
              <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                <span className="ml-1.5 hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="default" size="sm" onClick={runErrorCheck} disabled={runCheckLoading}>
                {runCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span className="ml-1.5 hidden sm:inline">Deep scan</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && !health ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* === OVERALL STATUS BANNER === */}
          <div className={`rounded-xl p-4 border ${gradeColor}`}>
            <div className="flex items-center gap-3">
              <StatusDot status={status} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{overallGrade}</span>
                  {metrics?.uptime_human && (
                    <span className="text-xs opacity-70 font-normal">| Uptime: {metrics.uptime_human}</span>
                  )}
                </div>
                <p className="text-sm opacity-80">
                  {message || 'All systems operational'}
                  {errorRate !== null && ` | Error rate: ${errorRate}%`}
                  {metrics?.active_requests > 0 && ` | ${metrics.active_requests} active request(s)`}
                </p>
              </div>
              {health?.checked_at && (
                <span className="text-[11px] opacity-60 whitespace-nowrap">Last: {health.checked_at}</span>
              )}
            </div>
          </div>

          {/* === LIVE STATS GRID === */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total bookings" value={live.total_bookings} icon={Database} />
            <StatCard label="Today" value={live.today_bookings} icon={Calendar} />
            <StatCard label="Tomorrow" value={live.tomorrow_bookings} icon={Calendar} />
            <StatCard
              label="Unassigned today"
              value={live.unassigned_today}
              alert={(live.unassigned_today ?? 0) > 0}
              icon={AlertCircle}
            />
            <StatCard label="Unpaid today" value={live.unpaid_today} icon={TrendingUp} />
            <StatCard label="Active drivers" value={live.active_drivers} icon={CircleDot} />
          </div>

          {/* === SERVER METRICS (from middleware) === */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard label="Total requests" value={metrics.total_requests?.toLocaleString()} icon={Server} sub="Since last restart" />
              <StatCard
                label="Error rate"
                value={`${metrics.error_rate_pct}%`}
                alert={metrics.error_rate_pct > 2}
                icon={Shield}
                sub={`${metrics.total_errors} total errors`}
              />
              <StatCard label="Active now" value={metrics.active_requests} icon={Activity} />
              <StatCard label="Uptime" value={metrics.uptime_human} icon={Clock} />
            </div>
          )}

          {/* === ISSUES & WARNINGS === */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
              <h3 className="font-medium text-red-800 flex items-center gap-2 mb-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                Issues ({report.issues_count ?? 0})
              </h3>
              {issues.length === 0 ? (
                <p className="text-sm text-slate-500">No critical issues</p>
              ) : (
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                  {issues.slice(0, 10).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <h3 className="font-medium text-amber-800 flex items-center gap-2 mb-2 text-sm">
                <AlertTriangle className="w-4 h-4" />
                Warnings ({report.warnings_count ?? 0})
              </h3>
              {warnings.length === 0 ? (
                <p className="text-sm text-slate-500">No warnings</p>
              ) : (
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                  {warnings.slice(0, 10).map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          </div>

          {/* === SELF-HEALING AGENTS === */}
          <Collapsible title="Self-Healing Agents" icon={Wrench} defaultOpen badge={`${healLog.length} runs`}>
            <p className="text-sm text-slate-600 mb-4">
              One-click data repairs and system recovery. These agents fix data issues and restart services automatically.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {[
                { action: 'fix_orphan_statuses', label: 'Fix orphan statuses', desc: 'Set status=pending on bookings missing a status field' },
                { action: 'fix_missing_refs', label: 'Fix missing refs', desc: 'Generate reference numbers for bookings without one' },
                { action: 'fix_missing_dates', label: 'Audit missing dates', desc: 'Find bookings with no date for manual review' },
                { action: 'reconnect_db', label: 'Reconnect database', desc: 'Force close and reopen the MongoDB connection' },
                { action: 'restart_scheduler', label: 'Restart scheduler', desc: 'Restart APScheduler background jobs' },
                { action: 'purge_old_errors', label: 'Purge old reports', desc: 'Delete error check reports older than 90 days' },
              ].map(({ action, label, desc }) => (
                <button
                  key={action}
                  onClick={() => runSelfHeal(action)}
                  disabled={healLoading === action}
                  className="text-left rounded-lg border border-slate-200 p-3 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {healLoading === action ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <Wrench className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="font-medium text-sm text-slate-800">{label}</span>
                  </div>
                  <p className="text-xs text-slate-500">{desc}</p>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button variant="outline" onClick={runFixNow} disabled={fixNowLoading}>
                {fixNowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
                <span className="ml-2">Fix imported bookings</span>
              </Button>
              <Button variant="outline" onClick={runCalendarSync} disabled={calendarSyncLoading}>
                {calendarSyncLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                <span className="ml-2">Sync all to calendar</span>
              </Button>
            </div>
            {/* Recent self-heal log */}
            {healLog.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium text-slate-500 mb-2">Recent self-heal actions</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {healLog.slice().reverse().slice(0, 10).map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="text-slate-400 tabular-nums">{new Date(entry.ts).toLocaleTimeString()}</span>
                      <span className="font-medium">{entry.action}</span>
                      <span className="text-slate-400">-</span>
                      <span className="truncate">{entry.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Collapsible>

          {/* === RECENT ERRORS === */}
          <Collapsible title="Recent Errors (5xx)" icon={XCircle} badge={recentErrors.length}>
            {recentErrors.length === 0 ? (
              <p className="text-sm text-slate-500">No recent server errors</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-1.5 pr-3">Time</th>
                      <th className="py-1.5 pr-3">Endpoint</th>
                      <th className="py-1.5 pr-3">Status</th>
                      <th className="py-1.5 pr-3">Duration</th>
                      <th className="py-1.5">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentErrors.slice().reverse().slice(0, 15).map((e, i) => (
                      <tr key={i} className="border-b border-slate-50 text-slate-700">
                        <td className="py-1.5 pr-3 tabular-nums text-slate-400">{new Date(e.ts).toLocaleTimeString()}</td>
                        <td className="py-1.5 pr-3 font-mono">{e.method} {e.path}</td>
                        <td className="py-1.5 pr-3"><span className="text-red-600 font-medium">{e.status}</span></td>
                        <td className="py-1.5 pr-3 tabular-nums">{e.duration_ms}ms</td>
                        <td className="py-1.5 truncate max-w-[200px]">{e.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Collapsible>

          {/* === SLOW REQUESTS === */}
          <Collapsible title="Slow Requests (>3s)" icon={Gauge} badge={slowRequests.length}>
            {slowRequests.length === 0 ? (
              <p className="text-sm text-slate-500">No slow requests recorded</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-1.5 pr-3">Time</th>
                      <th className="py-1.5 pr-3">Endpoint</th>
                      <th className="py-1.5">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowRequests.slice().reverse().slice(0, 15).map((s, i) => (
                      <tr key={i} className="border-b border-slate-50 text-slate-700">
                        <td className="py-1.5 pr-3 tabular-nums text-slate-400">{new Date(s.ts).toLocaleTimeString()}</td>
                        <td className="py-1.5 pr-3 font-mono">{s.method} {s.path}</td>
                        <td className="py-1.5 tabular-nums text-amber-600 font-medium">{(s.duration_ms / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Collapsible>

          {/* === TOP ENDPOINTS === */}
          <Collapsible title="Top Endpoints" icon={ArrowUpRight} badge={topEndpoints.length}>
            {topEndpoints.length === 0 ? (
              <p className="text-sm text-slate-500">No endpoint data yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-100">
                      <th className="py-1.5 pr-3">Endpoint</th>
                      <th className="py-1.5 pr-3 text-right">Calls</th>
                      <th className="py-1.5 pr-3 text-right">Errors</th>
                      <th className="py-1.5 pr-3 text-right">Avg ms</th>
                      <th className="py-1.5 text-right">Max ms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topEndpoints.slice(0, 15).map((ep, i) => (
                      <tr key={i} className="border-b border-slate-50 text-slate-700">
                        <td className="py-1.5 pr-3 font-mono">{ep.endpoint}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{ep.count}</td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">
                          {ep.errors > 0 ? <span className="text-red-600">{ep.errors}</span> : 0}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums">{ep.avg_ms}</td>
                        <td className="py-1.5 text-right tabular-nums">{ep.max_ms}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Collapsible>

          {/* === BACKGROUND TASKS === */}
          <Collapsible title="Background Tasks" icon={PlayCircle} badge={bgTasks.length}>
            {bgTasks.length === 0 ? (
              <p className="text-sm text-slate-500">No background task runs recorded yet</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {bgTasks.slice().reverse().slice(0, 20).map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {t.success ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    )}
                    <span className="tabular-nums text-slate-400">{new Date(t.ts).toLocaleTimeString()}</span>
                    <span className="font-medium text-slate-700">{t.name}</span>
                    <span className="text-slate-400">{t.duration_s}s</span>
                    {t.error && <span className="text-red-500 truncate max-w-[200px]">{t.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </Collapsible>

          {/* === SCHEDULED JOBS === */}
          {schedulerJobs.length > 0 && (
            <Collapsible title="Scheduled Jobs" icon={Clock} badge={schedulerJobs.length}>
              <div className="space-y-1">
                {schedulerJobs.map((job, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <CircleDot className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    <span className="font-medium text-slate-700 min-w-[140px]">{job.name || job.id}</span>
                    <span className="text-slate-400">
                      Next: {job.next_run ? new Date(job.next_run).toLocaleString() : 'paused'}
                    </span>
                  </div>
                ))}
              </div>
            </Collapsible>
          )}

          {/* === DATABASE HEALTH === */}
          <Collapsible title="Database Health" icon={Database} badge={Object.keys(collections).length + ' collections'}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
              {Object.entries(collections).map(([name, count]) => (
                <div key={name} className="rounded-lg border border-slate-100 p-2">
                  <p className="text-[11px] text-slate-500 truncate">{name}</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">{count === -1 ? 'err' : count?.toLocaleString()}</p>
                </div>
              ))}
            </div>
            {Object.keys(orphans).length > 0 && !orphans.error && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                <p className="text-xs font-medium text-amber-800 mb-2">Data integrity checks</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Bookings without status: <strong>{orphans.bookings_no_status ?? '-'}</strong></div>
                  <div>Bookings without date: <strong>{orphans.bookings_no_date ?? '-'}</strong></div>
                  <div>Bookings without email: <strong>{orphans.bookings_no_email ?? '-'}</strong></div>
                  <div>Orphan payments: <strong>{orphans.orphan_payments ?? '-'}</strong></div>
                </div>
              </div>
            )}
            {metrics?.mongo && (
              <div className="mt-3 rounded-lg border border-slate-100 p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">MongoDB status</p>
                <p className="text-xs text-slate-600">
                  Connection: {metrics.mongo.ok ? <span className="text-green-600 font-medium">OK</span> : <span className="text-red-600 font-medium">DOWN</span>}
                  {metrics.mongo.connections?.current != null && ` | Active connections: ${metrics.mongo.connections.current}`}
                  {metrics.mongo.connections?.available != null && ` | Available: ${metrics.mongo.connections.available}`}
                </p>
              </div>
            )}
          </Collapsible>

          {/* === SEO HEALTH === */}
          <Collapsible title="SEO Health (Technical)" icon={Search}>
            <p className="text-sm text-slate-600 mb-3">
              Sitemap and key pages checked weekly.
            </p>
            {seoHealth && (
              <div className={`rounded-lg p-3 mb-3 ${
                seoHealth.status === 'critical' ? 'bg-red-50 border border-red-200' :
                seoHealth.status === 'warning' ? 'bg-amber-50 border border-amber-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <p className="text-sm font-medium text-slate-800">{seoHealth.message}</p>
                {seoHealth.checked_at && (
                  <p className="text-xs text-slate-500 mt-1">Last run: {new Date(seoHealth.checked_at).toLocaleString()}</p>
                )}
                {Array.isArray(seoHealth.latest_report?.issues) && seoHealth.latest_report.issues.length > 0 && (
                  <ul className="text-xs text-red-700 mt-2 list-disc list-inside">
                    {seoHealth.latest_report.issues.slice(0, 5).map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                )}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={runSeoCheck} disabled={seoCheckLoading}>
              {seoCheckLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Run SEO check</span>
            </Button>
          </Collapsible>
        </>
      )}
    </div>
  );
}
