import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type TimeWindow = '1h' | '6h' | '24h' | '7d' | '30d';

export type AggregatedMetrics = {
  totalRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalTokens: { input: number; output: number };
  errorRate: number;
  window: string;
};

const WINDOW_MS: Record<TimeWindow, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
};

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async aggregate(window: TimeWindow): Promise<AggregatedMetrics> {
    const since = new Date(Date.now() - WINDOW_MS[window]);

    const [messageStats, errorStats] = await Promise.all([
      this.aggregateMessages(since),
      this.aggregateErrors(since),
    ]);

    return {
      totalRequests: messageStats.totalRequests,
      avgLatencyMs: Math.round(messageStats.avgLatencyMs ?? 0),
      p95LatencyMs: Math.round(messageStats.p95LatencyMs ?? 0),
      totalTokens: messageStats.totalTokens,
      errorRate: errorStats.errorRate,
      window,
    };
  }

  private async aggregateMessages(since: Date) {
    const result = await this.prisma.$queryRaw<Array<{
      total_requests: bigint;
      avg_latency: number | null;
      p95_latency: number | null;
      total_input_tokens: bigint | null;
      total_output_tokens: bigint | null;
    }>>`
      SELECT
        COUNT(*)::bigint AS total_requests,
        AVG("latencyMs")::float AS avg_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latencyMs")::float AS p95_latency,
        SUM(("tokens"->>'input')::int)::bigint AS total_input_tokens,
        SUM(("tokens"->>'output')::int)::bigint AS total_output_tokens
      FROM messages
      WHERE "createdAt" >= ${since}
        AND "latencyMs" IS NOT NULL
    `;

    const row = result[0];

    return {
      totalRequests: Number(row.total_requests ?? 0),
      avgLatencyMs: row.avg_latency ?? 0,
      p95LatencyMs: row.p95_latency ?? 0,
      totalTokens: {
        input: Number(row.total_input_tokens ?? 0),
        output: Number(row.total_output_tokens ?? 0),
      },
    };
  }

  private async aggregateErrors(since: Date) {
    const result = await this.prisma.$queryRaw<Array<{
      total_logs: bigint;
      error_logs: bigint;
    }>>`
      SELECT
        COUNT(*)::bigint AS total_logs,
        COUNT(*) FILTER (WHERE level = 'error')::bigint AS error_logs
      FROM log_entries
      WHERE timestamp >= ${since}
    `;

    const row = result[0];
    const total = Number(row.total_logs ?? 0);
    const errors = Number(row.error_logs ?? 0);

    return {
      errorRate: total > 0 ? Math.round((errors / total) * 10000) / 10000 : 0,
    };
  }
}
