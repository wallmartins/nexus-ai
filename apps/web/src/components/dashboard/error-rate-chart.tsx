'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export type KnowledgeBaseDataItem = {
  name: string;
  value: number;
  color: string;
};

const DEFAULT_DATA: KnowledgeBaseDataItem[] = [];

export function KnowledgeBaseChart({ data = DEFAULT_DATA }: { data?: KnowledgeBaseDataItem[] }) {
  const hasData = data.length > 0;
  const primaryValue = hasData ? data[0]?.value : 0;
  const primaryLabel = hasData ? data[0]?.name.split(' ')[0] : 'No data';

  return (
    <div className="relative flex items-center justify-center">
      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={64}
                outerRadius={84}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-text-primary">{primaryValue}%</span>
            <span className="text-xs text-text-muted">{primaryLabel}</span>
          </div>
        </>
      ) : (
        <div className="flex h-[200px] items-center justify-center">
          <span className="text-xs text-text-muted">No data</span>
        </div>
      )}
    </div>
  );
}
