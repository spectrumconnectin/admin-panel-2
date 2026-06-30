interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: 'violet' | 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'orange' | 'indigo';
  trend?: { value: number; label?: string }; // positive = up, negative = down
}

const colorMap: Record<string, { bar: string; icon: string; badge: string }> = {
  violet: { bar: 'from-violet-500 to-purple-600',  icon: 'bg-violet-50 text-violet-600',  badge: 'text-violet-600' },
  blue:   { bar: 'from-blue-500 to-blue-600',      icon: 'bg-blue-50 text-blue-600',      badge: 'text-blue-600'   },
  green:  { bar: 'from-emerald-500 to-green-600',  icon: 'bg-emerald-50 text-emerald-600', badge: 'text-emerald-600' },
  amber:  { bar: 'from-amber-400 to-orange-500',   icon: 'bg-amber-50 text-amber-600',    badge: 'text-amber-600'  },
  red:    { bar: 'from-red-500 to-rose-600',        icon: 'bg-red-50 text-red-600',        badge: 'text-red-600'    },
  teal:   { bar: 'from-teal-500 to-cyan-600',       icon: 'bg-teal-50 text-teal-600',      badge: 'text-teal-600'   },
  orange: { bar: 'from-orange-400 to-red-500',      icon: 'bg-orange-50 text-orange-600',  badge: 'text-orange-600' },
  indigo: { bar: 'from-indigo-500 to-violet-600',   icon: 'bg-indigo-50 text-indigo-600',  badge: 'text-indigo-600' },
};

export default function StatCard({ label, value, sub, icon, color = 'violet', trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className="card-shine group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 lg:p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Top gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.bar}`} />

      <div className="flex items-start justify-between">
        <p className="text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-slate-400 leading-snug pr-1">{label}</p>
        <span className={`flex h-8 w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-xl text-base ${c.icon} transition-transform group-hover:scale-110`}>
          {icon}
        </span>
      </div>

      <p className="mt-2 lg:mt-3 text-xl lg:text-2xl font-bold tracking-tight text-slate-900">{value}</p>

      <div className="mt-1 lg:mt-1.5 flex items-center gap-2">
        {sub && <p className="text-[11px] lg:text-xs text-slate-400 truncate">{sub}</p>}
        {trend && (
          <span className={`ml-auto flex items-center gap-0.5 text-xs font-semibold shrink-0 ${
            trend.value >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}>
            {trend.value >= 0 ? '↑' : '↓'}
            {Math.abs(trend.value)}%
            {trend.label && <span className="font-normal text-slate-400 ml-0.5">{trend.label}</span>}
          </span>
        )}
      </div>
    </div>
  );
}
