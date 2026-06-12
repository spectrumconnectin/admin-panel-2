'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import { Phone, RefreshCw, Mail, Building2, Globe, Calendar, X } from 'lucide-react';
import { getCeoCalls, updateCeoCall } from '@/lib/api';
import type { CeoCallRequest, CeoCallStatus, CeoCallListResult } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const STATUSES: { value: CeoCallStatus; label: string; color: string }[] = [
  { value: 'new',          label: 'New',          color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'under_review', label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'accepted',     label: 'Accepted',     color: 'bg-violet-50 text-violet-700 border-violet-200' },
  { value: 'scheduled',    label: 'Scheduled',    color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'completed',    label: 'Completed',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'declined',     label: 'Declined',     color: 'bg-red-50 text-red-600 border-red-200' },
];

const PURPOSE_LABEL: Record<string, string> = {
  partnership: 'Partnership', investment: 'Investment', business: 'Business Opportunity',
  enterprise: 'Enterprise Inquiry', feedback: 'Platform Feedback', media: 'Media Request', other: 'Other',
};

const MEETING_LABEL: Record<string, string> = {
  google_meet: 'Google Meet', zoom: 'Zoom', phone: 'Phone Call',
};

function statusMeta(s: CeoCallStatus) {
  return STATUSES.find(x => x.value === s) ?? STATUSES[0];
}

export default function CeoCallsPage() {
  const [data, setData] = useState<CeoCallListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<CeoCallRequest | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (statusFilter: string) => {
    setLoading(true);
    try {
      setData(await getCeoCalls(statusFilter || undefined));
    } catch { /* surfaced via empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const changeStatus = async (req: CeoCallRequest, status: CeoCallStatus) => {
    setSaving(true);
    try {
      const res = await updateCeoCall(req.id, { status });
      setSelected(res.request);
      await load(filter);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const saveNotes = async (req: CeoCallRequest, notes: string) => {
    setSaving(true);
    try {
      const res = await updateCeoCall(req.id, { admin_notes: notes });
      setSelected(res.request);
      await load(filter);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const counts = data?.counts;

  return (
    <div className="flex flex-col">
      <Header
        title="Call the CEO"
        subtitle="Founder meeting requests"
        actions={
          <button onClick={() => load(filter)}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      <div className="p-4 lg:p-6 space-y-5">
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}>
            All{data ? ` · ${Object.values(data.counts).reduce((a, b) => a + b, 0)}` : ''}
          </button>
          {STATUSES.map(s => (
            <button key={s.value} onClick={() => setFilter(s.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === s.value ? 'bg-slate-900 text-white border-slate-900' : `${s.color} hover:opacity-80`
              }`}>
              {s.label}{counts ? ` · ${counts[s.value] ?? 0}` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : !data || data.requests.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Phone className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No requests{filter ? ` with status "${statusMeta(filter as CeoCallStatus).label}"` : ' yet'}.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="text-left font-semibold px-4 py-3">Requester</th>
                  <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">Purpose</th>
                  <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">Meeting</th>
                  <th className="text-left font-semibold px-4 py-3">Status</th>
                  <th className="text-left font-semibold px-4 py-3 hidden sm:table-cell">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.map(r => {
                  const sm = statusMeta(r.status);
                  return (
                    <tr key={r.id} onClick={() => setSelected(r)}
                      className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{r.full_name}</p>
                        <p className="text-xs text-slate-400">{r.email}{r.company_name ? ` · ${r.company_name}` : ''}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-600">{PURPOSE_LABEL[r.purpose] ?? r.purpose}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                        {r.meeting_type ? MEETING_LABEL[r.meeting_type] ?? r.meeting_type : '—'}
                        {r.preferred_date ? ` · ${r.preferred_date}` : ''}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold uppercase tracking-wide border px-2 py-0.5 rounded-md ${sm.color}`}>{sm.label}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-slate-400">
                        {r.created_at ? formatDateTime(r.created_at) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <p className="font-bold text-slate-900">{selected.full_name}</p>
                <p className="text-xs text-slate-400">{PURPOSE_LABEL[selected.purpose] ?? selected.purpose}</p>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Status control */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map(s => (
                    <button key={s.value} disabled={saving} onClick={() => changeStatus(selected, s.value)}
                      className={`text-xs font-medium border px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
                        selected.status === s.value ? `${s.color} ring-2 ring-offset-1 ring-slate-300` : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-2 text-sm">
                <Row icon={<Mail className="h-4 w-4" />} label="Email" value={<a href={`mailto:${selected.email}`} className="text-brand-600 hover:underline">{selected.email}</a>} />
                {selected.phone && <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={selected.phone} />}
                {selected.company_name && <Row icon={<Building2 className="h-4 w-4" />} label="Company" value={selected.company_name} />}
                {selected.country && <Row icon={<Globe className="h-4 w-4" />} label="Country" value={selected.country} />}
                <Row icon={<Calendar className="h-4 w-4" />} label="Meeting"
                  value={`${selected.meeting_type ? MEETING_LABEL[selected.meeting_type] ?? selected.meeting_type : '—'}${selected.preferred_date ? ` · ${selected.preferred_date}` : ''}${selected.preferred_time ? ` ${selected.preferred_time}` : ''}`} />
              </div>

              {selected.subject && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Subject</p>
                  <p className="text-sm text-slate-700">{selected.subject}</p>
                </div>
              )}

              {selected.message && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1">Message</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 rounded-xl p-3.5 leading-relaxed">{selected.message}</p>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Internal Notes</p>
                <NotesEditor key={selected.id} initial={selected.admin_notes ?? ''} saving={saving}
                  onSave={notes => saveNotes(selected, notes)} />
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-300">{icon}</span>
      <span className="text-xs text-slate-400 w-16 shrink-0">{label}</span>
      <span className="text-slate-700 min-w-0 truncate">{value}</span>
    </div>
  );
}

function NotesEditor({ initial, saving, onSave }: { initial: string; saving: boolean; onSave: (v: string) => void }) {
  const [val, setVal] = useState(initial);
  const dirty = val !== initial;
  return (
    <div>
      <textarea rows={4} value={val} onChange={e => setVal(e.target.value)}
        placeholder="Notes for the team (not visible to the requester)…"
        className="w-full text-sm rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand-500 focus:ring-2 focus:ring-blue-100 resize-none" />
      {dirty && (
        <button disabled={saving} onClick={() => onSave(val)}
          className="mt-2 text-xs font-semibold bg-cobalt text-white px-3 py-1.5 rounded-lg hover:bg-cobalt-2 disabled:opacity-50">
          {saving ? 'Saving…' : 'Save notes'}
        </button>
      )}
    </div>
  );
}
