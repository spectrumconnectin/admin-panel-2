'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import StatCard from '@/components/ui/StatCard';
import Spinner from '@/components/ui/Spinner';
import { Users, Zap, Star, BarChart3 } from 'lucide-react';
import { getEtfStats } from '@/lib/api';
import type { EtfStats } from '@/lib/api';
import { formatNumber } from '@/lib/utils';

const EtfChart = dynamic(() => import('@/components/charts/EtfChart'), { ssr: false });

const LEVEL_META: Record<string, { icon: string; color: string; threshold: string }> = {
  bronze:   { icon: '🥉', color: 'text-yellow-700',  threshold: 'Default (0 pts)' },
  silver:   { icon: '🥈', color: 'text-slate-500',   threshold: '250 pts' },
  gold:     { icon: '🥇', color: 'text-amber-500',   threshold: '1,000 pts' },
  platinum: { icon: '💎', color: 'text-violet-600',  threshold: '5,000 pts' },
  diamond:  { icon: '💠', color: 'text-cyan-500',    threshold: 'Custom' },
};

export default function EtfPage() {
  const [data,    setData]    = useState<EtfStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getEtfStats()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col">
      <Header title="ETF Points" subtitle="Earn Trust Framework — platform points summary" />
      <div className="p-6 space-y-6">

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {data && (
          <>
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Overview</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard icon={<Users className="h-5 w-5" />}    label="Total Accounts"       value={formatNumber(data.total_accounts)}        color="violet" />
                <StatCard icon={<Zap className="h-5 w-5" />}      label="Lifetime Points"      value={formatNumber(data.total_lifetime_points)} color="amber" />
                <StatCard icon={<Star className="h-5 w-5" />}     label="Redeemed Points"      value={formatNumber(data.total_redeemed_points)} color="green" />
                <StatCard icon={<BarChart3 className="h-5 w-5" />} label="Active Points (held)" color="blue"
                  value={formatNumber(data.total_lifetime_points - data.total_redeemed_points)} />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Bar chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Level Distribution</h3>
                <p className="mb-4 text-xs text-slate-400">Users per ETF level</p>
                <EtfChart breakdown={data.level_breakdown} />
              </div>

              {/* Level cards */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Breakdown by Level</h3>
                <div className="space-y-3">
                  {Object.entries(data.level_breakdown).map(([level, count]) => {
                    const meta = LEVEL_META[level] ?? { icon: '🏅', color: 'text-slate-600', threshold: '—' };
                    const pct = data.total_accounts > 0
                      ? ((count / data.total_accounts) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <div key={level} className="flex items-center gap-3">
                        <span className="text-xl w-7 text-center">{meta.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-medium capitalize ${meta.color}`}>{level}</span>
                            <span className="text-sm font-bold text-slate-700">{formatNumber(count)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-brand-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-12 text-right">{pct}%</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">From {meta.threshold}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Info box */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">ETF Point Actions (Reference)</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-slate-600 sm:grid-cols-3">
                {[
                  ['Project Posted',             '+5 pts'],
                  ['Creator Hired',              '+20 pts'],
                  ['Milestone Funded',           '+10 pts'],
                  ['Milestone Released (client)','+15 pts'],
                  ['Milestone Released (creator)','+50 pts'],
                  ['Project Completed (client)', '+50 pts'],
                  ['Project Completed (creator)','+100 pts'],
                  ['Review Submitted',           '+15 pts'],
                  ['Positive Review (≥4★)',      '+20 pts'],
                  ['Repeat Client Bonus',        '+25 pts'],
                  ['On-Time Delivery',           '+30 pts'],
                  ['Profile Verified',           '+100 pts'],
                ].map(([action, pts]) => (
                  <div key={action} className="flex justify-between py-1 border-b border-slate-100">
                    <span>{action}</span>
                    <span className="font-semibold text-brand-600">{pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
