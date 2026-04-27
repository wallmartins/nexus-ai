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
  errorRate: number;
};

export function ErrorRateChart({ data }: { data: Bucket[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
        <p className="text-sm text-text-muted">No error data</p>
      </div>
    );
  }

  const formatted = data.map((b) => ({
    time: new Date(b.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    rate: Number((b.errorRate * 100).toFixed(2)),
  }));

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1 p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Error rate</h3>
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
            formatter={(value) => [`${value}%`, 'error rate']}
          />
          <Area type="monotone" dataKey="rate" stroke="#f47266" fill="rgba(244,114,102,0.15)" name="error rate %" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
