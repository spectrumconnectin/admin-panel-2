'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-900"><Spinner size="lg" /></div>}>
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

  // If already authenticated, go to dashboard
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
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-2xl font-bold text-white shadow-lg">
            S
          </div>
          <h1 className="text-xl font-bold text-white">Spectrum Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to the admin panel</p>
        </div>

        {/* Session-expired banner */}
        {params.get('expired') && (
          <div className="mb-4 rounded-lg bg-amber-900/40 border border-amber-700 px-4 py-3 text-sm text-amber-300">
            Your session expired. Please sign in again.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-2xl bg-slate-800 p-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@spectrumconnect.com"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-900/40 border border-red-700 px-3 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            {busy ? <><Spinner size="sm" /> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Admin access only · Spectrum Connect Platform
        </p>
      </div>
    </div>
  );
}
