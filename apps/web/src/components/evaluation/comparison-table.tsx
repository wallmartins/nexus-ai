import { useState } from 'react';
import { type EvaluationResult } from '@/lib/api';
import { ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

type ComparisonTableProps = {
  results: EvaluationResult[];
};

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-surface-3';
  if (score >= 0.8) return 'bg-status-success';
  if (score >= 0.6) return 'bg-status-warning';
  return 'bg-status-danger';
}

function scoreWidth(score: number | null): string {
  if (score === null) return '0%';
  return `${Math.min(score * 100, 100)}%`;
}

function MetricBar({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[10px] uppercase tracking-wide text-text-muted">{label}</span>
      <div className="flex-1">
        <div className="h-1 w-full rounded-full bg-surface-3">
          <div
            className={`h-1 rounded-full ${scoreColor(score)}`}
            style={{ width: scoreWidth(score) }}
          />
        </div>
      </div>
      <span className="w-8 text-right font-mono text-[10px] text-text-secondary">
        {score !== null ? `${(score * 100).toFixed(0)}%` : '—'}
      </span>
    </div>
  );
}

export function ComparisonTable({ results }: ComparisonTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    const next = new Set(expanded);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpanded(next);
  }

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-1">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">Per-question results</h3>
        <p className="text-xs text-text-muted">{results.length} questions evaluated</p>
      </div>

      <div className="divide-y divide-border-subtle">
        {results.map((result, index) => {
          const isExpanded = expanded.has(result.id);
          const hasError = result.generatedAnswer.startsWith('ERROR:');
          const scores = [
            result.relevanceScore,
            result.consistencyScore,
            result.groundingScore,
          ];
          const avgScore = scores.filter((s) => s !== null).reduce((a, b) => a + (b ?? 0), 0) / (scores.filter((s) => s !== null).length || 1);

          return (
            <div
              key={result.id}
              className={`${hasError ? 'border-l-2 border-l-status-warning' : ''}`}
            >
              <button
                type="button"
                onClick={() => toggle(result.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2"
              >
                <span className="w-6 text-center font-mono text-xs text-text-muted">{index + 1}</span>

                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm text-text-primary">{result.questionText}</p>
                  <div className="mt-1.5 flex items-center gap-4">
                    <MetricBar label="Rel" score={result.relevanceScore} />
                    <MetricBar label="Con" score={result.consistencyScore} />
                    <MetricBar label="Grd" score={result.groundingScore} />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {hasError && (
                    <AlertTriangle size={14} className="text-status-warning" />
                  )}
                  <span className="font-mono text-xs text-text-muted">
                    {result.latencyMs !== null ? `${result.latencyMs}ms` : '—'}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={14} className="text-text-muted" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border-subtle bg-surface-2 px-4 py-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Expected answer</p>
                      <p className="mt-1 text-sm text-text-secondary">{result.expectedAnswer || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Generated answer</p>
                      <p className={`mt-1 text-sm ${hasError ? 'text-status-danger' : 'text-text-secondary'}`}>
                        {result.generatedAnswer}
                      </p>
                    </div>
                  </div>

                  {result.retrievedChunkIds.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Retrieved chunks</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {result.retrievedChunkIds.map((chunkId) => (
                          <span
                            key={chunkId}
                            className="rounded bg-surface-3 px-2 py-0.5 font-mono text-[10px] text-text-muted"
                          >
                            {chunkId}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Tokens</p>
                      <p className="mt-0.5 font-mono text-xs text-text-secondary">
                        {result.tokens?.input ?? 0} in / {result.tokens?.output ?? 0} out
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">Average score</p>
                      <p className="mt-0.5 font-mono text-xs text-text-secondary">
                        {(avgScore * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
