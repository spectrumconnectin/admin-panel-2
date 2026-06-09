'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { RevenueMonth } from '@/lib/api';

interface Props { data: RevenueMonth[] }

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs">
      <p className="mb-1.5 font-semibold text-slate-700">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-slate-800">
            ${p.value.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function RevenueChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-slate-400">
        No revenue data yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#0ea5e9" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={55}
          tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-slate-600">{value}</span>}
        />
        <Area
          type="monotone" dataKey="total_fees" name="Platform Fees"
          stroke="#7c3aed" strokeWidth={2}
          fill="url(#colorFees)" dot={false} activeDot={{ r: 4 }}
        />
        <Area
          type="monotone" dataKey="volume" name="GMV"
          stroke="#0ea5e9" strokeWidth={2}
          fill="url(#colorGMV)" dot={false} activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
