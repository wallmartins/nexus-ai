import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { PrismaService } from '../database/prisma.service';

describe('MetricsService', () => {
  let service: MetricsService;

  const prismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('aggregate', () => {
    it('returns aggregated metrics for 24h window', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            total_requests: 100n,
            avg_latency: 1450.5,
            p95_latency: 3200.0,
            total_input_tokens: 42000n,
            total_output_tokens: 11000n,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 500n,
            error_logs: 5n,
          },
        ]);

      const result = await service.aggregate('24h');

      expect(result.totalRequests).toBe(100);
      expect(result.avgLatencyMs).toBe(1451);
      expect(result.p95LatencyMs).toBe(3200);
      expect(result.totalTokens).toEqual({ input: 42000, output: 11000 });
      expect(result.errorRate).toBe(0.01);
      expect(result.window).toBe('24h');
    });

    it('returns zero metrics when no data exists', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            total_requests: 0n,
            avg_latency: null,
            p95_latency: null,
            total_input_tokens: null,
            total_output_tokens: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 0n,
            error_logs: 0n,
          },
        ]);

      const result = await service.aggregate('1h');

      expect(result.totalRequests).toBe(0);
      expect(result.avgLatencyMs).toBe(0);
      expect(result.p95LatencyMs).toBe(0);
      expect(result.totalTokens).toEqual({ input: 0, output: 0 });
      expect(result.errorRate).toBe(0);
    });

    it('calculates error rate correctly', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            total_requests: 50n,
            avg_latency: 1200,
            p95_latency: 2500,
            total_input_tokens: 10000n,
            total_output_tokens: 5000n,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 200n,
            error_logs: 10n,
          },
        ]);

      const result = await service.aggregate('7d');

      expect(result.errorRate).toBe(0.05);
    });

    it('supports all time windows', async () => {
      const windows = ['1h', '6h', '24h', '7d', '30d'] as const;

      for (const window of windows) {
        jest.clearAllMocks();
        prismaService.$queryRaw
          .mockResolvedValueOnce([
            {
              total_requests: 1n,
              avg_latency: 100,
              p95_latency: 200,
              total_input_tokens: 10n,
              total_output_tokens: 5n,
            },
          ])
          .mockResolvedValueOnce([
            {
              total_logs: 10n,
              error_logs: 0n,
            },
          ]);

        const result = await service.aggregate(window);
        expect(result.window).toBe(window);
      }
    });
  });

  describe('aggregateRange', () => {
    it('returns aggregated metrics for a custom date range', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            total_requests: 75n,
            avg_latency: 1800.2,
            p95_latency: 4100.0,
            total_input_tokens: 30000n,
            total_output_tokens: 9000n,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 400n,
            error_logs: 8n,
          },
        ]);

      const from = new Date('2026-04-01T00:00:00Z');
      const to = new Date('2026-04-24T23:59:59Z');

      const result = await service.aggregateRange(from, to);

      expect(result.totalRequests).toBe(75);
      expect(result.avgLatencyMs).toBe(1800);
      expect(result.p95LatencyMs).toBe(4100);
      expect(result.totalTokens).toEqual({ input: 30000, output: 9000 });
      expect(result.errorRate).toBe(0.02);
    });

    it('passes date bounds to message query', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            total_requests: 10n,
            avg_latency: 500,
            p95_latency: 1000,
            total_input_tokens: 1000n,
            total_output_tokens: 500n,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 100n,
            error_logs: 0n,
          },
        ]);

      const from = new Date('2026-04-20T00:00:00Z');
      const to = new Date('2026-04-21T00:00:00Z');

      await service.aggregateRange(from, to);

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });
  });

  describe('aggregateTimeSeries', () => {
    it('returns time-series buckets with summary', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          {
            bucket: new Date('2026-04-24T12:00:00Z'),
            total_requests: 10n,
            avg_latency: 1200.0,
            p95_latency: 2500.0,
            total_input_tokens: 5000n,
            total_output_tokens: 2000n,
          },
          {
            bucket: new Date('2026-04-24T13:00:00Z'),
            total_requests: 15n,
            avg_latency: 1400.0,
            p95_latency: 3000.0,
            total_input_tokens: 7000n,
            total_output_tokens: 3000n,
          },
        ])
        .mockResolvedValueOnce([
          {
            bucket: new Date('2026-04-24T12:00:00Z'),
            total_logs: 50n,
            error_logs: 1n,
          },
          {
            bucket: new Date('2026-04-24T13:00:00Z'),
            total_logs: 60n,
            error_logs: 0n,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_requests: 25n,
            avg_latency: 1300.0,
            p95_latency: 2750.0,
            total_input_tokens: 12000n,
            total_output_tokens: 5000n,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 110n,
            error_logs: 1n,
          },
        ]);

      const from = new Date('2026-04-24T00:00:00Z');
      const to = new Date('2026-04-24T23:59:59Z');

      const result = await service.aggregateTimeSeries(from, to, 'hour');

      expect(result.granularity).toBe('hour');
      expect(result.period.from).toBe(from.toISOString());
      expect(result.period.to).toBe(to.toISOString());
      expect(result.buckets).toHaveLength(2);
      expect(result.buckets![0].timestamp).toBe('2026-04-24T12:00:00.000Z');
      expect(result.buckets![0].totalRequests).toBe(10);
      expect(result.buckets![0].errorRate).toBe(0.02);
      expect(result.buckets![1].timestamp).toBe('2026-04-24T13:00:00.000Z');
      expect(result.buckets![1].errorRate).toBe(0);
      expect(result.summary.totalRequests).toBe(25);
    });

    it('returns empty buckets when no data exists', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            total_requests: 0n,
            avg_latency: null,
            p95_latency: null,
            total_input_tokens: null,
            total_output_tokens: null,
          },
        ])
        .mockResolvedValueOnce([
          {
            total_logs: 0n,
            error_logs: 0n,
          },
        ]);

      const from = new Date('2026-04-24T00:00:00Z');
      const to = new Date('2026-04-24T23:59:59Z');

      const result = await service.aggregateTimeSeries(from, to, 'day');

      expect(result.buckets).toEqual([]);
      expect(result.summary.totalRequests).toBe(0);
    });
  });
});
