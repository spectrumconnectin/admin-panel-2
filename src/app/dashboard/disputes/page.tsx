'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import { listDisputes } from '@/lib/api';
import type { AdminDispute } from '@/lib/api';
import { formatDateTime, formatNumber, shortId } from '@/lib/utils';

const PAGE_SIZE = 25;

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState('');
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await listDisputes({ page, page_size: PAGE_SIZE, status: status || undefined });
      setDisputes(res.disputes);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  const openCount = disputes.filter(d => d.status === 'open').length;

  return (
    <div className="flex flex-col">
      <Header title="Disputes" subtitle={`${formatNumber(total)} total · ${openCount} open on this page`} />
      <div className="p-6 space-y-4">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {['open', 'under_review', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatus(status === s ? '' : s)}
              className={`rounded-xl border p-4 text-center shadow-sm transition-colors ${
                status === s ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}>
              <p className="text-lg font-bold text-slate-900">
                {disputes.filter(d => d.status === s).length}
              </p>
              <p className="text-xs capitalize text-slate-500">{s.replace('_', ' ')}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={load}
            className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
            Filter
          </button>
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Dispute ID</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Escrow</th>
                    <th className="px-4 py-3">Raised By</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disputes.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400">
                      {status ? `No ${status} disputes` : 'No disputes found'}
                    </td></tr>
                  )}
                  {disputes.map(d => (
                    <tr key={d.id} className="transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{shortId(d.id)}</td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-slate-800 truncate">{d.reason || '—'}</p>
                      </td>
                      <td className="px-4 py-3"><Badge status={d.status} /></td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{d.escrow_id ? shortId(d.escrow_id) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{d.raised_by ? shortId(d.raised_by) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDateTime(d.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>To resolve a dispute</strong>, use the Spectrum Connect API directly:
          <code className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-mono">
            POST /escrow/{'{escrow_id}'}/disputes/{'{dispute_id}'}/resolve
          </code>
        </div>
      </div>
    </div>
  );
}
