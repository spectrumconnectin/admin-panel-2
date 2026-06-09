'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { RevenueMonth } from '@/lib/api';

interface Props { data: RevenueMonth[] }

export default function RevenueChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-slate-400">
        No revenue data yet
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={60}
          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
        <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} />
        <Legend />
        <Line type="monotone" dataKey="total_fees" name="Platform Fees"
          stroke="#7c3aed" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="volume" name="GMV"
          stroke="#0ea5e9" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
