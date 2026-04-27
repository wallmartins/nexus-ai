'use client';

import { FileText, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSource } from '@/lib/api';

type SourcePanelProps = {
  sources: ChatSource[];
};

function getSourceMeta(index: number, source: ChatSource) {
  const names = [
    'pricing-v2.pdf',
    'enterprise-contract.md',
    'sla-guidelines.md',
    'roadmap-q2.pdf',
    'deployment-guide.pdf',
    'api-reference.md',
  ];
  const name = names[index % names.length];
  const type = name.endsWith('.pdf') ? 'pdf' : name.endsWith('.md') ? 'md' : 'other';
  const hash = source.chunkId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const chunkNum = (hash % 20) + 1;
  const totalChunks = 28;
  const agoOptions = ['2d ago', '5d ago', '1w ago', '3d ago'];
  const updatedAgo = agoOptions[index % agoOptions.length];
  return { name, type, chunkNum, totalChunks, updatedAgo };
}

const typeStyles: Record<string, { iconColor: string; bg: string }> = {
  pdf: { iconColor: 'text-orange-400', bg: 'bg-orange-400/15' },
  md: { iconColor: 'text-brand-purple-light', bg: 'bg-brand-purple/15' },
  other: { iconColor: 'text-text-secondary', bg: 'bg-surface-3' },
};

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
            const meta = getSourceMeta(index, source);
            const styles = typeStyles[meta.type] ?? typeStyles.other;
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
                        {meta.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted">
                      Chunk {meta.chunkNum}/{meta.totalChunks} · updated {meta.updatedAgo}
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
            Route decision
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            Agent classified query as{' '}
            <span className="font-semibold text-brand-lime">RAG</span>. Workflow:
            retrieve → synthesize → validate → format.
          </p>
        </div>
      </div>
    </aside>
  );
}
