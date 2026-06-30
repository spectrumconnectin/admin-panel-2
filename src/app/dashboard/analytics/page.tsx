'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
import {
  Users, Film, Building2, CheckCircle, ShieldOff, UserPlus,
  BarChart3, TrendingUp, Briefcase, AlertTriangle,
} from 'lucide-react';
import {
  getPlatformStats, getRevenue, getEtfStats,
  getAllUsers, getAllTransactions, getAllJobs,
} from '@/lib/api';
import type {
  PlatformStats, RevenueReport, EtfStats,
  AdminUser, AdminTransaction, AdminJob,
} from '@/lib/api';
import { formatCurrency, formatNumber, shortId } from '@/lib/utils';

// ── helpers ────────────────────────────────────────────────────────────────

interface Earner { id: string; total: number }

function topByField(
  txns: AdminTransaction[],
  field: 'creator_id' | 'client_id',
  n: number,
): Earner[] {
  const map: Record<string, number> = {};
  for (const t of txns) {
    const key = t[field];
    if (!key) continue;
    map[key] = (map[key] ?? 0) + (t.amount ?? 0);
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, total]) => ({ id, total }));
}

function jobsByStatus(jobs: AdminJob[]) {
  const counts: Record<string, number> = {};
  for (const j of jobs) {
    counts[j.status] = (counts[j.status] ?? 0) + 1;
  }
  return counts;
}

const JOB_STATUS_COLORS: Record<string, string> = {
  open:      'bg-blue-500',
  active:    'bg-emerald-500',
  completed: 'bg-violet-500',
  cancelled: 'bg-slate-400',
  removed:   'bg-red-400',
  approved:  'bg-teal-500',
  closed:    'bg-slate-500',
};

const ETF_COLORS: Record<string, { bar: string; text: string }> = {
  bronze:   { bar: 'bg-amber-700',  text: 'text-amber-700'  },
  silver:   { bar: 'bg-slate-400',  text: 'text-slate-500'  },
  gold:     { bar: 'bg-amber-400',  text: 'text-amber-500'  },
  platinum: { bar: 'bg-violet-500', text: 'text-violet-600' },
  diamond:  { bar: 'bg-cyan-500',   text: 'text-cyan-600'   },
};

// ── component ──────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [stats,    setStats]    = useState<PlatformStats | null>(null);
  const [revenue,  setRevenue]  = useState<RevenueReport | null>(null);
  const [etf,      setEtf]      = useState<EtfStats | null>(null);
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [txns,     setTxns]     = useState<AdminTransaction[]>([]);
  const [jobs,     setJobs]     = useState<AdminJob[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [errors,   setErrors]   = useState<string[]>([]);

  useEffect(() => {
    Promise.allSettled([
      getPlatformStats(),
      getRevenue(),
      getEtfStats(),
      getAllUsers(),
      getAllTransactions(),
      getAllJobs(),
    ]).then(([s, r, e, u, t, j]) => {
      const errs: string[] = [];
      if (s.status === 'fulfilled') setStats(s.value);   else errs.push('Stats: ' + (s.reason?.message ?? 'failed'));
      if (r.status === 'fulfilled') setRevenue(r.value); else errs.push('Revenue: ' + (r.reason?.message ?? 'failed'));
      if (e.status === 'fulfilled') setEtf(e.value);     else errs.push('ETF: ' + (e.reason?.message ?? 'failed'));
      if (u.status === 'fulfilled') setUsers(u.value);   else errs.push('Users: ' + (u.reason?.message ?? 'failed'));
      if (t.status === 'fulfilled') setTxns(t.value);    else errs.push('Transactions: ' + (t.reason?.message ?? 'failed'));
      if (j.status === 'fulfilled') setJobs(j.value);    else errs.push('Jobs: ' + (j.reason?.message ?? 'failed'));
      setErrors(errs);
    }).finally(() => setLoading(false));
  }, []);

  const topCreators = topByField(txns, 'creator_id', 5);
  const topClients  = topByField(txns, 'client_id',  5);
  const pipelineCounts = jobsByStatus(jobs);
  const pipelineTotal  = jobs.length || 1;

  const maxEarner = Math.max(...topCreators.map(x => x.total), 1);
  const maxSpender = Math.max(...topClients.map(x => x.total), 1);

  const etfBreakdown = etf?.level_breakdown
    ? Object.entries(etf.level_breakdown)
    : [];
  const maxEtfCount = Math.max(...etfBreakdown.map(([, v]) => v), 1);

  const rev = revenue?.totals;
  const revTotal = rev ? (rev.client_fees + rev.creator_fees + rev.platform_total) : 0;
  const revBars = rev
    ? [
        { label: 'Client Fees',     value: rev.client_fees,    pct: revTotal ? (rev.client_fees / revTotal) * 100 : 0,    color: 'bg-blue-500'   },
        { label: 'Creator Fees',    value: rev.creator_fees,   pct: revTotal ? (rev.creator_fees / revTotal) * 100 : 0,   color: 'bg-teal-500'   },
        { label: 'Platform Total',  value: rev.platform_total, pct: revTotal ? (rev.platform_total / revTotal) * 100 : 0, color: 'bg-violet-500' },
      ]
    : [];

  return (
    <div className="flex flex-col">
      <Header title="Analytics" subtitle="Derived insights from platform data" />

      <div className="p-4 lg:p-6 space-y-8 lg:space-y-8">
        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-slate-400">Loading analytics…</p>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="space-y-1.5">
            {errors.map(err => (
              <div key={err} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {err}
              </div>
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── User Growth ── */}
            {stats && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <Users className="h-3.5 w-3.5" /> User Growth &amp; Breakdown
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <StatCard icon={<Users className="h-5 w-5" />}       label="Total Users"       value={formatNumber(stats.users.total)}            color="violet" />
                  <StatCard icon={<Film className="h-5 w-5" />}        label="Creators"          value={formatNumber(stats.users.creators)}         color="blue"   />
                  <StatCard icon={<Building2 className="h-5 w-5" />}   label="Clients"           value={formatNumber(stats.users.clients)}          color="teal"   />
                  <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Verified"          value={formatNumber(stats.users.verified)}         color="green"  />
                  <StatCard icon={<ShieldOff className="h-5 w-5" />}   label="Suspended"         value={formatNumber(stats.users.suspended)}        color="red"    />
                  <StatCard icon={<UserPlus className="h-5 w-5" />}    label="New (30d)"         value={formatNumber(stats.users.new_last_30_days)} color="indigo" trend={{ value: 12 }} />
                </div>
              </section>
            )}

            {/* ── Top Earners / Spenders ── */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Top Creators */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Film className="h-4 w-4 text-blue-500" />
                  Top Creators by Earnings
                </h3>
                {topCreators.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No transaction data available</p>
                ) : (
                  <div className="space-y-3">
                    {topCreators.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-slate-600 truncate">{shortId(c.id)}</span>
                            <span className="text-xs font-semibold text-slate-800 ml-2">{formatCurrency(c.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-blue-500 transition-all"
                              style={{ width: `${(c.total / maxEarner) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Clients */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Building2 className="h-4 w-4 text-teal-500" />
                  Top Clients by Spending
                </h3>
                {topClients.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No transaction data available</p>
                ) : (
                  <div className="space-y-3">
                    {topClients.map((c, i) => (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-600">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono text-slate-600 truncate">{shortId(c.id)}</span>
                            <span className="text-xs font-semibold text-slate-800 ml-2">{formatCurrency(c.total)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-teal-500 transition-all"
                              style={{ width: `${(c.total / maxSpender) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* ── Project Pipeline + Revenue Breakdown ── */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Project Pipeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Briefcase className="h-4 w-4 text-violet-500" />
                  Project Pipeline
                  <span className="ml-auto text-xs font-normal text-slate-400">{jobs.length} total jobs</span>
                </h3>
                {jobs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No job data available</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(pipelineCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([status, count]) => (
                      <div key={status} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-xs capitalize text-slate-600">{status}</span>
                        <div className="flex-1 h-2 rounded-full bg-slate-100">
                          <div
                            className={`h-2 rounded-full transition-all ${JOB_STATUS_COLORS[status] ?? 'bg-slate-400'}`}
                            style={{ width: `${(count / pipelineTotal) * 100}%` }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold text-slate-700">{count}</span>
                        <span className="w-10 text-right text-xs text-slate-400">
                          {Math.round((count / pipelineTotal) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revenue Breakdown */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Revenue Breakdown
                  {rev && (
                    <span className="ml-auto text-xs font-normal text-slate-400">
                      {formatCurrency(rev.platform_total)} platform
                    </span>
                  )}
                </h3>
                {revBars.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No revenue data available</p>
                ) : (
                  <div className="space-y-4">
                    {revBars.map(bar => (
                      <div key={bar.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-600">{bar.label}</span>
                          <span className="text-xs font-semibold text-slate-800">{formatCurrency(bar.value)}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100">
                          <div
                            className={`h-2.5 rounded-full transition-all ${bar.color}`}
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-right text-[10px] text-slate-400">{bar.pct.toFixed(1)}%</p>
                      </div>
                    ))}
                    {rev && (
                      <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-600">Total GMV</span>
                        <span className="text-sm font-bold text-slate-800">{formatCurrency(rev.volume)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* ── ETF Leaderboard ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <BarChart3 className="h-3.5 w-3.5" /> ETF Level Distribution
              </h2>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                {!etf ? (
                  <p className="text-sm text-slate-400 text-center py-6">ETF data unavailable</p>
                ) : (
                  <>
                    <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                      {etfBreakdown.map(([level, count]) => {
                        const c = ETF_COLORS[level] ?? { bar: 'bg-slate-400', text: 'text-slate-600' };
                        return (
                          <div key={level} className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
                            <p className={`text-lg font-bold ${c.text}`}>{formatNumber(count)}</p>
                            <p className="text-xs capitalize text-slate-500 mt-0.5">{level}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="space-y-2.5">
                      {etfBreakdown.map(([level, count]) => {
                        const c = ETF_COLORS[level] ?? { bar: 'bg-slate-400', text: 'text-slate-600' };
                        return (
                          <div key={level} className="flex items-center gap-3">
                            <span className="w-16 shrink-0 text-xs capitalize text-slate-600">{level}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-slate-100">
                              <div
                                className={`h-2.5 rounded-full transition-all ${c.bar}`}
                                style={{ width: `${(count / maxEtfCount) * 100}%` }}
                              />
                            </div>
                            <span className={`w-12 text-right text-xs font-semibold ${c.text}`}>
                              {formatNumber(count)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span>Total accounts: <strong className="text-slate-700">{formatNumber(etf.total_accounts)}</strong></span>
                      <span>Lifetime points: <strong className="text-slate-700">{formatNumber(etf.total_lifetime_points)}</strong></span>
                      <span>Redeemed points: <strong className="text-slate-700">{formatNumber(etf.total_redeemed_points)}</strong></span>
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
