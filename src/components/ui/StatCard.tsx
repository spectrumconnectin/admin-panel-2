interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: string;
  color?: 'violet' | 'blue' | 'green' | 'amber' | 'red' | 'teal' | 'orange';
}

const colorMap: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-600',
  blue:   'bg-blue-50 text-blue-600',
  green:  'bg-green-50 text-green-600',
  amber:  'bg-amber-50 text-amber-600',
  red:    'bg-red-50 text-red-600',
  teal:   'bg-teal-50 text-teal-600',
  orange: 'bg-orange-50 text-orange-600',
};

export default function StatCard({ label, value, sub, icon, color = 'violet' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg ${colorMap[color]}`}>
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
