'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import { listTransactions } from '@/lib/api';
import type { AdminTransaction } from '@/lib/api';
import { formatCurrency, formatDateTime, formatNumber, shortId } from '@/lib/utils';

const PAGE_SIZE = 25;

export default function TransactionsPage() {
  const [txns,    setTxns]    = useState<AdminTransaction[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await listTransactions({ page, page_size: PAGE_SIZE, status: status || undefined });
      setTxns(res.transactions);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [status]);

  // Compute page-level totals
  const pageVolume   = txns.filter(t => t.status === 'completed').reduce((s, t) => s + t.amount, 0);
  const pageFees     = txns.filter(t => t.status === 'completed').reduce((s, t) => s + t.platform_fee, 0);

  return (
    <div className="flex flex-col">
      <Header title="Transactions" subtitle={`${formatNumber(total)} total transactions`} />
      <div className="p-6 space-y-4">

        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:outline-none">
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button onClick={load}
            className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
            Filter
          </button>
          <div className="ml-auto flex items-center gap-4 text-sm text-slate-500">
            <span>This page: <strong className="text-slate-800">{formatCurrency(pageVolume)}</strong> vol</span>
            <span><strong className="text-brand-700">{formatCurrency(pageFees)}</strong> fees</span>
          </div>
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
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">Platform Fee</th>
                    <th className="px-4 py-3 text-right">Client Fee</th>
                    <th className="px-4 py-3 text-right">Creator Fee</th>
                    <th className="px-4 py-3">Client → Creator</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txns.length === 0 && (
                    <tr><td colSpan={9} className="py-10 text-center text-slate-400">No transactions found</td></tr>
                  )}
                  {txns.map(t => (
                    <tr key={t.id} className="transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{shortId(t.id)}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{t.type}</td>
                      <td className="px-4 py-3"><Badge status={t.status} /></td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800">
                        {formatCurrency(t.amount, t.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-brand-700">
                        {formatCurrency(t.platform_fee, t.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatCurrency(t.client_fee, t.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatCurrency(t.creator_fee, t.currency)}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">
                        {t.client_id ? shortId(t.client_id) : '—'}
                        {' → '}
                        {t.creator_id ? shortId(t.creator_id) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(t.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
