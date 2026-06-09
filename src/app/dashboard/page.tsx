'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
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
        else setError(`Stats: ${s.reason?.message || 'failed'}`);
        if (r.status === 'fulfilled') setRevenue(r.value);
        // revenue failure is non-fatal — charts just won't show
        if (e.status === 'fulfilled') setEtf(e.value);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col">
      <Header
        title="Dashboard"
        subtitle={`Platform overview · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
      />

      <div className="p-6 space-y-6">
        {loading && (
          <div className="flex h-48 items-center justify-center">
            <Spinner size="lg" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {stats && !loading && (
          <>
            {/* ── Users Row ── */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Users
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                <StatCard icon="👥" label="Total Users"    value={formatNumber(stats.users.total)}          color="violet" />
                <StatCard icon="🎬" label="Creators"       value={formatNumber(stats.users.creators)}       color="blue"   />
                <StatCard icon="🏢" label="Clients"        value={formatNumber(stats.users.clients)}        color="teal"   />
                <StatCard icon="✅" label="Verified"       value={formatNumber(stats.users.verified)}       color="green"  />
                <StatCard icon="🚫" label="Suspended"      value={formatNumber(stats.users.suspended)}      color="red"    />
                <StatCard icon="🛡️" label="Admins"         value={formatNumber(stats.users.admins)}         color="amber"  />
                <StatCard icon="🆕" label="New (30d)"      value={formatNumber(stats.users.new_last_30_days)} color="violet" />
              </div>
            </section>

            {/* ── Escrow / Payments Row ── */}
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Escrow &amp; Payments
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
                <StatCard icon="💰" label="Total Volume"     value={formatCurrency(stats.escrow.total_volume_usd)}     color="green"  sub="All completed txns" />
                <StatCard icon="🏦" label="Platform Fees"    value={formatCurrency(stats.escrow.platform_fees_usd)}    color="violet" sub="12% commission total" />
                <StatCard icon="👤" label="Client Fees (4%)" value={formatCurrency(stats.escrow.client_fee_usd)}       color="blue"   />
                <StatCard icon="🎨" label="Creator Fees (8%)"value={formatCurrency(stats.escrow.creator_fee_usd)}      color="teal"   />
                <StatCard icon="🔒" label="Active Escrows"   value={formatNumber(stats.escrow.active_count)}           color="amber"  />
                <StatCard icon="✔️" label="Completed"        value={formatNumber(stats.escrow.completed_count)}        color="green"  />
                <StatCard icon="⚠️" label="Disputed"         value={formatNumber(stats.escrow.disputed_count)}         color="red"    />
              </div>
            </section>

            {/* ── Charts Row ── */}
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Revenue chart — takes 2/3 */}
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Revenue Trend</h3>
                <p className="mb-4 text-xs text-slate-400">Platform fees &amp; GMV — last 12 months</p>
                {revenue && <RevenueChart data={revenue.monthly} />}
              </div>

              {/* ETF breakdown — takes 1/3 */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">ETF Level Distribution</h3>
                <p className="mb-4 text-xs text-slate-400">
                  {formatNumber(stats.etf.total_points_awarded)} pts awarded ·{' '}
                  {stats.etf.platinum_users} platinum · {stats.etf.gold_users} gold
                </p>
                {etf && <EtfChart breakdown={etf.level_breakdown} />}
              </div>
            </section>

            {/* ── Revenue All-Time Summary ── */}
            {revenue && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  All-Time Revenue Summary
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                  <StatCard icon="📊" label="Total GMV"          value={formatCurrency(revenue.totals.volume)}         color="blue" />
                  <StatCard icon="💵" label="Platform Revenue"    value={formatCurrency(revenue.totals.platform_total)} color="violet" />
                  <StatCard icon="🏢" label="Client Fees Collected" value={formatCurrency(revenue.totals.client_fees)} color="teal" />
                  <StatCard icon="🎨" label="Creator Fees Collected" value={formatCurrency(revenue.totals.creator_fees)} color="green" />
                  <StatCard icon="🔢" label="Transactions"        value={formatNumber(revenue.totals.transaction_count)} color="amber" />
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
