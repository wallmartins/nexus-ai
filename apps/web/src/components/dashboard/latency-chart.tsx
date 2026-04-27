'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Bucket = {
  timestamp: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
};

export function LatencyChart({ data }: { data: Bucket[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
        <p className="text-sm text-text-muted">No latency data</p>
      </div>
    );
  }

  const formatted = data.map((b) => ({
    time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    avg: b.avgLatencyMs,
    p95: b.p95LatencyMs,
  }));

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Latency</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted}>
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
          <Area type="monotone" dataKey="avg" stroke="#c5f547" fill="rgba(197,245,71,0.15)" name="avg" />
          <Area type="monotone" dataKey="p95" stroke="#a78bfa" fill="rgba(167,139,250,0.15)" name="p95" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
