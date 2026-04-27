'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

type NewRunModalProps = {
  onClose: () => void;
  onSubmit: (models: Array<{ provider: string; modelName: string }>) => void;
};

const PRESET_MODELS = [
  { provider: 'ollama', modelName: 'llama3' },
  { provider: 'openai', modelName: 'gpt-4o-mini' },
  { provider: 'anthropic', modelName: 'claude-3-haiku-20240307' },
];

export function NewRunModal({ onClose, onSubmit }: NewRunModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const toggleModel = (key: string) => {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
  };

  async function handleSubmit() {
    if (selected.size === 0) return;

    const models = PRESET_MODELS.filter((m) =>
      selected.has(`${m.provider}/${m.modelName}`),
    );

    setSubmitting(true);
    try {
      await onSubmit(models);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border-subtle bg-surface-1 p-6 shadow-float">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">New evaluation run</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-2 hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mt-2 text-sm text-text-muted">
          Select the models to evaluate against the dataset.
        </p>

        <div className="mt-4 space-y-2">
          {PRESET_MODELS.map((model) => {
            const key = `${model.provider}/${model.modelName}`;
            const isSelected = selected.has(key);

            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleModel(key)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  isSelected
                    ? 'border-brand-lime bg-surface-2'
                    : 'border-border-subtle bg-surface-2 hover:border-border-default'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded border ${
                    isSelected ? 'border-brand-lime bg-brand-lime' : 'border-border-default'
                  }`}
                >
                  {isSelected && <span className="text-xs text-bg-canvas">✓</span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{model.provider}</p>
                  <p className="font-mono text-xs text-text-muted">{model.modelName}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border-subtle px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected.size === 0 || submitting}
            className="rounded-md bg-brand-lime px-4 py-2 text-sm font-medium text-bg-canvas transition-colors hover:bg-brand-lime-hover disabled:opacity-50"
          >
            {submitting ? 'Starting…' : 'Start run'}
          </button>
        </div>
      </div>
    </>
  );
}
