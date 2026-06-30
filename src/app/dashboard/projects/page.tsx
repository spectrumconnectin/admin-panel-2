'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import { listJobs, updateJobStatus } from '@/lib/api';
import type { AdminJob } from '@/lib/api';
import { formatDate, formatNumber, shortId } from '@/lib/utils';

const PAGE_SIZE = 25;
const JOB_STATUSES = ['open', 'active', 'delivered', 'approved', 'closed', 'removed'];

export default function ProjectsPage() {
  const [jobs,    setJobs]    = useState<AdminJob[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [actionId,setActionId]= useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await listJobs({ page, page_size: PAGE_SIZE, search: search || undefined, status: status || undefined });
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const changeStatus = async (job: AdminJob) => {
    const newStatus = prompt(
      `Change status for "${job.title}".\nCurrent: ${job.status}\nEnter new status:\n${JOB_STATUSES.join(' | ')}`
    )?.trim();
    if (!newStatus || !JOB_STATUSES.includes(newStatus)) return;
    setActionId(job.id);
    try { await updateJobStatus(job.id, newStatus); await load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setActionId(null); }
  };

  return (
    <div className="flex flex-col">
      <Header title="Projects" subtitle={`${formatNumber(total)} total projects`} />
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-4">
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <input type="search" placeholder="Search title or description…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="h-9 flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
          <select value={status} onChange={e => setStatus(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:outline-none">
            <option value="">All Statuses</option>
            {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={load}
            className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
            Search
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
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Proposals</th>
                    <th className="px-4 py-3">Client ID</th>
                    <th className="px-4 py-3">Posted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.length === 0 && (
                    <tr><td colSpan={7} className="py-10 text-center text-slate-400">No projects found</td></tr>
                  )}
                  {jobs.map(j => (
                    <tr key={j.id} className="transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 max-w-xs truncate">{j.title}</p>
                        <p className="text-[10px] text-slate-300 font-mono">{shortId(j.id)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{j.department || '—'}</td>
                      <td className="px-4 py-3"><Badge status={j.status} /></td>
                      <td className="px-4 py-3 text-slate-600">{j.proposal_count}</td>
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{shortId(j.client_id)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{formatDate(j.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actionId === j.id && <Spinner size="sm" />}
                          <button onClick={() => changeStatus(j)}
                            className="rounded px-2 py-1 text-xs text-brand-600 hover:bg-brand-50">
                            Change Status
                          </button>
                          {j.status !== 'removed' && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Remove "${j.title}"?`)) return;
                                setActionId(j.id);
                                try { await updateJobStatus(j.id, 'removed'); await load(); }
                                catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
                                finally { setActionId(null); }
                              }}
                              className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">
                              Remove
                            </button>
                          )}
                        </div>
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
