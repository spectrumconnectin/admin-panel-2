/** Format a number as currency. Backend stores all amounts in USD. */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format a large number with commas (e.g. 1,240). */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/** Truncate a MongoDB ObjectId to the last 8 chars for display. */
export function shortId(id: string): string {
  return id ? `…${id.slice(-8)}` : '—';
}

/** Format an ISO date string to "Jan 15, 2025". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Format an ISO date string to "Jan 15, 2025 · 10:30 AM". */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Return a relative time string ("2 days ago"). */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 30) return `${days}d ago`;
  return formatDate(iso);
}

/** Capitalise first letter. */
export function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/** Map a job/dispute/user status to a Tailwind colour class. */
export function statusColor(status: string): string {
  const map: Record<string, string> = {
    open:        'bg-blue-100 text-blue-800',
    active:      'bg-green-100 text-green-800',
    completed:   'bg-purple-100 text-purple-800',
    delivered:   'bg-teal-100 text-teal-800',
    approved:    'bg-green-100 text-green-800',
    closed:      'bg-slate-100 text-slate-600',
    removed:     'bg-red-100 text-red-700',
    suspended:   'bg-red-100 text-red-700',
    disputed:    'bg-orange-100 text-orange-800',
    pending:     'bg-yellow-100 text-yellow-800',
    processing:  'bg-blue-100 text-blue-800',
    failed:      'bg-red-100 text-red-700',
    refunded:    'bg-slate-100 text-slate-600',
    cancelled:   'bg-slate-100 text-slate-600',
    under_review:'bg-amber-100 text-amber-800',
    resolved:    'bg-green-100 text-green-800',
  };
  return map[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
}
