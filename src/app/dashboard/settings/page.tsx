'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, Trash2, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { wipeAllData } from '@/lib/api';
import type { WipeDataResult } from '@/lib/api';

const CONFIRM_PHRASE = 'WIPE ALL DATA';

export default function SettingsPage() {
  const { user } = useAuth();
  const isFullAdmin = user?.user_role === 'admin';

  const [modalOpen, setModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<WipeDataResult | null>(null);

  const canSubmit = password.trim().length > 0 && phrase === CONFIRM_PHRASE && !loading;

  function closeModal() {
    if (loading) return;
    setModalOpen(false);
    setPassword('');
    setPhrase('');
    setError('');
  }

  async function handleWipe() {
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      const res = await wipeAllData(password, phrase);
      setResult(res);
      setModalOpen(false);
      setPassword('');
      setPhrase('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Wipe failed. Check your password and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <Header title="Settings" subtitle="Platform configuration & maintenance" />

      <div className="p-4 lg:p-6 space-y-6 max-w-3xl">

        {/* Success banner after a wipe */}
        {result && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-800">{result.message}</p>
                {Object.keys(result.collections).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(result.collections).map(([name, count]) => (
                      <span key={name} className="text-[11px] bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-md">
                        {name}: {count.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-emerald-600 mt-2">
                  Preserved: {result.preserved.join(', ')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <section className="rounded-xl border-2 border-red-200 bg-white overflow-hidden">
          <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h2 className="text-sm font-bold text-red-700 uppercase tracking-wide">Danger Zone</h2>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">Wipe all platform data</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                  Permanently deletes every user, project, proposal, escrow, transaction, message,
                  notification, ETF point, dispute, review, and service on the platform.
                  <span className="font-semibold text-slate-700"> Admin accounts and platform settings are kept.</span>{' '}
                  This cannot be undone — use it to clear test data before launch.
                </p>
              </div>

              {isFullAdmin ? (
                <button
                  onClick={() => { setResult(null); setModalOpen(true); }}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Wipe All Data
                </button>
              ) : (
                <span className="text-xs text-slate-400 flex items-center gap-1.5 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Full admin only
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">Wipe all platform data</p>
                  <p className="text-[11px] text-red-600">This action is irreversible</p>
                </div>
              </div>
              <button onClick={closeModal} disabled={loading} className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                You are about to permanently delete <strong>all platform data</strong>. Admin accounts
                and settings will be preserved. To proceed, confirm your identity and type the phrase below.
              </p>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Your admin password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>

              {/* Confirmation phrase */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-red-600">{CONFIRM_PHRASE}</span> to confirm
                </label>
                <input
                  type="text"
                  value={phrase}
                  onChange={e => setPhrase(e.target.value)}
                  placeholder={CONFIRM_PHRASE}
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

            {/* Modal actions */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={closeModal}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWipe}
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? <Spinner size="sm" /> : <Trash2 className="h-3.5 w-3.5" />}
                {loading ? 'Wiping…' : 'Permanently wipe all data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
