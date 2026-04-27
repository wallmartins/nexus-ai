'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listEvaluationRuns,
  getEvaluationRun,
  triggerEvaluation,
  type EvaluationRun,
} from '@/lib/api';
import { EvaluationRunList } from '@/components/evaluation/evaluation-run-list';
import { NewRunModal } from '@/components/evaluation/new-run-modal';
import { EvaluationResults } from '@/components/evaluation/evaluation-results';
import { Plus } from 'lucide-react';

export default function EvaluationsPage() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<EvaluationRun | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const loadRuns = useCallback(async () => {
    try {
      const data = await listEvaluationRuns({ limit: 50 });
      setRuns(data.runs);

      const hasRunning = data.runs.some((r) => r.status === 'running' || r.status === 'pending');
      setPolling(hasRunning);
    } catch {
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(() => {
      void loadRuns();
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, loadRuns]);

  async function handleTrigger(models: Array<{ provider: string; modelName: string }>) {
    await triggerEvaluation(models);
    setShowModal(false);
    setPolling(true);
    await loadRuns();
  }

  async function handleSelectRun(run: EvaluationRun) {
    try {
      const fresh = await getEvaluationRun(run.id);
      setSelectedRun(fresh);
    } catch {
      setSelectedRun(run);
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Evaluations</h1>
          <p className="text-sm text-text-muted">Run evaluations and compare model performance</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-md bg-brand-lime px-4 py-2.5 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover"
        >
          <Plus size={16} />
          New evaluation run
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted">Loading evaluation runs…</p>
        </div>
      ) : (
        <div className="flex flex-1 gap-6 overflow-hidden">
          <div className="flex w-full flex-col gap-4 overflow-auto lg:w-[380px] lg:flex-shrink-0">
            <EvaluationRunList
              runs={runs}
              selectedId={selectedRun?.id}
              onSelect={handleSelectRun}
            />
          </div>

          <div className="hidden flex-1 overflow-auto lg:block">
            {selectedRun ? (
              <EvaluationResults run={selectedRun} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-lg border border-border-subtle bg-surface-1">
                <p className="text-text-muted">Select a run to view results</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showModal && <NewRunModal onClose={() => setShowModal(false)} onSubmit={handleTrigger} />}
    </div>
  );
}
