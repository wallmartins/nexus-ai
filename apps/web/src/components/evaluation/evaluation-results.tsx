'use client';

import { useState, useEffect } from 'react';
import { getEvaluationResults, type EvaluationRun, type EvaluationResult } from '@/lib/api';
import { ScoreCard } from './score-card';
import { ComparisonTable } from './comparison-table';
import { BarChart3, Clock, Layers } from 'lucide-react';

export function EvaluationResults({ run }: { run: EvaluationRun }) {
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await getEvaluationResults(run.id, { limit: 100 });
        if (!cancelled) setResults(data.results);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [run.id]);

  const metrics = run.aggregatedMetrics ?? {};
  const hasScores = metrics.avgRelevance !== undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border-subtle bg-surface-1 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Run summary</h2>
            <p className="mt-0.5 font-mono text-xs text-text-muted">{run.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {run.models.map((m, i) => (
              <span
                key={i}
                className="rounded-md bg-surface-2 px-2 py-1 text-xs font-mono text-text-secondary"
              >
                {m.provider}/{m.modelName}
              </span>
            ))}
          </div>
        </div>

        {hasScores && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreCard
              label="Relevance"
              score={metrics.avgRelevance ?? 0}
              icon={<BarChart3 size={14} />}
            />
            <ScoreCard
              label="Consistency"
              score={metrics.avgConsistency ?? 0}
              icon={<Layers size={14} />}
            />
            <ScoreCard
              label="Grounding"
              score={metrics.avgGrounding ?? 0}
              icon={<BarChart3 size={14} />}
            />
            <ScoreCard
              label="Latency"
              score={metrics.avgLatencyMs ?? 0}
              icon={<Clock size={14} />}
              format="ms"
            />
          </div>
        )}

        {!hasScores && run.status !== 'running' && run.status !== 'pending' && (
          <p className="mt-4 text-sm text-text-muted">No scores available for this run</p>
        )}

        {(run.status === 'running' || run.status === 'pending') && (
          <p className="mt-4 text-sm text-status-info">Evaluation in progress…</p>
        )}
      </div>

      {results.length > 0 && <ComparisonTable results={results} />}

      {loading && (
        <div className="flex items-center justify-center rounded-lg border border-border-subtle bg-surface-1 p-8">
          <p className="text-sm text-text-muted">Loading results…</p>
        </div>
      )}
    </div>
  );
}
