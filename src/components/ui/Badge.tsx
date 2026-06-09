import { capitalize } from '@/lib/utils';

interface BadgeProps {
  status: string;
  label?: string;
}

const badgeMap: Record<string, string> = {
  active:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed:   'bg-violet-50 text-violet-700 ring-violet-200',
  delivered:   'bg-teal-50 text-teal-700 ring-teal-200',
  approved:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  open:        'bg-blue-50 text-blue-700 ring-blue-200',
  pending:     'bg-yellow-50 text-yellow-700 ring-yellow-200',
  processing:  'bg-sky-50 text-sky-700 ring-sky-200',
  resolved:    'bg-emerald-50 text-emerald-700 ring-emerald-200',
  under_review:'bg-amber-50 text-amber-700 ring-amber-200',
  suspended:   'bg-red-50 text-red-700 ring-red-200',
  failed:      'bg-red-50 text-red-700 ring-red-200',
  removed:     'bg-red-50 text-red-700 ring-red-200',
  disputed:    'bg-orange-50 text-orange-700 ring-orange-200',
  closed:      'bg-slate-100 text-slate-600 ring-slate-200',
  refunded:    'bg-slate-100 text-slate-600 ring-slate-200',
  cancelled:   'bg-slate-100 text-slate-600 ring-slate-200',
  crew:        'bg-blue-50 text-blue-700 ring-blue-200',
  producer:    'bg-teal-50 text-teal-700 ring-teal-200',
  both:        'bg-violet-50 text-violet-700 ring-violet-200',
};

const dotMap: Record<string, string> = {
  active:      'bg-emerald-500',
  completed:   'bg-violet-500',
  open:        'bg-blue-500',
  pending:     'bg-yellow-500',
  resolved:    'bg-emerald-500',
  suspended:   'bg-red-500',
  failed:      'bg-red-500',
  disputed:    'bg-orange-500',
  under_review:'bg-amber-500',
};

export default function Badge({ status, label }: BadgeProps) {
  const classes = badgeMap[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  const dot = dotMap[status?.toLowerCase()];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${classes}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
      {label ?? capitalize(status?.replace('_', ' '))}
    </span>
  );
}
