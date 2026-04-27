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
    it('should return aggregated metrics for 24h window', async () => {
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

    it('should return zero metrics when no data exists', async () => {
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

    it('should calculate error rate correctly', async () => {
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

    it('should support all time windows', async () => {
      prismaService.$queryRaw
        .mockResolvedValue([
          {
            total_requests: 1n,
            avg_latency: 100,
            p95_latency: 200,
            total_input_tokens: 10n,
            total_output_tokens: 5n,
          },
        ]);

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
});
