'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-brand-800/20 blur-3xl" />
      </div>
      {/* Grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{backgroundImage:'repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 40px)'}}>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-900/50">
            <Zap className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Spectrum Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage your platform</p>
        </div>

        {/* Session-expired banner */}
        {params.get('expired') && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-700/50 bg-amber-900/30 px-4 py-3 text-sm text-amber-300 backdrop-blur">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Your session expired. Please sign in again.
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@spectrumconnect.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-600 transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-600 transition focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-700/50 bg-red-900/30 px-3 py-2.5 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-900/40 transition hover:from-brand-500 hover:to-brand-600 disabled:opacity-60"
            >
              {busy ? <><Spinner size="sm" /> Signing in…</> : 'Sign in to Admin Panel'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-600">
          Admin access only · Spectrum Connect Platform
        </p>
      </div>
    </div>
  );
}
