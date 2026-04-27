'use client';

import { useState, useEffect } from 'react';
import { getMetrics, getLogs, type MetricsResponse, type LogEntry } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/metric-card';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { AiInsightCard } from '@/components/dashboard/ai-insight-card';
import { TimelineCard } from '@/components/dashboard/timeline-card';
import { KnowledgeBaseCard } from '@/components/dashboard/knowledge-base-card';
import { RequestLogTable } from '@/components/dashboard/request-log-table';
import { TraceDrawer } from '@/components/dashboard/trace-drawer';
import {
  Sparkles,
  Activity,
  Zap,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
  Plus,
} from 'lucide-react';

const WINDOWS = ['1h', '6h', '24h', '7d', '30d'] as const;
export type TimeWindow = (typeof WINDOWS)[number];

export default function DashboardPage() {
  const [window, setWindow] = useState<TimeWindow>('7d');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [m, l] = await Promise.all([
          getMetrics(window),
          getLogs({ limit: 50 }),
        ]);
        if (!cancelled) {
          setMetrics(m);
          setLogs(l.entries);
        }
      } catch {
        if (!cancelled) {
          setMetrics(null);
          setLogs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [window]);

  const summary = metrics?.summary;

  const successRate = summary ? (1 - summary.errorRate) * 100 : 0;

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Top header section */}
      <div className="flex flex-col gap-5">
        {/* Pill + actions row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-surface-1 px-3 py-1.5 text-xs font-medium text-text-secondary">
            <Sparkles size={12} className="text-text-muted" />
            System overview
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWindow('7d')}
              className="inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-surface-1 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
            >
              <RefreshCw size={12} />
              Last 7 days
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-pill bg-brand-lime px-4 py-2 text-xs font-semibold text-bg-canvas transition-colors hover:bg-brand-lime-hover"
            >
              <Plus size={14} />
              New query
            </button>
          </div>
        </div>

        {/* Headline */}
        <h1 className="max-w-2xl text-3xl font-normal leading-tight tracking-tight text-text-primary sm:text-4xl">
          Answers you can trust, grounded by{' '}
          <span className="font-semibold">real documents.</span>
        </h1>

        {/* Status pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-border-subtle bg-surface-1 px-2.5 py-1 text-[11px] font-medium text-text-muted">
            Nexus AI
          </span>
          <span className="rounded-md border border-border-subtle bg-surface-1 px-2.5 py-1 text-[11px] font-medium text-text-muted">
            Local-first RAG
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-1 px-2.5 py-1 text-[11px] font-medium text-status-success">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-status-success" />
            System operational
          </span>
        </div>
      </div>

      {loading && !metrics ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted">Loading metrics…</p>
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Success rate"
              value={`${successRate.toFixed(0)}%`}
              subtitle="this week · target ≥ 90%"
              icon={Activity}
              variant="featured"
            />
            <MetricCard
              label="Error rate"
              value={`${((summary?.errorRate ?? 0) * 100).toFixed(1)}%`}
              subtitle="last 7 days"
              icon={Zap}
              delta={{ value: '-1.8%', direction: 'down' }}
            />
            <MetricCard
              label="Total requests"
              value={(summary?.totalRequests ?? 0).toLocaleString()}
              subtitle="without fallback · 7d"
              icon={CheckCircle2}
              delta={{ value: '+14%', direction: 'up' }}
            />
            <MetricCard
              label="Avg latency"
              value={`${Math.round(summary?.avgLatencyMs ?? 0)} ms`}
              subtitle="p50 across all services"
              icon={TrendingUp}
              delta={{ value: '-9%', direction: 'down' }}
            />
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <LatencyChart data={metrics?.buckets ?? []} />
            </div>
            <div className="lg:col-span-2">
              <AiInsightCard />
            </div>
          </div>

          {/* Bottom section */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <TimelineCard />
            <KnowledgeBaseCard />
          </div>

          {/* Request logs */}
          <div className="min-h-0 flex-1">
            <RequestLogTable logs={logs} onSelect={setSelectedLog} />
          </div>
        </>
      )}

      <TraceDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
