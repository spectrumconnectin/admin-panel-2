'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Pagination from '@/components/ui/Pagination';
import { listUsers, suspendUser, activateUser, toggleVerifyUser } from '@/lib/api';
import type { AdminUser } from '@/lib/api';
import { formatDate, formatNumber, shortId } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

const PAGE_SIZE = 25;

// ── health score helpers ───────────────────────────────────────────────────

function computeHealthScore(u: AdminUser): number {
  const verifiedPts = u.is_verified ? 30 : 0;
  const activePts   = u.is_active   ? 30 : 0;
  // trust_score is 0–100, scale to 0–40
  const trustPts    = Math.round(((u.trust_score ?? 0) / 100) * 40);
  return verifiedPts + activePts + trustPts;
}

interface HealthBadge {
  label: string;
  classes: string;
}

function healthBadge(score: number): HealthBadge {
  if (score >= 80) return { label: 'Excellent', classes: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' };
  if (score >= 60) return { label: 'Good',      classes: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200'         };
  if (score >= 40) return { label: 'Fair',      classes: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'      };
  return              { label: 'At Risk',   classes: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200'           };
}

function isRiskyNewUser(u: AdminUser): boolean {
  if (u.trust_score !== 0) return false;
  if (u.is_verified) return false;
  if (!u.created_at) return false;
  const diffDays = (Date.now() - new Date(u.created_at).getTime()) / 86_400_000;
  return diffDays <= 7;
}

// ── component ──────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [users,          setUsers]          = useState<AdminUser[]>([]);
  const [total,          setTotal]          = useState(0);
  const [page,           setPage]           = useState(1);
  const [search,         setSearch]         = useState('');
  const [acctFilter,     setAcctFilter]     = useState('');
  const [activeFilter,   setActiveFilter]   = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [actionId,       setActionId]       = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listUsers({
        page,
        page_size: PAGE_SIZE,
        search:       search || undefined,
        account_type: acctFilter || undefined,
        is_active:    activeFilter  === '' ? undefined : activeFilter === 'active',
        is_verified:  verifiedFilter === '' ? undefined : verifiedFilter === 'verified',
      });
      setUsers(res.users);
      setTotal(res.total);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search, acctFilter, activeFilter, verifiedFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [search, acctFilter, activeFilter, verifiedFilter]);

  const doAction = async (action: () => Promise<unknown>, label: string, userId: string) => {
    if (!confirm(`${label}?`)) return;
    setActionId(userId);
    try {
      await action();
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="flex flex-col">
      <Header title="Users" subtitle={`${formatNumber(total)} total users`} />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            placeholder="Search email, username, name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <select
            value={acctFilter}
            onChange={e => setAcctFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="crew">Creators</option>
            <option value="producer">Clients</option>
            <option value="both">Both</option>
          </select>
          <select
            value={activeFilter}
            onChange={e => setActiveFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select
            value={verifiedFilter}
            onChange={e => setVerifiedFilter(e.target.value)}
            className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:outline-none"
          >
            <option value="">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <button
            onClick={load}
            className="h-9 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Search
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Verified</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Trust</th>
                    <th className="px-4 py-3">Health Score</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">No users found</td>
                    </tr>
                  )}
                  {users.map(u => {
                    const score = computeHealthScore(u);
                    const hb    = healthBadge(score);
                    const risky = isRiskyNewUser(u);

                    return (
                      <tr key={u.id} className="transition-colors hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 shrink-0">
                              {(u.display_name || u.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-slate-800">{u.display_name || u.username}</p>
                                {risky && (
                                  <span title="New unverified user with zero trust score — possible risk">
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{u.email}</p>
                              <p className="text-[10px] text-slate-300 font-mono">{shortId(u.id)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            status={u.account_type}
                            label={
                              u.account_type === 'crew'
                                ? 'Creator'
                                : u.account_type === 'producer'
                                ? 'Client'
                                : 'Both'
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          {u.is_verified
                            ? <span className="text-green-600">✓ Yes</span>
                            : <span className="text-slate-400">✗ No</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={u.is_active !== false ? 'active' : 'suspended'} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize">{u.trust_tier}</span>
                          <span className="ml-1 text-xs text-slate-400">({u.trust_score})</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold w-fit ${hb.classes}`}>
                              {hb.label}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 rounded-full bg-slate-100">
                                <div
                                  className={`h-1.5 rounded-full transition-all ${
                                    score >= 80 ? 'bg-emerald-500' :
                                    score >= 60 ? 'bg-blue-500' :
                                    score >= 40 ? 'bg-amber-400' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400">{score}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{formatDate(u.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {actionId === u.id && <Spinner size="sm" />}
                            <Link
                              href={`/dashboard/users/${u.id}`}
                              className="rounded px-2 py-1 text-xs text-brand-600 hover:bg-brand-50"
                            >
                              View
                            </Link>
                            {u.is_active !== false ? (
                              <button
                                onClick={() => doAction(() => suspendUser(u.id), `Suspend ${u.username}`, u.id)}
                                className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => doAction(() => activateUser(u.id), `Reactivate ${u.username}`, u.id)}
                                className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() => doAction(() => toggleVerifyUser(u.id), `Toggle verification for ${u.username}`, u.id)}
                              className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                            >
                              {u.is_verified ? 'Unverify' : 'Verify'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
