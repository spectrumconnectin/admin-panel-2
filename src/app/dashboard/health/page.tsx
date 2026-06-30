'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import {
  CheckCircle, XCircle, Clock, Activity,
  RefreshCw, Database, Server, Wifi,
} from 'lucide-react';
import { getHealthStatus, getPlatformStats } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

// ── types ──────────────────────────────────────────────────────────────────

interface CheckResult {
  id: number;
  timestamp: string;
  endpoint: string;
  status: 'ok' | 'slow' | 'error';
  response_time: number;
  message: string;
}

type StatusLevel = 'ok' | 'slow' | 'error' | 'loading';

// ── helpers ────────────────────────────────────────────────────────────────

function statusLabel(s: StatusLevel) {
  if (s === 'ok')      return 'Online';
  if (s === 'slow')    return 'Degraded';
  if (s === 'error')   return 'Offline';
  return 'Checking…';
}

function statusColor(s: StatusLevel) {
  if (s === 'ok')      return 'text-emerald-600';
  if (s === 'slow')    return 'text-amber-500';
  if (s === 'error')   return 'text-red-500';
  return 'text-slate-400';
}

function statusBg(s: StatusLevel) {
  if (s === 'ok')      return 'bg-emerald-50 border-emerald-200';
  if (s === 'slow')    return 'bg-amber-50 border-amber-200';
  if (s === 'error')   return 'bg-red-50 border-red-200';
  return 'bg-slate-50 border-slate-200';
}

function dotColor(s: StatusLevel) {
  if (s === 'ok')      return 'bg-emerald-500';
  if (s === 'slow')    return 'bg-amber-400';
  if (s === 'error')   return 'bg-red-500';
  return 'bg-slate-300';
}

function rttColor(ms: number) {
  if (ms < 300)  return 'text-emerald-600';
  if (ms < 1000) return 'text-amber-500';
  return 'text-red-500';
}

function rttLevel(ms: number): 'ok' | 'slow' | 'error' {
  if (ms < 300)  return 'ok';
  if (ms < 1000) return 'slow';
  return 'error';
}

const AUTO_REFRESH_SECS = 30;

// ── component ──────────────────────────────────────────────────────────────

export default function HealthPage() {
  const [apiStatus,  setApiStatus]  = useState<StatusLevel>('loading');
  const [dbStatus,   setDbStatus]   = useState<StatusLevel>('loading');
  const [apiLatency, setApiLatency] = useState<number>(0);
  const [dbLatency,  setDbLatency]  = useState<number>(0);
  const [log,        setLog]        = useState<CheckResult[]>([]);
  const [countdown,  setCountdown]  = useState(AUTO_REFRESH_SECS);
  const [checking,   setChecking]   = useState(false);
  const nextId = useRef(1);

  const runCheck = useCallback(async () => {
    setChecking(true);

    // ── Check API health endpoint ──────────────────────────────────────────
    let apiMs = 0;
    let apiOk: StatusLevel = 'error';
    let apiMsg = '';
    {
      const t0 = performance.now();
      try {
        const data = await getHealthStatus();
        apiMs = Math.round(performance.now() - t0);
        if (data.status === 'ok') {
          apiOk = rttLevel(apiMs);
          apiMsg = data.message || 'API is running';
        } else {
          apiOk = 'error';
          apiMsg = `Unexpected status: ${data.status}`;
        }
      } catch (e: unknown) {
        apiMs = Math.round(performance.now() - t0);
        apiOk = 'error';
        apiMsg = e instanceof Error ? e.message : 'Unreachable';
      }
    }
    setApiStatus(apiOk);
    setApiLatency(apiMs);

    // ── Check DB (inferred from /admin/stats loading) ─────────────────────
    let dbMs = 0;
    let dbOk: StatusLevel = 'error';
    let dbMsg = '';
    {
      const t0 = performance.now();
      try {
        await getPlatformStats();
        dbMs = Math.round(performance.now() - t0);
        dbOk = rttLevel(dbMs);
        dbMsg = 'Stats loaded successfully';
      } catch (e: unknown) {
        dbMs = Math.round(performance.now() - t0);
        dbOk = 'error';
        dbMsg = e instanceof Error ? e.message : 'Stats query failed';
      }
    }
    setDbStatus(dbOk);
    setDbLatency(dbMs);

    // ── Append to log ──────────────────────────────────────────────────────
    const now = new Date().toISOString();
    setLog(prev => {
      const entries: CheckResult[] = [
        {
          id: nextId.current++,
          timestamp: now,
          endpoint: '/health',
          status: (apiOk === 'ok' || apiOk === 'slow') ? apiOk : 'error',
          response_time: apiMs,
          message: apiMsg,
        },
        {
          id: nextId.current++,
          timestamp: now,
          endpoint: '/admin/stats',
          status: (dbOk === 'ok' || dbOk === 'slow') ? dbOk : 'error',
          response_time: dbMs,
          message: dbMsg,
        },
        ...prev,
      ];
      return entries.slice(0, 20); // keep last 20 entries (10 rounds)
    });

    setChecking(false);
    setCountdown(AUTO_REFRESH_SECS);
  }, []);

  // Run once on mount
  useEffect(() => { runCheck(); }, [runCheck]);

  // Auto-refresh countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          runCheck();
          return AUTO_REFRESH_SECS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [runCheck]);

  // ── Uptime % ────────────────────────────────────────────────────────────
  const totalChecks = log.length;
  const okChecks    = log.filter(l => l.status === 'ok' || l.status === 'slow').length;
  const uptimePct   = totalChecks > 0 ? Math.round((okChecks / totalChecks) * 100) : null;

  return (
    <div className="flex flex-col">
      <Header
        title="Health Monitor"
        subtitle="Real-time platform status"
        actions={
          <button
            onClick={runCheck}
            disabled={checking}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {checking ? <Spinner size="sm" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Check Now
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-6 lg:space-y-6">
        {/* Auto-refresh bar */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" />
            Auto-refreshing every {AUTO_REFRESH_SECS}s
          </div>
          <div className="flex items-center gap-3">
            {uptimePct !== null && (
              <span className={`text-sm font-semibold ${uptimePct >= 90 ? 'text-emerald-600' : uptimePct >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
                {uptimePct}% uptime
              </span>
            )}
            <span className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500">
              <Clock className="h-3 w-3" />
              Next check in {countdown}s
            </span>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* API Status */}
          <div className={`rounded-xl border p-5 ${statusBg(apiStatus)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Wifi className="h-4.5 w-4.5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">API Gateway</p>
                  <p className={`text-sm font-bold mt-0.5 ${statusColor(apiStatus)}`}>
                    {statusLabel(apiStatus)}
                  </p>
                </div>
              </div>
              {apiStatus === 'loading' ? (
                <Spinner size="sm" />
              ) : apiStatus === 'ok' || apiStatus === 'slow' ? (
                <CheckCircle className={`h-5 w-5 ${statusColor(apiStatus)}`} />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Response time</span>
              {apiLatency > 0 ? (
                <span className={`font-semibold ${rttColor(apiLatency)}`}>{apiLatency}ms</span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-400">Endpoint: /health</div>
          </div>

          {/* Database Status */}
          <div className={`rounded-xl border p-5 ${statusBg(dbStatus)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Database className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Database</p>
                  <p className={`text-sm font-bold mt-0.5 ${statusColor(dbStatus)}`}>
                    {statusLabel(dbStatus)}
                  </p>
                </div>
              </div>
              {dbStatus === 'loading' ? (
                <Spinner size="sm" />
              ) : dbStatus === 'ok' || dbStatus === 'slow' ? (
                <CheckCircle className={`h-5 w-5 ${statusColor(dbStatus)}`} />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>Query time</span>
              {dbLatency > 0 ? (
                <span className={`font-semibold ${rttColor(dbLatency)}`}>{dbLatency}ms</span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-400">Inferred from /admin/stats</div>
          </div>

          {/* Deployment Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <Server className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deployment</p>
                  <p className="text-sm font-bold mt-0.5 text-emerald-600">Online</p>
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="mt-3 text-xs text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>Platform</span>
                <span className="font-medium text-slate-700">Railway</span>
              </div>
              <div className="flex items-center justify-between">
                <span>API URL</span>
                <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">spectrumconect.com</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Admin Panel</span>
                <span className="font-medium text-slate-700">Vercel / Railway</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Response time thresholds:</span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-700">Fast (&lt;300ms)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-600">Slow (300–1000ms)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-red-600">Critical (&gt;1000ms or error)</span>
          </span>
        </div>

        {/* Check Log */}
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
            <Activity className="h-3.5 w-3.5" /> Check History (last {Math.min(log.length, 10)} checks)
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {log.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-400">
                No checks recorded yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Endpoint</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Response Time</th>
                      <th className="px-4 py-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {log.slice(0, 10).map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(entry.timestamp)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">{entry.endpoint}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                            entry.status === 'ok'
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : entry.status === 'slow'
                              ? 'bg-amber-50 text-amber-700 ring-amber-200'
                              : 'bg-red-50 text-red-700 ring-red-200'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dotColor(entry.status)}`} />
                            {entry.status === 'ok' ? 'OK' : entry.status === 'slow' ? 'Slow' : 'Error'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${rttColor(entry.response_time)}`}>
                            {entry.response_time}ms
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[240px] truncate">
                          {entry.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
