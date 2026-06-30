'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { DollarSign, PiggyBank, Building2, Film, Hash, TrendingUp, AlertTriangle } from 'lucide-react';
import { getRevenue } from '@/lib/api';
import type { RevenueReport } from '@/lib/api';
import { formatCurrency, formatNumber, formatDate, shortId } from '@/lib/utils';

const RevenueChart = dynamic(() => import('@/components/charts/RevenueChart'), { ssr: false });

export default function RevenuePage() {
  const [data, setData]     = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    getRevenue()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>
  );

  return (
    <div className="flex flex-col">
      <Header title="Revenue & Analytics" subtitle="All-time platform revenue breakdown" />
      <div className="p-4 lg:p-6 space-y-6 lg:space-y-6">

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}

        {data && (
          <>
            {/* All-time totals */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                <TrendingUp className="h-3.5 w-3.5" /> All-Time Totals
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard icon={<DollarSign className="h-5 w-5" />} label="Gross Volume (GMV)"     value={formatCurrency(data.totals.volume)}         color="blue" />
                <StatCard icon={<PiggyBank className="h-5 w-5" />}  label="Platform Revenue"       value={formatCurrency(data.totals.platform_total)} color="violet" />
                <StatCard icon={<Building2 className="h-5 w-5" />}  label="Client Fees Collected"  value={formatCurrency(data.totals.client_fees)}    color="teal" />
                <StatCard icon={<Film className="h-5 w-5" />}       label="Creator Fees Collected" value={formatCurrency(data.totals.creator_fees)}   color="green" />
                <StatCard icon={<Hash className="h-5 w-5" />}       label="Completed Transactions" value={formatNumber(data.totals.transaction_count)} color="amber" />
              </div>
            </section>

            {/* Commission info */}
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
              <h3 className="text-sm font-semibold text-brand-800 mb-2">
                Commission Model — {data.commission_info.version}
              </h3>
              <p className="text-sm text-brand-700">{data.commission_info.note}</p>
              <div className="mt-3 flex gap-6 text-sm">
                <span><strong className="text-brand-900">{data.commission_info.total_rate_pct}%</strong> total take</span>
                <span><strong className="text-brand-900">{data.commission_info.client_rate_pct}%</strong> from client</span>
                <span><strong className="text-brand-900">{data.commission_info.creator_rate_pct}%</strong> from creator</span>
              </div>
            </div>

            {/* Revenue chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 text-sm font-semibold text-slate-800">Revenue Trend (Last 12 Months)</h3>
              <p className="mb-4 text-xs text-slate-400">Platform fees and total transaction volume</p>
              <RevenueChart data={data.monthly} />
            </div>

            {/* Monthly table */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-slate-800">Monthly Breakdown</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3 text-right">GMV</th>
                      <th className="px-4 py-3 text-right">Platform Fees</th>
                      <th className="px-4 py-3 text-right">Client Fees</th>
                      <th className="px-4 py-3 text-right">Creator Fees</th>
                      <th className="px-4 py-3 text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.monthly.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-400">No revenue data yet</td></tr>
                    )}
                    {[...data.monthly].reverse().map(m => (
                      <tr key={m.month} className="transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-800">{m.month}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(m.volume)}</td>
                        <td className="px-4 py-3 text-right text-brand-700 font-medium">{formatCurrency(m.total_fees)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(m.client_fees)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(m.creator_fees)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">{m.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top projects */}
            {data.top_projects.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-800">Top 10 Projects by Platform Fee</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="admin-table w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Txn ID</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Platform Fee</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.top_projects.map((t, i) => (
                        <tr key={t.id} className="transition-colors">
                          <td className="px-4 py-3">
                            <span className="mr-2 text-slate-400 text-xs">#{i + 1}</span>
                            <span className="text-xs font-mono text-slate-400">{shortId(t.id)}</span>
                          </td>
                          <td className="px-4 py-3"><Badge status={t.status} /></td>
                          <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(t.amount)}</td>
                          <td className="px-4 py-3 text-right font-bold text-brand-700">{formatCurrency(t.platform_fee)}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatDate(t.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
