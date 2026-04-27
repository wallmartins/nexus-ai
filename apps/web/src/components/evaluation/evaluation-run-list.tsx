import { type EvaluationRun } from '@/lib/api';
import { Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type EvaluationRunListProps = {
  runs: EvaluationRun[];
  selectedId?: string;
  onSelect: (run: EvaluationRun) => void;
};

function statusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle size={14} className="text-status-success" />;
    case 'failed':
      return <XCircle size={14} className="text-status-danger" />;
    case 'running':
      return <Loader2 size={14} className="animate-spin text-status-info" />;
    default:
      return <Clock size={14} className="text-text-muted" />;
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function EvaluationRunList({ runs, selectedId, onSelect }: EvaluationRunListProps) {
  if (runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-1 p-8">
        <p className="text-sm text-text-muted">No evaluation runs yet</p>
        <p className="mt-1 text-xs text-text-muted">Click "New evaluation run" to start one</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {runs.map((run) => {
        const isSelected = run.id === selectedId;
        const metrics = run.aggregatedMetrics ?? {};
        const hasScores = metrics.avgRelevance !== undefined;

        return (
          <button
            key={run.id}
            type="button"
            onClick={() => onSelect(run)}
            className={`w-full rounded-lg border p-4 text-left transition-colors ${
              isSelected
                ? 'border-brand-lime bg-surface-2'
                : 'border-border-subtle bg-surface-1 hover:bg-surface-2'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {statusIcon(run.status)}
                <span className="text-xs font-medium text-text-secondary">{statusLabel(run.status)}</span>
              </div>
              <span className="font-mono text-xs text-text-muted">
                {new Date(run.startedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2">
              {run.models.map((m, i) => (
                <span
                  key={i}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-mono text-text-secondary"
                >
                  {m.provider}/{m.modelName}
                </span>
              ))}
            </div>

            {hasScores && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">Relevance</p>
                  <p className="mt-0.5 font-mono text-sm text-text-primary">
                    {((metrics.avgRelevance ?? 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">Consistency</p>
                  <p className="mt-0.5 font-mono text-sm text-text-primary">
                    {((metrics.avgConsistency ?? 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">Grounding</p>
                  <p className="mt-0.5 font-mono text-sm text-text-primary">
                    {((metrics.avgGrounding ?? 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
