import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export type TimeWindow = '1h' | '6h' | '24h' | '7d' | '30d';
export type Granularity = 'hour' | 'day';

export type AggregatedMetrics = {
  totalRequests: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalTokens: { input: number; output: number };
  errorRate: number;
};

export type MetricsResponse = {
  period: { from: string; to: string };
  granularity?: string;
  summary: AggregatedMetrics;
  buckets?: TimeSeriesBucket[];
};

export type TimeSeriesBucket = AggregatedMetrics & {
  timestamp: string;
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

  async aggregate(window: TimeWindow): Promise<AggregatedMetrics & { window: string }> {
    const since = new Date(Date.now() - WINDOW_MS[window]);
    const summary = await this.aggregateRange(since, new Date());
    return { ...summary, window };
  }

  async aggregateRange(from: Date, to: Date): Promise<AggregatedMetrics> {
    const [messageStats, errorStats] = await Promise.all([
      this.aggregateMessages(from, to),
      this.aggregateErrors(from, to),
    ]);

    return {
      totalRequests: messageStats.totalRequests,
      avgLatencyMs: Math.round(messageStats.avgLatencyMs ?? 0),
      p95LatencyMs: Math.round(messageStats.p95LatencyMs ?? 0),
      totalTokens: messageStats.totalTokens,
      errorRate: errorStats.errorRate,
    };
  }

  async aggregateTimeSeries(
    from: Date,
    to: Date,
    granularity: Granularity,
  ): Promise<MetricsResponse> {
    const truncUnit = granularity === 'hour' ? 'hour' : 'day';

    const [messageBuckets, errorBuckets, summary] = await Promise.all([
      this.messageTimeSeries(from, to, truncUnit),
      this.errorTimeSeries(from, to, truncUnit),
      this.aggregateRange(from, to),
    ]);

    const mergedBuckets = this.mergeBuckets(messageBuckets, errorBuckets);

    return {
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
      },
      granularity,
      summary,
      buckets: mergedBuckets,
    };
  }

  private async aggregateMessages(from: Date, to: Date) {
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
      WHERE "createdAt" >= ${from}
        AND "createdAt" <= ${to}
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

  private async aggregateErrors(from: Date, to: Date) {
    const result = await this.prisma.$queryRaw<Array<{
      total_logs: bigint;
      error_logs: bigint;
    }>>`
      SELECT
        COUNT(*)::bigint AS total_logs,
        COUNT(*) FILTER (WHERE level = 'error')::bigint AS error_logs
      FROM log_entries
      WHERE timestamp >= ${from}
        AND timestamp <= ${to}
    `;

    const row = result[0];
    const total = Number(row.total_logs ?? 0);
    const errors = Number(row.error_logs ?? 0);

    return {
      errorRate: total > 0 ? Math.round((errors / total) * 10000) / 10000 : 0,
    };
  }

  private async messageTimeSeries(from: Date, to: Date, truncUnit: string) {
    const rows = await this.prisma.$queryRaw<Array<{
      bucket: Date;
      total_requests: bigint;
      avg_latency: number | null;
      p95_latency: number | null;
      total_input_tokens: bigint | null;
      total_output_tokens: bigint | null;
    }>>`
      SELECT
        DATE_TRUNC(${truncUnit}, "createdAt") AS bucket,
        COUNT(*)::bigint AS total_requests,
        AVG("latencyMs")::float AS avg_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "latencyMs")::float AS p95_latency,
        SUM(("tokens"->>'input')::int)::bigint AS total_input_tokens,
        SUM(("tokens"->>'output')::int)::bigint AS total_output_tokens
      FROM messages
      WHERE "createdAt" >= ${from}
        AND "createdAt" <= ${to}
        AND "latencyMs" IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    return rows.map((row) => ({
      timestamp: row.bucket.toISOString(),
      totalRequests: Number(row.total_requests ?? 0),
      avgLatencyMs: Math.round(row.avg_latency ?? 0),
      p95LatencyMs: Math.round(row.p95_latency ?? 0),
      totalTokens: {
        input: Number(row.total_input_tokens ?? 0),
        output: Number(row.total_output_tokens ?? 0),
      },
      errorRate: 0,
    }));
  }

  private async errorTimeSeries(from: Date, to: Date, truncUnit: string) {
    const rows = await this.prisma.$queryRaw<Array<{
      bucket: Date;
      total_logs: bigint;
      error_logs: bigint;
    }>>`
      SELECT
        DATE_TRUNC(${truncUnit}, timestamp) AS bucket,
        COUNT(*)::bigint AS total_logs,
        COUNT(*) FILTER (WHERE level = 'error')::bigint AS error_logs
      FROM log_entries
      WHERE timestamp >= ${from}
        AND timestamp <= ${to}
      GROUP BY bucket
      ORDER BY bucket ASC
    `;

    return new Map(
      rows.map((row) => {
        const total = Number(row.total_logs ?? 0);
        const errors = Number(row.error_logs ?? 0);
        return [
          row.bucket.toISOString(),
          total > 0 ? Math.round((errors / total) * 10000) / 10000 : 0,
        ];
      }),
    );
  }

  private mergeBuckets(
    messageBuckets: TimeSeriesBucket[],
    errorMap: Map<string, number>,
  ): TimeSeriesBucket[] {
    return messageBuckets.map((bucket) => ({
      ...bucket,
      errorRate: errorMap.get(bucket.timestamp) ?? 0,
    }));
  }
}
