'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, type AppSettings } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Cpu,
  Database,
  MessageSquare,
  Clock,
  Shield,
  Check,
  Save,
  RotateCcw,
} from 'lucide-react';

const PROVIDERS = [
  {
    id: 'ollama' as const,
    label: 'Ollama',
    description: 'Local open-source models',
    color: 'cat-lime',
  },
  {
    id: 'openai' as const,
    label: 'OpenAI',
    description: 'Cloud GPT models',
    color: 'cat-blue',
  },
  {
    id: 'anthropic' as const,
    label: 'Anthropic',
    description: 'Cloud Claude models',
    color: 'cat-purple',
  },
];

const DEFAULT_MODELS: Record<string, string> = {
  ollama: 'llama3',
  openai: 'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
};

const DEFAULT_SETTINGS: AppSettings = {
  llmProvider: 'ollama',
  llmModel: 'llama3',
  embeddingModel: 'nomic-embed-text',
  chunkSize: 500,
  chunkOverlap: 50,
  retrievalTopK: 5,
  useMMR: false,
  sessionMemoryDepth: 10,
  cacheTtlSeconds: 3600,
  maxInputLength: 4000,
};

type SectionKey = 'provider' | 'chunking' | 'retrieval' | 'memory' | 'guardrails';

const SECTIONS: { key: SectionKey; label: string; icon: React.ElementType }[] = [
  { key: 'provider', label: 'Provider', icon: Cpu },
  { key: 'chunking', label: 'Chunking', icon: Database },
  { key: 'retrieval', label: 'Retrieval', icon: Database },
  { key: 'memory', label: 'Memory', icon: MessageSquare },
  { key: 'guardrails', label: 'Guardrails', icon: Shield },
];

function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: AppSettings) => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const updated = await updateSettings(next);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    setSaveSuccess(false);
    setError(null);
  }, []);

  return { settings, setSettings, loading, saving, save, reset, error, saveSuccess };
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="font-mono text-xs text-brand-lime">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-brand-lime"
        aria-label={label}
      />
      <div className="flex justify-between font-mono text-xs text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        {description && (
          <span className="text-xs text-text-muted">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2',
          checked ? 'bg-brand-lime' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  );
}

export function SettingsForm() {
  const { settings, setSettings, loading, saving, save, reset, error, saveSuccess } =
    useSettings();
  const [activeSection, setActiveSection] = useState<SectionKey>('provider');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
      </div>
    );
  }

  const handleProviderChange = (provider: AppSettings['llmProvider']) => {
    setSettings((prev) => ({
      ...prev,
      llmProvider: provider,
      llmModel: DEFAULT_MODELS[provider] ?? prev.llmModel,
    }));
  };

  const handleSave = () => save(settings);

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <aside className="hidden w-[240px] shrink-0 border-r border-border-subtle lg:block">
        <nav className="space-y-1 px-3 py-4" aria-label="Settings sections">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-lime text-bg-canvas'
                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary',
                )}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile section selector */}
      <div className="w-full px-4 py-4 lg:hidden">
        <div className="flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
          {SECTIONS.map((section) => {
            const active = activeSection === section.key;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'bg-brand-lime text-bg-canvas'
                    : 'text-text-secondary hover:text-text-primary',
                )}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Provider */}
          {activeSection === 'provider' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  LLM Provider
                </h2>
                <p className="text-sm text-text-muted">
                  Select the provider and model used for generating responses.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {PROVIDERS.map((provider) => {
                  const active = settings.llmProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleProviderChange(provider.id)}
                      className={cn(
                        'flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2',
                        active
                          ? 'border-brand-lime bg-surface-2'
                          : 'border-border-subtle bg-surface-1 hover:border-border-default',
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-sm font-semibold text-text-primary">
                          {provider.label}
                        </span>
                        {active && (
                          <span className="flex h-5 items-center rounded bg-brand-lime px-1.5 text-[10px] font-semibold text-bg-canvas">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {provider.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary">
                  Model
                </label>
                <input
                  type="text"
                  value={settings.llmModel}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, llmModel: e.target.value }))
                  }
                  className="w-full rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-lime focus:outline-none"
                  placeholder="e.g. llama3"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-text-primary">
                  Embedding Model
                </label>
                <input
                  type="text"
                  value={settings.embeddingModel}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      embeddingModel: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-lime focus:outline-none"
                  placeholder="e.g. nomic-embed-text"
                />
              </div>
            </section>
          )}

          {/* Chunking */}
          {activeSection === 'chunking' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Chunking
                </h2>
                <p className="text-sm text-text-muted">
                  Configure how documents are split into chunks before embedding.
                </p>
              </div>

              <NumberField
                label="Chunk Size"
                value={settings.chunkSize}
                onChange={(v) => setSettings((prev) => ({ ...prev, chunkSize: v }))}
                min={100}
                max={4000}
                unit="chars"
              />

              <NumberField
                label="Chunk Overlap"
                value={settings.chunkOverlap}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, chunkOverlap: v }))
                }
                min={0}
                max={1000}
                unit="chars"
              />
            </section>
          )}

          {/* Retrieval */}
          {activeSection === 'retrieval' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Retrieval
                </h2>
                <p className="text-sm text-text-muted">
                  Configure how chunks are retrieved during RAG queries.
                </p>
              </div>

              <NumberField
                label="Top-K"
                value={settings.retrievalTopK}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, retrievalTopK: v }))
                }
                min={1}
                max={20}
                unit="chunks"
              />

              <ToggleField
                label="Maximal Marginal Relevance (MMR)"
                description="Diversify retrieved chunks to reduce redundancy"
                checked={settings.useMMR}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, useMMR: v }))
                }
              />
            </section>
          )}

          {/* Memory */}
          {activeSection === 'memory' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Memory
                </h2>
                <p className="text-sm text-text-muted">
                  Configure session memory and response caching.
                </p>
              </div>

              <NumberField
                label="Session Memory Depth"
                value={settings.sessionMemoryDepth}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, sessionMemoryDepth: v }))
                }
                min={1}
                max={50}
                unit="messages"
              />

              <NumberField
                label="Cache TTL"
                value={settings.cacheTtlSeconds}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, cacheTtlSeconds: v }))
                }
                min={60}
                max={86400}
                unit="seconds"
              />
            </section>
          )}

          {/* Guardrails */}
          {activeSection === 'guardrails' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Guardrails
                </h2>
                <p className="text-sm text-text-muted">
                  Configure input validation and safety limits.
                </p>
              </div>

              <NumberField
                label="Max Input Length"
                value={settings.maxInputLength}
                onChange={(v) =>
                  setSettings((prev) => ({ ...prev, maxInputLength: v }))
                }
                min={100}
                max={10000}
                unit="chars"
              />
            </section>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center gap-3 border-t border-border-subtle pt-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2',
                saving
                  ? 'cursor-not-allowed bg-surface-3 text-text-muted'
                  : 'bg-brand-lime text-bg-canvas hover:bg-brand-lime-hover',
              )}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-canvas border-t-transparent" />
                  Saving…
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>

            {error && (
              <p className="text-sm text-status-danger">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
