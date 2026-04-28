'use client';

import { KnowledgeBaseChart, type KnowledgeBaseDataItem } from './error-rate-chart';

type LegendItem = {
  label: string;
  value: string;
  color: string;
};

const LEGEND: LegendItem[] = [];

const CHART_DATA: KnowledgeBaseDataItem[] = [];

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
        {LEGEND.length === 0 ? (
          <p className="text-xs text-text-muted">No data source breakdown available</p>
        ) : (
          <>
            <KnowledgeBaseChart data={CHART_DATA} />
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
          </>
        )}
      </div>
    </div>
  );
}
