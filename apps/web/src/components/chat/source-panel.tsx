'use client';

import { X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSource } from '@/lib/api';

type SourcePanelProps = {
  open: boolean;
  onClose: () => void;
  sources: ChatSource[];
};

export function SourcePanel({ open, onClose, sources }: SourcePanelProps) {
  return (
    <>
      {/* Backdrop on mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed right-0 top-0 z-40 flex h-screen w-[360px] flex-col border-l border-border-subtle bg-surface-1 transition-transform duration-base ease-emphasized lg:static lg:h-auto lg:translate-x-0',
          open ? 'translate-x-0' : 'translate-x-full lg:hidden',
        )}
        aria-label="Sources panel"
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-4">
          <h3 className="text-sm font-semibold text-text-primary">
            Sources
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            aria-label="Close sources panel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {sources.length === 0 ? (
            <p className="text-sm text-text-muted">
              No sources available for this message.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sources.map((source, index) => (
                <div
                  key={source.chunkId}
                  className="rounded-md border border-border-subtle bg-surface-2 p-3 transition-colors hover:border-border-default"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-brand-purple/10">
                      <FileText size={12} className="text-brand-purple-light" />
                    </div>
                    <span className="text-xs font-medium text-text-secondary">
                      Document {source.documentId.slice(0, 8)}
                    </span>
                    <span className="ml-auto text-xs font-mono text-brand-lime">
                      {Math.round(source.score * 100)}%
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-text-secondary">
                    {source.preview}
                  </p>

                  {/* Similarity bar */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className="h-full rounded-full bg-brand-lime transition-all"
                      style={{ width: `${Math.round(source.score * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
