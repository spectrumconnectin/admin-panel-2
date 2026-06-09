'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
import {
  Users, Film, Building2, CheckCircle, ShieldOff,
  Shield, UserPlus, DollarSign, PiggyBank, BadgeDollarSign,
  Banknote, Lock, CheckCheck, AlertTriangle, Zap, Crown,
} from 'lucide-react';
import { getPlatformStats, getRevenue, getEtfStats } from '@/lib/api';
import type { PlatformStats, RevenueReport, EtfStats } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';

const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), { ssr: false });
const EtfChart     = dynamic(() => import('@/components/charts/EtfChart'),     { ssr: false });

export default function DashboardPage() {
  const [stats,   setStats]   = useState<PlatformStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [etf,     setEtf]     = useState<EtfStats | null>(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([getPlatformStats(), getRevenue(), getEtfStats()])
      .then(([s, r, e]) => {
        if (s.status === 'fulfilled') setStats(s.value);
        else setError(`Stats unavailable: ${s.reason?.message || 'failed'}`);
        if (r.status === 'fulfilled') setRevenue(r.value);
        if (e.status === 'fulfilled') setEtf(e.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" subtitle={`Platform overview · ${now}`} />

      <div className="p-6 space-y-6">
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
            {/* ── Users Row ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <Users className="h-3.5 w-3.5" /> Users
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                <StatCard icon={<Users className="h-5 w-5" />}       label="Total Users"  value={formatNumber(stats.users.total)}           color="violet" />
                <StatCard icon={<Film className="h-5 w-5" />}        label="Creators"     value={formatNumber(stats.users.creators)}        color="blue"   />
                <StatCard icon={<Building2 className="h-5 w-5" />}   label="Clients"      value={formatNumber(stats.users.clients)}         color="teal"   />
                <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Verified"     value={formatNumber(stats.users.verified)}        color="green"  />
                <StatCard icon={<ShieldOff className="h-5 w-5" />}   label="Suspended"    value={formatNumber(stats.users.suspended)}       color="red"    />
                <StatCard icon={<Shield className="h-5 w-5" />}      label="Admins"       value={formatNumber(stats.users.admins)}          color="amber"  />
                <StatCard icon={<UserPlus className="h-5 w-5" />}    label="New (30d)"    value={formatNumber(stats.users.new_last_30_days)} color="indigo" trend={{ value: 12 }} />
              </div>
            </section>

            {/* ── Escrow Row ── */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <DollarSign className="h-3.5 w-3.5" /> Escrow &amp; Payments
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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
              {/* Revenue chart — 2/3 width */}
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

              {/* ETF breakdown — 1/3 width */}
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
          </>
        )}
      </div>
    </div>
  );
}
