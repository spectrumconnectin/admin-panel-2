'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import {
  Users, Film, Building2, CheckCircle, ShieldOff,
  Shield, UserPlus, DollarSign, PiggyBank, BadgeDollarSign,
  Banknote, Lock, CheckCheck, AlertTriangle, Zap, Crown,
  TrendingUp, FolderOpen, CreditCard, Trophy, Scale,
  BarChart3, Activity, Download, RefreshCw,
  ArrowRight, User2, Briefcase,
} from 'lucide-react';
import {
  getPlatformStats, getRevenue, getEtfStats,
  getAllUsers, getAllTransactions, getAllJobs,
  getHealthStatus,
} from '@/lib/api';
import type {
  PlatformStats, RevenueReport, EtfStats,
  AdminUser, AdminTransaction, AdminJob,
} from '@/lib/api';
import { formatCurrency, formatNumber, timeAgo, shortId } from '@/lib/utils';

const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), { ssr: false });
const EtfChart     = dynamic(() => import('@/components/charts/EtfChart'),     { ssr: false });

// ── component ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [stats,   setStats]   = useState<PlatformStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [etf,     setEtf]     = useState<EtfStats | null>(null);
  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [txns,    setTxns]    = useState<AdminTransaction[]>([]);
  const [jobs,    setJobs]    = useState<AdminJob[]>([]);
  const [apiOk,   setApiOk]   = useState<boolean | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');

    const [s, r, e, u, t, j, h] = await Promise.allSettled([
      getPlatformStats(),
      getRevenue(),
      getEtfStats(),
      getAllUsers(),
      getAllTransactions(),
      getAllJobs(),
      getHealthStatus(),
    ]);

    if (s.status === 'fulfilled') setStats(s.value);
    else setError(`Stats unavailable: ${s.reason?.message || 'failed'}`);
    if (r.status === 'fulfilled') setRevenue(r.value);
    if (e.status === 'fulfilled') setEtf(e.value);
    if (u.status === 'fulfilled') setUsers(u.value);
    if (t.status === 'fulfilled') setTxns(t.value);
    if (j.status === 'fulfilled') setJobs(j.value);
    setApiOk(h.status === 'fulfilled' && h.value?.status === 'ok');

    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(() => { loadAll(); }, 60_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const now = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Activity feed items
  const recentUsers = [...users]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5);
  const recentTxns = [...txns]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5);
  const recentJobs = [...jobs]
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))
    .slice(0, 5);

  const quickActions = [
    { href: '/dashboard/users',         Icon: Users,      label: 'Manage Users',    color: 'text-violet-600 bg-violet-50 hover:bg-violet-100' },
    { href: '/dashboard/projects',      Icon: FolderOpen, label: 'View Projects',   color: 'text-teal-600 bg-teal-50 hover:bg-teal-100'       },
    { href: '/dashboard/disputes',      Icon: Scale,      label: 'Review Disputes', color: 'text-amber-600 bg-amber-50 hover:bg-amber-100'     },
    { href: '/dashboard/transactions',  Icon: CreditCard, label: 'Transactions',    color: 'text-blue-600 bg-blue-50 hover:bg-blue-100'        },
    { href: '/dashboard/revenue',       Icon: TrendingUp, label: 'Revenue Report',  color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'},
    { href: '/dashboard/analytics',     Icon: BarChart3,  label: 'Analytics',       color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'  },
    { href: '/dashboard/health',        Icon: Activity,   label: 'Health Monitor',  color: 'text-rose-600 bg-rose-50 hover:bg-rose-100'        },
    { href: '/dashboard/export',        Icon: Download,   label: 'Export Data',     color: 'text-slate-600 bg-slate-100 hover:bg-slate-200'    },
  ];

  return (
    <div className="flex flex-col">
      <Header
        title="Executive Dashboard"
        subtitle={`Platform overview · ${now}`}
        actions={
          <button
            onClick={loadAll}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Platform Status Bar */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 lg:px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            {apiOk === null ? (
              <span className="h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
            ) : apiOk ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full bg-red-500" />
            )}
            <span className="text-xs font-medium text-slate-600">
              <span className="hidden sm:inline">API Status: </span>
              {apiOk === null ? 'Checking…' : apiOk ? 'Operational' : 'Degraded'}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span>Updated: {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="text-slate-300">·</span>
            <span>60s refresh</span>
          </div>
        </div>

        {loading && (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-slate-400">Loading platform data…</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* ── Row 1: Big 4 Summary ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Zap className="h-3.5 w-3.5" /> Platform Summary
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:gap-4 lg:grid-cols-4">
                <StatCard
                  icon={<Users className="h-5 w-5" />}
                  label="Total Users"
                  value={formatNumber(stats.users.total)}
                  color="violet"
                  sub={`${stats.users.new_last_30_days} new this month`}
                  trend={{ value: 12 }}
                />
                <StatCard
                  icon={<FolderOpen className="h-5 w-5" />}
                  label="Active Projects"
                  value={formatNumber(stats.escrow.active_count)}
                  color="blue"
                  sub={`${stats.escrow.completed_count} completed`}
                />
                <StatCard
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Total Revenue"
                  value={revenue ? formatCurrency(revenue.totals.platform_total) : '—'}
                  color="green"
                  sub={revenue ? `${formatCurrency(revenue.totals.volume)} GMV` : undefined}
                />
                <StatCard
                  icon={<Crown className="h-5 w-5" />}
                  label="ETF Points Awarded"
                  value={etf ? formatNumber(etf.total_lifetime_points) : formatNumber(stats.etf.total_points_awarded)}
                  color="amber"
                  sub={`${stats.etf.platinum_users} platinum users`}
                />
              </div>
            </section>

            {/* ── Row 2: User Breakdown ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Users className="h-3.5 w-3.5" /> User Breakdown
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard icon={<Film className="h-5 w-5" />}        label="Creators"      value={formatNumber(stats.users.creators)}         color="blue"   />
                <StatCard icon={<Building2 className="h-5 w-5" />}   label="Clients"       value={formatNumber(stats.users.clients)}          color="teal"   />
                <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Verified"      value={formatNumber(stats.users.verified)}         color="green"  />
                <StatCard icon={<ShieldOff className="h-5 w-5" />}   label="Suspended"     value={formatNumber(stats.users.suspended)}        color="red"    />
                <StatCard icon={<UserPlus className="h-5 w-5" />}    label="New (30 days)" value={formatNumber(stats.users.new_last_30_days)} color="indigo" />
              </div>
            </section>

            {/* ── Row 3: Escrow Stats ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <DollarSign className="h-3.5 w-3.5" /> Escrow &amp; Payments
              </h2>
              <div className="grid grid-cols-2 gap-3 lg:gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                <StatCard icon={<DollarSign className="h-5 w-5" />}      label="Total Volume"      value={formatCurrency(stats.escrow.total_volume_usd)}  color="green"  sub="Completed txns" />
                <StatCard icon={<PiggyBank className="h-5 w-5" />}       label="Platform Fees"     value={formatCurrency(stats.escrow.platform_fees_usd)} color="violet" sub="12% take rate" />
                <StatCard icon={<BadgeDollarSign className="h-5 w-5" />} label="Client Fees (4%)"  value={formatCurrency(stats.escrow.client_fee_usd)}    color="blue"   />
                <StatCard icon={<Banknote className="h-5 w-5" />}        label="Creator Fees (8%)" value={formatCurrency(stats.escrow.creator_fee_usd)}   color="teal"   />
                <StatCard icon={<Lock className="h-5 w-5" />}            label="Active Escrows"    value={formatNumber(stats.escrow.active_count)}        color="amber"  />
                <StatCard icon={<CheckCheck className="h-5 w-5" />}      label="Completed"         value={formatNumber(stats.escrow.completed_count)}     color="green"  />
                <StatCard icon={<AlertTriangle className="h-5 w-5" />}   label="Disputed"          value={formatNumber(stats.escrow.disputed_count)}      color="red"    />
              </div>
            </section>

            {/* ── Charts Row ── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Revenue Trend</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Platform fees &amp; GMV — last 12 months</p>
                  </div>
                  {revenue && (
                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      {formatCurrency(revenue.totals.platform_total)} total
                    </span>
                  )}
                </div>
                {revenue ? <RevenueChart data={revenue.monthly} /> : (
                  <div className="flex h-52 items-center justify-center text-sm text-slate-400">Revenue data unavailable</div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Crown className="h-4 w-4 text-amber-500" />
                    ETF Level Distribution
                  </h3>
                  {stats.etf && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatNumber(stats.etf.total_points_awarded)} pts · {stats.etf.platinum_users} platinum
                    </p>
                  )}
                </div>
                {etf ? <EtfChart breakdown={etf.level_breakdown} /> : (
                  <div className="flex h-52 items-center justify-center text-sm text-slate-400">ETF data unavailable</div>
                )}
              </div>
            </section>

            {/* ── Activity Feed ── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Recent Users */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <User2 className="h-3.5 w-3.5" /> Recent Users
                  </h3>
                  <Link href="/dashboard/users" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentUsers.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400 text-center">No user data</p>
                  ) : recentUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {(u.display_name || u.username).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{u.display_name || u.username}</p>
                        <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge
                          status={u.account_type}
                          label={u.account_type === 'crew' ? 'Creator' : u.account_type === 'producer' ? 'Client' : 'Both'}
                        />
                        <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(u.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" /> Recent Transactions
                  </h3>
                  <Link href="/dashboard/transactions" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentTxns.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400 text-center">No transaction data</p>
                  ) : recentTxns.map(t => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50">
                        <CreditCard className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 font-mono">{shortId(t.id)}</p>
                        <p className="text-[10px] text-slate-400 capitalize">{t.type} · {t.currency}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold text-slate-800">{formatCurrency(t.amount)}</p>
                        <Badge status={t.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Jobs */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Briefcase className="h-3.5 w-3.5" /> Recent Jobs
                  </h3>
                  <Link href="/dashboard/projects" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                    All <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="divide-y divide-slate-50">
                  {recentJobs.length === 0 ? (
                    <p className="p-4 text-xs text-slate-400 text-center">No job data</p>
                  ) : recentJobs.map(j => (
                    <div key={j.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50">
                        <FolderOpen className="h-3.5 w-3.5 text-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{j.title}</p>
                        <p className="text-[10px] text-slate-400">{j.proposal_count} proposals · {timeAgo(j.created_at)}</p>
                      </div>
                      <div className="shrink-0">
                        <Badge status={j.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── Revenue All-Time ── */}
            {revenue && (
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <Zap className="h-3.5 w-3.5" /> All-Time Revenue Summary
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <StatCard icon={<DollarSign className="h-5 w-5" />}      label="Total GMV"            value={formatCurrency(revenue.totals.volume)}         color="blue"   />
                  <StatCard icon={<PiggyBank className="h-5 w-5" />}       label="Platform Revenue"     value={formatCurrency(revenue.totals.platform_total)} color="violet" />
                  <StatCard icon={<Building2 className="h-5 w-5" />}       label="Client Fees"          value={formatCurrency(revenue.totals.client_fees)}    color="teal"   />
                  <StatCard icon={<Film className="h-5 w-5" />}            label="Creator Fees"         value={formatCurrency(revenue.totals.creator_fees)}   color="green"  />
                  <StatCard icon={<CheckCheck className="h-5 w-5" />}      label="Transactions"         value={formatNumber(revenue.totals.transaction_count)} color="amber"  />
                </div>
              </section>
            )}

            {/* ── Quick Actions ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Zap className="h-3.5 w-3.5" /> Quick Actions
              </h2>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {quickActions.map(({ href, Icon, label, color }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 p-2.5 lg:p-3 text-center transition-all hover:shadow-sm hover:-translate-y-0.5 ${color}`}
                  >
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="text-[10px] lg:text-xs font-medium leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* ── ETF Summary (row) ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Trophy className="h-3.5 w-3.5" /> ETF Loyalty Program
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                <StatCard icon={<Shield className="h-5 w-5" />}        label="Admins"        value={formatNumber(stats.users.admins)}           color="amber"  />
                <StatCard icon={<Crown className="h-5 w-5" />}         label="Platinum Users" value={formatNumber(stats.etf.platinum_users)}    color="violet" />
                <StatCard icon={<Trophy className="h-5 w-5" />}        label="Gold Users"    value={formatNumber(stats.etf.gold_users)}          color="amber"  />
                <StatCard icon={<Zap className="h-5 w-5" />}           label="Points Awarded" value={formatNumber(stats.etf.total_points_awarded)} color="indigo" />
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
