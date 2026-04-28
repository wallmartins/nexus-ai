'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Bucket = {
  timestamp: string;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalTokens: { input: number; output: number };
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function LatencyChart({ data }: { data: Bucket[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
        <p className="text-sm text-text-muted">No latency data</p>
      </div>
    );
  }

  // Build a 7-day view from available buckets, padding with zeros if needed.
  const formatted = Array.from({ length: 7 }, (_, i) => {
    const idx = data.length - 7 + i;
    const b = idx >= 0 ? data[idx] : null;
    const totalTokens = b
      ? (b.totalTokens?.input ?? 0) + (b.totalTokens?.output ?? 0)
      : 0;
    return {
      day: DAY_NAMES[i],
      latencyS: b ? Number((b.avgLatencyMs / 1000).toFixed(1)) : 0,
      tokensK: Number((totalTokens / 1000).toFixed(1)),
    };
  });

  const totalTokensK = formatted.reduce((s, d) => s + d.tokensK, 0);
  const avgLatency = formatted.reduce((s, d) => s + d.latencyS, 0) / formatted.length;

  return (
    <div className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface-1 p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Latency &amp; token consumption</h3>
          <div className="mt-1 flex items-center gap-4">
            <span className="text-2xl font-semibold text-text-primary">
              {avgLatency.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-text-muted">s p50</span>
            </span>
            <span className="text-2xl font-semibold text-text-primary">
              {Math.round(totalTokensK).toLocaleString()}
              <span className="ml-1 text-sm font-normal text-text-muted">K tokens</span>
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-pill border border-border-subtle bg-surface-2 px-3 py-1 text-xs text-text-secondary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
          Last 7 days
        </span>
      </div>

      <div className="flex-1 min-h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted} barGap={4} barCategoryGap="20%">
            <XAxis
              dataKey="day"
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              contentStyle={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: 12,
              }}
            />
            <Bar dataKey="latencyS" radius={[6, 6, 0, 0]} maxBarSize={24}>
              {formatted.map((_, i) => (
                <Cell key={`l-${i}`} fill="#2a2a2a" />
              ))}
            </Bar>
            <Bar dataKey="tokensK" radius={[6, 6, 0, 0]} maxBarSize={24}>
              {formatted.map((_, i) => (
                <Cell
                  key={`t-${i}`}
                  fill={i === 6 ? '#c5f547' : '#8b5cf6'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-lime" />
          Latency p50 (s)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-brand-purple" />
          Tokens used (k)
        </span>
      </div>
    </div>
  );
}
