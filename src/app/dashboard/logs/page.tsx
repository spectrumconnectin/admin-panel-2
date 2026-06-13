'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import { ScrollText, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAuditLogs } from '@/lib/api';
import type { AuditLogEntry, AuditLogResult } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const PAGE_SIZE = 50;

const SEVERITIES: { value: string; label: string; color: string; dot: string }[] = [
  { value: '',         label: 'All',      color: 'bg-slate-900 text-white border-slate-900', dot: '' },
  { value: 'info',     label: 'Info',     color: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-500' },
  { value: 'warning',  label: 'Warning',  color: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500' },
  { value: 'error',    label: 'Error',    color: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-500' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800 border-red-300',         dot: 'bg-red-700' },
  { value: 'debug',    label: 'Debug',    color: 'bg-slate-50 text-slate-500 border-slate-200',    dot: 'bg-slate-400' },
];

function sevDot(s: string) {
  return (SEVERITIES.find(x => x.value === s)?.dot) ?? 'bg-slate-400';
}
function sevChip(s: string) {
  const m = SEVERITIES.find(x => x.value === s);
  return m && m.value ? m.color : 'bg-slate-50 text-slate-500 border-slate-200';
}

// Map an event_type like "admin.user.suspended" to a readable label + icon.
function eventLabel(t: string): string {
  return t.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' › ');
}

export default function LogsPage() {
  const [data, setData] = useState<AuditLogResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [auto, setAuto] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getAuditLogs({
        severity: severity || undefined,
        event_type: eventFilter || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }));
    } catch { /* surfaced via empty state */ }
    finally { setLoading(false); }
  }, [severity, eventFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 10s when enabled (only on the first page)
  useEffect(() => {
    if (!auto || page !== 0) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [auto, page, load]);

  // Client-side search across the current page (actor, event, ip, path)
  const rows = (data?.logs ?? []).filter(l => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.event_type.toLowerCase().includes(q) ||
      (l.actor_username ?? '').toLowerCase().includes(q) ||
      (l.ip_address ?? '').toLowerCase().includes(q) ||
      (l.request_path ?? '').toLowerCase().includes(q) ||
      (l.actor_role ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="flex flex-col">
      <Header
        title="Activity Logs"
        subtitle="Every recorded event across the platform"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => setAuto(a => !a)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors ${
                auto ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${auto ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {auto ? 'Live' : 'Paused'}
            </button>
            <button onClick={load}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        }
      />

      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {SEVERITIES.map(s => (
            <button key={s.value || 'all'} onClick={() => { setSeverity(s.value); setPage(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                severity === s.value ? s.color : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              {s.dot && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
              {s.label}
            </button>
          ))}
          <div className="flex-1" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search actor, event, IP, path…"
            className="text-sm rounded-lg border border-slate-200 px-3 py-1.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 w-full sm:w-64"
          />
        </div>

        {eventFilter && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            Filtering event: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{eventFilter}</span>
            <button onClick={() => { setEventFilter(''); setPage(0); }} className="text-brand-600 hover:underline">clear</button>
          </div>
        )}

        {/* Table */}
        {loading && !data ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No log entries{severity ? ` at "${severity}" severity` : ''}{search ? ' matching your search' : ''}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Time</th>
                  <th className="text-left font-semibold px-4 py-3">Event</th>
                  <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Actor</th>
                  <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Target</th>
                  <th className="text-left font-semibold px-4 py-3 hidden xl:table-cell">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(l => (
                  <tr key={l.id} onClick={() => setSelected(l)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">{l.created_at ? formatDateTime(l.created_at) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sevDot(l.severity)}`} />
                        <span className="font-medium text-slate-800">{eventLabel(l.event_type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {l.actor_username ? (
                        <span className="text-slate-600">{l.actor_username}<span className="text-slate-400 text-xs"> · {l.actor_role ?? 'user'}</span></span>
                      ) : <span className="text-slate-400 text-xs">system</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">
                      {l.target_type ? `${l.target_type}${l.target_id ? ` · …${l.target_id.slice(-6)}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell text-xs text-slate-400 font-mono">{l.ip_address ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > PAGE_SIZE && (
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.total)} of {data.total.toLocaleString()}
            </span>
            <div className="flex items-center gap-1">
              <button disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-slate-300">
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="px-2">Page {page + 1} / {totalPages}</span>
              <button disabled={!data.has_more} onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:border-slate-300">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${sevDot(selected.severity)}`} />
                <p className="font-bold text-slate-900 truncate">{eventLabel(selected.event_type)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center shrink-0">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className={`text-[10px] font-semibold uppercase tracking-wide border px-2 py-0.5 rounded-md ${sevChip(selected.severity)}`}>{selected.severity}</span>
                <button onClick={() => { setEventFilter(selected.event_type); setPage(0); setSelected(null); }}
                  className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md hover:bg-slate-200">
                  {selected.event_type}
                </button>
              </div>

              <DetailRow label="Time" value={selected.created_at ? formatDateTime(selected.created_at) : '—'} />
              <DetailRow label="Actor" value={selected.actor_username ? `${selected.actor_username} (${selected.actor_role ?? 'user'})` : 'System'} />
              {selected.actor_id && <DetailRow label="Actor ID" value={selected.actor_id} mono />}
              {selected.target_type && <DetailRow label="Target" value={`${selected.target_type}${selected.target_id ? ` · ${selected.target_id}` : ''}`} mono />}
              {selected.request_method && <DetailRow label="Request" value={`${selected.request_method} ${selected.request_path ?? ''}`} mono />}
              {selected.ip_address && <DetailRow label="IP" value={selected.ip_address} mono />}

              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Metadata</p>
                  <pre className="text-xs bg-slate-900 text-slate-100 rounded-xl p-3.5 overflow-x-auto leading-relaxed">
{JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex gap-3">
      <span className="text-xs text-slate-400 w-20 shrink-0 pt-0.5">{label}</span>
      <span className={`text-slate-700 min-w-0 break-words ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
