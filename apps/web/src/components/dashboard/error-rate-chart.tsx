'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const DATA = [
  { name: 'Unstructured (PDF, MD)', value: 62, color: '#c5f547' },
  { name: 'Structured (JSON, CSV)', value: 28, color: '#8b5cf6' },
  { name: 'Web / URL', value: 10, color: '#2a2a2a' },
];

export function KnowledgeBaseChart() {
  return (
    <div className="relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={DATA}
            cx="50%"
            cy="50%"
            innerRadius={64}
            outerRadius={84}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-text-primary">62%</span>
        <span className="text-xs text-text-muted">Unstructured</span>
      </div>
    </div>
  );
}
