'use client';

import { useState, useEffect } from 'react';
import { getMetrics, getLogs, type MetricsResponse, type LogEntry } from '@/lib/api';
import { MetricCard } from '@/components/dashboard/metric-card';
import { TimeWindowSelector } from '@/components/dashboard/time-window-selector';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { TokenChart } from '@/components/dashboard/token-chart';
import { ErrorRateChart } from '@/components/dashboard/error-rate-chart';
import { RequestLogTable } from '@/components/dashboard/request-log-table';
import { TraceDrawer } from '@/components/dashboard/trace-drawer';

const WINDOWS = ['1h', '6h', '24h', '7d', '30d'] as const;
export type TimeWindow = (typeof WINDOWS)[number];

export default function DashboardPage() {
  const [window, setWindow] = useState<TimeWindow>('24h');
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

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Observability</h1>
          <p className="text-sm text-text-muted">System health, metrics, and request traces</p>
        </div>
        <TimeWindowSelector value={window} onChange={setWindow} options={[...WINDOWS]} />
      </div>

      {loading && !metrics ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted">Loading metrics…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricCard
              label="Total requests"
              value={summary?.totalRequests ?? 0}
              format="number"
            />
            <MetricCard
              label="Avg latency"
              value={summary?.avgLatencyMs ?? 0}
              format="ms"
            />
            <MetricCard
              label="p95 latency"
              value={summary?.p95LatencyMs ?? 0}
              format="ms"
            />
            <MetricCard
              label="Total tokens"
              value={(summary?.totalTokens.input ?? 0) + (summary?.totalTokens.output ?? 0)}
              format="number"
            />
            <MetricCard
              label="Error rate"
              value={summary?.errorRate ?? 0}
              format="percent"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <LatencyChart data={metrics?.buckets ?? []} />
            <TokenChart data={metrics?.buckets ?? []} />
            <ErrorRateChart data={metrics?.buckets ?? []} />
          </div>

          <div className="flex-1 min-h-0">
            <RequestLogTable logs={logs} onSelect={setSelectedLog} />
          </div>
        </>
      )}

      <TraceDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}
