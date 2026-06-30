'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { getUserDetail, suspendUser, activateUser, toggleVerifyUser, updateUserRole } from '@/lib/api';
import type { AdminUserDetail } from '@/lib/api';
import { formatDate, formatCurrency, capitalize } from '@/lib/utils';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [user,    setUser]    = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState(false);
  const [error,   setError]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setUser(await getUserDetail(id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (fn: () => Promise<unknown>, label: string) => {
    if (!confirm(`${label}?`)) return;
    setBusy(true);
    try { await fn(); await load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  const doRoleChange = async () => {
    const role = prompt('New role (user / moderator / admin):')?.trim();
    if (!role || !['user', 'admin', 'moderator'].includes(role)) return;
    setBusy(true);
    try { await updateUserRole(id, role); await load(); }
    catch (e: unknown) { alert(e instanceof Error ? e.message : 'Failed'); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center"><Spinner size="lg" /></div>
  );

  if (error || !user) return (
    <div className="p-8 text-center text-red-600">{error || 'User not found'}</div>
  );

  return (
    <div className="flex flex-col">
      <Header title={user.display_name || user.username} subtitle={user.email} />
      <div className="p-4 lg:p-6 space-y-5 lg:space-y-5">

        {/* Actions bar */}
        <div className="flex flex-wrap gap-2 items-center">
          <button onClick={() => router.back()}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            ← Back
          </button>
          {busy && <Spinner size="sm" />}
          {user.is_active !== false ? (
            <button onClick={() => doAction(() => suspendUser(id), `Suspend ${user.username}`)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
              Suspend Account
            </button>
          ) : (
            <button onClick={() => doAction(() => activateUser(id), `Reactivate ${user.username}`)}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
              Reactivate Account
            </button>
          )}
          <button onClick={() => doAction(() => toggleVerifyUser(id), `Toggle verification`)}
            className="rounded-lg border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
            {user.is_verified ? 'Remove Verification' : 'Mark as Verified'}
          </button>
          <button onClick={doRoleChange}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
            Change Role
          </button>
        </div>

        {/* Profile card */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl font-bold text-brand-700">
                {(user.display_name || user.username).charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-3 text-lg font-semibold text-slate-900">{user.display_name || user.username}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <div className="mt-2 flex gap-2">
                <Badge status={user.account_type}
                  label={user.account_type === 'crew' ? 'Creator' : user.account_type === 'producer' ? 'Client' : 'Both'} />
                <Badge status={user.user_role} />
                <Badge status={user.is_active !== false ? 'active' : 'suspended'} />
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <Row label="Verified"   value={user.is_verified ? '✓ Yes' : '✗ No'} />
              <Row label="Trust Tier" value={capitalize(user.trust_tier)} />
              <Row label="Trust Score" value={String(user.trust_score)} />
              <Row label="Joined"      value={formatDate(user.created_at)} />
              <Row label="Username"    value={`@${user.username}`} />
            </div>
          </div>

          {/* Profile detail */}
          <div className="lg:col-span-2 space-y-4">
            {user.profile && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Profile</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Row label="Location"       value={user.profile.location || '—'} />
                  <Row label="Tagline"         value={user.profile.tagline  || '—'} />
                  <Row label="Min Rate"        value={user.profile.hourly_rate_min ? formatCurrency(user.profile.hourly_rate_min) : '—'} />
                  <Row label="Max Rate"        value={user.profile.hourly_rate_max ? formatCurrency(user.profile.hourly_rate_max) : '—'} />
                  <Row label="Portfolio Items" value={String(user.profile.portfolio_item_count)} />
                  <Row label="Skills"          value={user.profile.skills.length ? user.profile.skills.join(', ') : '—'} />
                </div>
                {user.profile.bio && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Bio</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{user.profile.bio}</p>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">IDs &amp; References</h3>
              <div className="space-y-2 font-mono text-xs text-slate-500">
                <div><span className="text-slate-400">User ID: </span>{user.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-400 shrink-0">{label}</span>
      <span className="font-medium text-slate-700 text-right">{value}</span>
    </div>
  );
}
