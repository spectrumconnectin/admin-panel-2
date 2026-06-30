'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Download, Users, CreditCard, FolderOpen,
  Scale, TrendingUp, CheckCircle, AlertTriangle, FileText,
} from 'lucide-react';
import {
  getAllUsers, getAllTransactions, getAllJobs, getAllDisputes, getRevenue,
} from '@/lib/api';
import type { AdminUser, AdminTransaction, AdminJob, AdminDispute } from '@/lib/api';

// ── CSV helpers ────────────────────────────────────────────────────────────

function escapeCsv(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const lines = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ];
  return lines.join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Export definitions ─────────────────────────────────────────────────────

type ExportId = 'users' | 'transactions' | 'jobs' | 'disputes' | 'revenue';

interface ExportDef {
  id: ExportId;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  columns: string;
}

const EXPORTS: ExportDef[] = [
  {
    id: 'users',
    label: 'Users',
    description: 'All registered users including their account type, verification status, trust scores, and join dates.',
    icon: <Users className="h-6 w-6" />,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    columns: 'id, email, username, account_type, user_role, is_verified, is_active, trust_tier, trust_score, created_at',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    description: 'All escrow transactions with amounts, fees, commission structure, and participant IDs.',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    columns: 'id, status, type, amount, currency, platform_fee, client_fee, creator_fee, client_id, creator_id, created_at',
  },
  {
    id: 'jobs',
    label: 'Projects',
    description: 'All posted jobs with their current status, department, proposal count, and client details.',
    icon: <FolderOpen className="h-6 w-6" />,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    columns: 'id, title, status, client_id, department, proposal_count, created_at',
  },
  {
    id: 'disputes',
    label: 'Disputes',
    description: 'All dispute records with status, reason, and associated escrow information.',
    icon: <Scale className="h-6 w-6" />,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    columns: 'id, escrow_id, status, reason, raised_by, created_at',
  },
  {
    id: 'revenue',
    label: 'Revenue',
    description: 'Monthly revenue breakdown including client fees, creator fees, total platform revenue, and GMV.',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    columns: 'month, client_fees, creator_fees, total_fees, volume, count',
  },
];

// ── component ──────────────────────────────────────────────────────────────

export default function ExportPage() {
  const [loadingId, setLoadingId] = useState<ExportId | null>(null);
  const [successId, setSuccessId] = useState<ExportId | null>(null);
  const [errors, setErrors] = useState<Record<ExportId, string>>({} as Record<ExportId, string>);
  const [rowCounts, setRowCounts] = useState<Partial<Record<ExportId, number>>>({});

  const handleExport = async (id: ExportId) => {
    setLoadingId(id);
    setErrors(prev => ({ ...prev, [id]: '' }));

    try {
      const now = new Date().toISOString().slice(0, 10);

      switch (id) {
        case 'users': {
          const users: AdminUser[] = await getAllUsers();
          setRowCounts(prev => ({ ...prev, users: users.length }));
          const csv = toCsv(
            ['id', 'email', 'username', 'account_type', 'user_role', 'is_verified', 'is_active', 'trust_tier', 'trust_score', 'created_at'],
            users.map(u => [u.id, u.email, u.username, u.account_type, u.user_role, u.is_verified, u.is_active, u.trust_tier, u.trust_score, u.created_at]),
          );
          downloadCsv(csv, `spectrum-users-${now}.csv`);
          break;
        }
        case 'transactions': {
          const txns: AdminTransaction[] = await getAllTransactions();
          setRowCounts(prev => ({ ...prev, transactions: txns.length }));
          const csv = toCsv(
            ['id', 'status', 'type', 'amount', 'currency', 'platform_fee', 'client_fee', 'creator_fee', 'client_id', 'creator_id', 'created_at'],
            txns.map(t => [t.id, t.status, t.type, t.amount, t.currency, t.platform_fee, t.client_fee, t.creator_fee, t.client_id, t.creator_id, t.created_at]),
          );
          downloadCsv(csv, `spectrum-transactions-${now}.csv`);
          break;
        }
        case 'jobs': {
          const jobs: AdminJob[] = await getAllJobs();
          setRowCounts(prev => ({ ...prev, jobs: jobs.length }));
          const csv = toCsv(
            ['id', 'title', 'status', 'client_id', 'department', 'proposal_count', 'created_at'],
            jobs.map(j => [j.id, j.title, j.status, j.client_id, j.department, j.proposal_count, j.created_at]),
          );
          downloadCsv(csv, `spectrum-jobs-${now}.csv`);
          break;
        }
        case 'disputes': {
          const disputes: AdminDispute[] = await getAllDisputes();
          setRowCounts(prev => ({ ...prev, disputes: disputes.length }));
          const csv = toCsv(
            ['id', 'escrow_id', 'status', 'reason', 'raised_by', 'created_at'],
            disputes.map(d => [d.id, d.escrow_id, d.status, d.reason, d.raised_by, d.created_at]),
          );
          downloadCsv(csv, `spectrum-disputes-${now}.csv`);
          break;
        }
        case 'revenue': {
          const rev = await getRevenue();
          const rows = rev.monthly;
          setRowCounts(prev => ({ ...prev, revenue: rows.length }));
          const csv = toCsv(
            ['month', 'client_fees', 'creator_fees', 'total_fees', 'volume', 'count'],
            rows.map(r => [r.month, r.client_fees, r.creator_fees, r.total_fees, r.volume, r.count]),
          );
          downloadCsv(csv, `spectrum-revenue-${now}.csv`);
          break;
        }
      }

      setSuccessId(id);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (e: unknown) {
      setErrors(prev => ({ ...prev, [id]: e instanceof Error ? e.message : 'Export failed' }));
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Data Export"
        subtitle="Download platform data as CSV files"
      />

      <div className="p-4 lg:p-6 space-y-5 lg:space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <FileText className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold">CSV Export</p>
            <p className="text-xs mt-0.5 text-blue-600">
              Each export fetches up to 100 records from the API and generates a real CSV file that downloads directly to your browser.
              For larger datasets, contact the backend team for a bulk export.
            </p>
          </div>
        </div>

        {/* Export cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPORTS.map(exp => {
            const isLoading = loadingId === exp.id;
            const isSuccess = successId === exp.id;
            const errMsg    = errors[exp.id];
            const rowCount  = rowCounts[exp.id];

            return (
              <div
                key={exp.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col gap-4 transition-all hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${exp.bgColor} ${exp.color}`}>
                    {exp.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800">{exp.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{exp.description}</p>
                  </div>
                </div>

                {/* Columns */}
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Columns</p>
                  <p className="text-xs text-slate-500 font-mono leading-relaxed">{exp.columns}</p>
                </div>

                {/* Row count (shown after export) */}
                {rowCount !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    {rowCount} rows exported
                  </div>
                )}

                {/* Error */}
                {errMsg && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {errMsg}
                  </div>
                )}

                {/* Success */}
                {isSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    Download started!
                  </div>
                )}

                {/* Export button */}
                <button
                  onClick={() => handleExport(exp.id)}
                  disabled={isLoading}
                  className={`mt-auto flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                    isLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : `${exp.bgColor} ${exp.color} hover:opacity-90 ring-1 ring-inset ring-current/20`
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                      Generating CSV…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export {exp.label} CSV
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
