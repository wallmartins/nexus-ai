'use client';

import { KnowledgeBaseChart } from './error-rate-chart';

const LEGEND = [
  { label: 'Unstructured (PDF, MD)', value: '62%', color: 'bg-brand-lime' },
  { label: 'Structured (JSON, CSV)', value: '28%', color: 'bg-brand-purple' },
  { label: 'Web / URL', value: '10%', color: 'bg-surface-3' },
];

export function KnowledgeBaseCard() {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border-subtle bg-surface-1 p-5">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-text-primary">Knowledge base</h3>
        <p className="text-lg font-semibold text-text-primary">
          Data <span className="font-normal text-text-muted">sources</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:flex-row">
        <KnowledgeBaseChart />

        <div className="flex w-full flex-col gap-2 sm:w-auto">
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-text-secondary">{item.label}</span>
              </div>
              <span className="font-medium text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
