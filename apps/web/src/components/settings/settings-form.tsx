'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings, type AppSettings } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Settings,
  Search,
  MessageSquare,
  Shield,
  Clock,
  ListOrdered,
  Key,
  Check,
  Save,
  RotateCcw,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type ChunkStrategy = 'semantic' | 'fixed' | 'sentence';

type ExtendedSettings = AppSettings & {
  chunkStrategy: ChunkStrategy;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_SETTINGS: ExtendedSettings = {
  llmProvider: 'ollama',
  llmModel: 'llama3:8b',
  embeddingModel: 'nomic-embed-text',
  chunkSize: 512,
  chunkOverlap: 64,
  retrievalTopK: 5,
  useMMR: true,
  sessionMemoryDepth: 10,
  cacheTtlSeconds: 3600,
  maxInputLength: 4000,
  chunkStrategy: 'semantic',
};

type SectionKey =
  | 'providers'
  | 'retrieval'
  | 'prompts'
  | 'guardrails'
  | 'memory'
  | 'queues'
  | 'api-keys';

const SECTIONS: {
  key: SectionKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: 'providers', label: 'Providers', icon: Settings },
  { key: 'retrieval', label: 'Retrieval', icon: Search },
  { key: 'prompts', label: 'Prompts', icon: MessageSquare },
  { key: 'guardrails', label: 'Guardrails', icon: Shield },
  { key: 'memory', label: 'Memory & cache', icon: Clock },
  { key: 'queues', label: 'Queues', icon: ListOrdered },
  { key: 'api-keys', label: 'API keys', icon: Key },
];

const PROVIDERS = [
  {
    id: 'ollama' as const,
    label: 'Ollama',
    model: 'llama3:8b',
    description: 'Local · free · runs on your machine',
    status: 'Online',
    price: '$0.00',
    iconLetter: 'O',
    iconBg: 'bg-brand-lime',
    iconText: 'text-bg-canvas',
    activeBorder: 'border-l-[3px] border-l-brand-lime',
  },
  {
    id: 'openai' as const,
    label: 'OpenAI',
    model: 'gpt-4o-mini',
    description: 'Cloud · fast · best for demos',
    status: 'Ready',
    price: '$0.15 / 1M',
    iconLetter: 'O',
    iconBg: 'bg-brand-purple',
    iconText: 'text-white',
    activeBorder: 'border-l-[3px] border-l-brand-purple',
  },
  {
    id: 'anthropic' as const,
    label: 'Anthropic',
    model: 'claude-3.5-haiku',
    description: 'Cloud · balanced quality',
    status: 'Ready',
    price: '$0.25 / 1M',
    iconLetter: 'A',
    iconBg: 'bg-[#f7b955]',
    iconText: 'text-bg-canvas',
    activeBorder: 'border-l-[3px] border-l-[#f7b955]',
  },
];

/* ------------------------------------------------------------------ */
/*  Hook                                                                */
/* ------------------------------------------------------------------ */

function useSettings() {
  const [settings, setSettings] = useState<ExtendedSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    getSettings()
      .then((data) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (next: ExtendedSettings) => {
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const { chunkStrategy: _, ...apiPayload } = next;
      const updated = await updateSettings(apiPayload);
      setSettings({ ...DEFAULT_SETTINGS, ...updated });
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

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function SliderField({
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <span className="font-mono text-sm text-brand-lime">
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
        className="slider-lime h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-3"
        aria-label={label}
      />
      <div className="flex justify-between font-mono text-xs text-text-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ToggleGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <div className="inline-flex rounded-lg border border-border-subtle bg-surface-1 p-1">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              value.toLowerCase() === opt.toLowerCase()
                ? 'bg-brand-lime text-bg-canvas'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function SettingsForm() {
  const { settings, setSettings, loading, saving, save, reset, error, saveSuccess } =
    useSettings();
  const [activeSection, setActiveSection] = useState<SectionKey>('providers');

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-lime border-t-transparent" />
      </div>
    );
  }

  const handleProviderChange = (provider: AppSettings['llmProvider']) => {
    const modelMap: Record<string, string> = {
      ollama: 'llama3:8b',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3.5-haiku',
    };
    setSettings((prev) => ({
      ...prev,
      llmProvider: provider,
      llmModel: modelMap[provider] ?? prev.llmModel,
    }));
  };

  const handleSave = () => save(settings);

  return (
    <div className="flex h-full">
      {/* Inline slider styles */}
      <style>{`
        .slider-lime::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: var(--color-brand-lime);
          margin-top: -6px;
          cursor: pointer;
          border: none;
        }
        .slider-lime::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: var(--color-brand-lime);
          border: none;
          cursor: pointer;
        }
      `}</style>

      {/* Left sidebar */}
      <aside className="hidden w-[240px] shrink-0 border-r border-border-subtle lg:block">
        <div className="px-3 pt-6 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Settings
          </span>
        </div>
        <nav className="space-y-1 px-3 py-2" aria-label="Settings sections">
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
      <div className="flex-1 overflow-y-auto px-4 py-6 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-4xl">
          {/* ========================================================== */}
          {/*  PROVIDERS SECTION                                         */}
          {/* ========================================================== */}
          {activeSection === 'providers' && (
            <div className="space-y-8">
              {/* Header */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs font-medium text-text-secondary">
                  <Settings size={14} />
                  Providers
                </div>
                <h1 className="text-2xl font-semibold text-text-primary">
                  LLM & embedding provider
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-text-muted">
                  Nexus is model-agnostic. Switch between local (Ollama) and cloud
                  (OpenAI, Anthropic) without code changes.
                </p>
              </div>

              {/* Provider cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {PROVIDERS.map((provider) => {
                  const active = settings.llmProvider === provider.id;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => handleProviderChange(provider.id)}
                      className={cn(
                        'flex flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2',
                        active
                          ? cn(
                              provider.activeBorder,
                              'border-y border-r border-border-subtle bg-surface-1',
                            )
                          : 'border-border-subtle bg-surface-1 hover:border-border-default',
                      )}
                    >
                      {/* Top row: icon + status */}
                      <div className="flex w-full items-start justify-between">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold',
                            provider.iconBg,
                            provider.iconText,
                          )}
                        >
                          {provider.iconLetter}
                        </div>
                        {active && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime px-2.5 py-1 text-[11px] font-semibold text-bg-canvas">
                            <Check size={12} strokeWidth={3} />
                            Active
                          </span>
                        )}
                      </div>

                      {/* Name + model */}
                      <div className="flex flex-col gap-0.5">
                        <span className="text-base font-semibold text-text-primary">
                          {provider.label}
                        </span>
                        <span className="font-mono text-xs text-text-muted">
                          {provider.model}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-text-secondary">
                        {provider.description}
                      </p>

                      {/* Bottom row: status dot + price */}
                      <div className="mt-auto flex w-full items-center justify-between border-t border-border-subtle pt-4">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                          <span className="h-2 w-2 rounded-full bg-status-success" />
                          {provider.status}
                        </span>
                        <span className="font-mono text-xs text-text-muted">
                          {provider.price}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chunking parameters card */}
              <div className="rounded-2xl border border-border-subtle bg-surface-1 p-6">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-text-primary">
                    Chunking parameters
                  </h2>
                  <p className="text-sm text-text-muted">
                    Changes apply to newly ingested documents.
                  </p>
                </div>

                {/* Sliders */}
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <SliderField
                    label="Chunk size"
                    value={settings.chunkSize}
                    onChange={(v) =>
                      setSettings((prev) => ({ ...prev, chunkSize: v }))
                    }
                    min={128}
                    max={1024}
                    unit="tokens"
                  />
                  <SliderField
                    label="Chunk overlap"
                    value={settings.chunkOverlap}
                    onChange={(v) =>
                      setSettings((prev) => ({ ...prev, chunkOverlap: v }))
                    }
                    min={0}
                    max={256}
                    unit="tokens"
                  />
                </div>

                {/* Toggle groups */}
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <ToggleGroup
                    label="Strategy"
                    options={['Semantic', 'Fixed', 'Sentence']}
                    value={settings.chunkStrategy}
                    onChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        chunkStrategy: v.toLowerCase() as ChunkStrategy,
                      }))
                    }
                  />
                  <ToggleGroup
                    label="Top-K"
                    options={['3', '5', '10']}
                    value={String(settings.retrievalTopK)}
                    onChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        retrievalTopK: Number(v),
                      }))
                    }
                  />
                  <ToggleGroup
                    label="MMR"
                    options={['Off', 'On']}
                    value={settings.useMMR ? 'On' : 'Off'}
                    onChange={(v) =>
                      setSettings((prev) => ({
                        ...prev,
                        useMMR: v === 'On',
                      }))
                    }
                  />
                </div>

                {/* Actions */}
                <div className="mt-8 flex items-center justify-end gap-3 border-t border-border-subtle pt-6">
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2"
                  >
                    <RotateCcw size={14} />
                    Reset defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-lime focus-visible:outline-offset-2',
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
                        <Check size={16} />
                        Save changes
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <p className="mt-3 text-right text-sm text-status-danger">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/*  RETRIEVAL SECTION                                         */}
          {/* ========================================================== */}
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
              <p className="text-sm text-text-muted">
                Retrieval settings are managed in the Chunking parameters card on
                the Providers page.
              </p>
            </section>
          )}

          {/* ========================================================== */}
          {/*  PROMPTS SECTION                                           */}
          {/* ========================================================== */}
          {activeSection === 'prompts' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Prompts
                </h2>
                <p className="text-sm text-text-muted">
                  Customise system and user prompts.
                </p>
              </div>
              <p className="text-sm text-text-muted">Coming soon.</p>
            </section>
          )}

          {/* ========================================================== */}
          {/*  GUARDRAILS SECTION                                        */}
          {/* ========================================================== */}
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
              <div className="space-y-6">
                <SliderField
                  label="Max Input Length"
                  value={settings.maxInputLength}
                  onChange={(v) =>
                    setSettings((prev) => ({ ...prev, maxInputLength: v }))
                  }
                  min={100}
                  max={10000}
                  unit="chars"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
                  >
                    <RotateCcw size={14} />
                    Reset defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      saving
                        ? 'cursor-not-allowed bg-surface-3 text-text-muted'
                        : 'bg-brand-lime text-bg-canvas hover:bg-brand-lime-hover',
                    )}
                  >
                    {saving ? 'Saving…' : saveSuccess ? 'Saved' : 'Save changes'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================== */}
          {/*  MEMORY & CACHE SECTION                                    */}
          {/* ========================================================== */}
          {activeSection === 'memory' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Memory & cache
                </h2>
                <p className="text-sm text-text-muted">
                  Configure session memory and response caching.
                </p>
              </div>
              <div className="space-y-6">
                <SliderField
                  label="Session Memory Depth"
                  value={settings.sessionMemoryDepth}
                  onChange={(v) =>
                    setSettings((prev) => ({
                      ...prev,
                      sessionMemoryDepth: v,
                    }))
                  }
                  min={1}
                  max={50}
                  unit="messages"
                />
                <SliderField
                  label="Cache TTL"
                  value={settings.cacheTtlSeconds}
                  onChange={(v) =>
                    setSettings((prev) => ({ ...prev, cacheTtlSeconds: v }))
                  }
                  min={60}
                  max={86400}
                  unit="seconds"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-1 px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
                  >
                    <RotateCcw size={14} />
                    Reset defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                      saving
                        ? 'cursor-not-allowed bg-surface-3 text-text-muted'
                        : 'bg-brand-lime text-bg-canvas hover:bg-brand-lime-hover',
                    )}
                  >
                    {saving ? 'Saving…' : saveSuccess ? 'Saved' : 'Save changes'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================== */}
          {/*  QUEUES SECTION                                            */}
          {/* ========================================================== */}
          {activeSection === 'queues' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Queues
                </h2>
                <p className="text-sm text-text-muted">
                  Manage background job queues.
                </p>
              </div>
              <p className="text-sm text-text-muted">Coming soon.</p>
            </section>
          )}

          {/* ========================================================== */}
          {/*  API KEYS SECTION                                          */}
          {/* ========================================================== */}
          {activeSection === 'api-keys' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  API keys
                </h2>
                <p className="text-sm text-text-muted">
                  Manage API keys for external integrations.
                </p>
              </div>
              <p className="text-sm text-text-muted">Coming soon.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
