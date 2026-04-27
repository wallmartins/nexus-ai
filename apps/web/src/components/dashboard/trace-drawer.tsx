'use client';

import { type LogEntry } from '@/lib/api';
import { X } from 'lucide-react';

type TraceDrawerProps = {
  log: LogEntry | null;
  onClose: () => void;
};

export function TraceDrawer({ log, onClose }: TraceDrawerProps) {
  if (!log) return null;

  const payload = log.payload ?? {};
  const latencyMs = typeof payload.latencyMs === 'number' ? payload.latencyMs : null;
  const chunkCount = typeof payload.chunkCount === 'number' ? payload.chunkCount : null;
  const step = typeof payload.step === 'string' ? payload.step : null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border-subtle bg-surface-1 shadow-float sm:w-[480px]">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Trace detail</h2>
            <p className="mt-0.5 font-mono text-xs text-text-muted">{log.correlationId}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Service</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">{log.service}</p>
            </div>
            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Event</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">{log.eventType}</p>
            </div>
            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Level</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">{log.level}</p>
            </div>
            <div className="rounded-md border border-border-subtle bg-surface-2 p-3">
              <p className="text-xs text-text-muted">Timestamp</p>
              <p className="mt-0.5 text-sm font-medium text-text-primary">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          {(latencyMs !== null || chunkCount !== null || step !== null) && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
                Pipeline stage
              </h3>
              <div className="space-y-2">
                {step && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-brand-lime" />
                    <span className="text-sm text-text-primary">{step}</span>
                  </div>
                )}
                {latencyMs !== null && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-brand-purple" />
                    <span className="text-sm text-text-secondary">
                      Latency: <span className="font-mono text-text-primary">{latencyMs} ms</span>
                    </span>
                  </div>
                )}
                {chunkCount !== null && (
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-status-success" />
                    <span className="text-sm text-text-secondary">
                      Chunks: <span className="font-mono text-text-primary">{chunkCount}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Payload
            </h3>
            <pre className="overflow-auto rounded-md border border-border-subtle bg-surface-2 p-3 font-mono text-xs text-text-secondary">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
