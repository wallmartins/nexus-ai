'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

type Bucket = {
  timestamp: string;
  totalTokens: { input: number; output: number };
};

export function TokenChart({ data }: { data: Bucket[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
        <p className="text-sm text-text-muted">No token data</p>
      </div>
    );
  }

  const formatted = data.map((b) => ({
    time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    input: b.totalTokens.input,
    output: b.totalTokens.output,
  }));

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Token usage</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" tick={{ fill: '#8a8a8a', fontSize: 11 }} />
          <YAxis tick={{ fill: '#8a8a8a', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#8a8a8a' }} />
          <Bar dataKey="input" fill="#c5f547" name="input" radius={[4, 4, 0, 0]} />
          <Bar dataKey="output" fill="#8b5cf6" name="output" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
