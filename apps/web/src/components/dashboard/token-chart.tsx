'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const INSIGHT_DATA = [
  { name: 'Relevance', value: 72 },
  { name: 'Consist.', value: 85 },
  { name: 'Ground.', value: 94 },
  { name: 'Latency', value: 68 },
  { name: 'Cost', value: 78 },
];

export function InsightMiniChart() {
  return (
    <div className="h-[90px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={INSIGHT_DATA} barCategoryGap="30%">
          <XAxis
            dataKey="name"
            tick={{ fill: '#8a8a8a', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            contentStyle={{
              background: '#111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: '#fff',
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={28}>
            {INSIGHT_DATA.map((_, i) => (
              <Cell key={i} fill={i === 2 ? '#c5f547' : '#8b5cf6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
