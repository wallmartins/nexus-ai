'use client';

import { FileText, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSource } from '@/lib/api';

type SourcePanelProps = {
  sources: ChatSource[];
};

const typeStyles: Record<string, { iconColor: string; bg: string }> = {
  pdf: { iconColor: 'text-orange-400', bg: 'bg-orange-400/15' },
  md: { iconColor: 'text-brand-purple-light', bg: 'bg-brand-purple/15' },
  other: { iconColor: 'text-text-secondary', bg: 'bg-surface-3' },
};

function getDocType(documentId: string): string {
  // Simple heuristic based on common patterns; real implementation would use document metadata
  return 'other';
}

export function SourcePanel({ sources }: SourcePanelProps) {
  return (
    <aside
      className="flex h-full w-[320px] shrink-0 flex-col border-l border-border-subtle bg-bg-canvas"
      aria-label="Sources panel"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          Retrieved Chunks
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">
            Sources ({sources.length})
          </h3>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            aria-label="Filter sources"
            title="Filter sources"
          >
            <Filter size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="flex flex-col gap-3">
          {sources.map((source, index) => {
            const docType = getDocType(source.documentId);
            const styles = typeStyles[docType] ?? typeStyles.other;
            const scorePercent = Math.round(source.score * 100);

            return (
              <div
                key={source.chunkId}
                className="rounded-xl border border-border-subtle bg-surface-1 p-3 transition-colors hover:border-border-default"
              >
                <div className="mb-2 flex items-start gap-2.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      styles.bg
                    )}
                  >
                    <FileText size={14} className={styles.iconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-text-muted">
                        [{index + 1}]
                      </span>
                      <span className="truncate text-xs font-semibold text-text-primary">
                        {source.documentId.slice(0, 8)}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Chunk {source.chunkId.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <p className="mb-2 text-xs leading-relaxed text-text-secondary line-clamp-3">
                  {source.preview}
                </p>

                {/* Similarity bar */}
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-brand-lime transition-all"
                      style={{ width: `${scorePercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-brand-lime">
                    sim {source.score.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route decision */}
      <div className="border-t border-border-subtle px-4 py-4">
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-3">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            Workflow
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            retrieve → synthesize → validate → format
          </p>
        </div>
      </div>
    </aside>
  );
}
