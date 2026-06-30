'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  breakdown: { bronze: number; silver: number; gold: number; platinum: number; diamond: number };
}

const COLORS: Record<string, string> = {
  bronze:   '#cd7f32',
  silver:   '#94a3b8',
  gold:     '#f59e0b',
  platinum: '#7c3aed',
  diamond:  '#06b6d4',
};

export default function EtfChart({ breakdown }: Props) {
  if (!breakdown) return null;
  const data = Object.entries(breakdown).map(([name, value]) => ({ name, value }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} width={40} />
        <Tooltip />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? '#8b5cf6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
