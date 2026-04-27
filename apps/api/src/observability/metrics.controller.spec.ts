import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

describe('MetricsController', () => {
  let controller: MetricsController;

  const mockAggregate = jest.fn();
  const mockAggregateRange = jest.fn();
  const mockAggregateTimeSeries = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: {
            aggregate: mockAggregate,
            aggregateRange: mockAggregateRange,
            aggregateTimeSeries: mockAggregateTimeSeries,
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  it('instantiates', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/observability/metrics', () => {
    it('returns window-based metrics when window is provided', async () => {
      const result = {
        totalRequests: 100,
        avgLatencyMs: 1200,
        p95LatencyMs: 2500,
        totalTokens: { input: 5000, output: 2000 },
        errorRate: 0.01,
        window: '24h',
      };
      mockAggregate.mockResolvedValueOnce(result);

      const response = await controller.getMetrics('24h');

      expect(mockAggregate).toHaveBeenCalledWith('24h');
      expect(response).toEqual(result);
    });

    it('returns range-based metrics when from and to are provided', async () => {
      const summary = {
        totalRequests: 50,
        avgLatencyMs: 1500,
        p95LatencyMs: 3000,
        totalTokens: { input: 3000, output: 1500 },
        errorRate: 0.02,
      };
      mockAggregateRange.mockResolvedValueOnce(summary);

      const response = await controller.getMetrics(
        undefined,
        '2026-04-01T00:00:00Z',
        '2026-04-24T23:59:59Z',
      );

      expect(mockAggregateRange).toHaveBeenCalledWith(
        new Date('2026-04-01T00:00:00Z'),
        new Date('2026-04-24T23:59:59Z'),
      );
      expect(response).toEqual({
        period: {
          from: '2026-04-01T00:00:00.000Z',
          to: '2026-04-24T23:59:59.000Z',
        },
        summary,
      });
    });

    it('returns time-series metrics when granularity is provided', async () => {
      const timeSeriesResult = {
        period: {
          from: '2026-04-24T00:00:00.000Z',
          to: '2026-04-24T23:59:59.000Z',
        },
        granularity: 'hour',
        summary: {
          totalRequests: 25,
          avgLatencyMs: 1300,
          p95LatencyMs: 2750,
          totalTokens: { input: 12000, output: 5000 },
          errorRate: 0.01,
        },
        buckets: [
          {
            timestamp: '2026-04-24T12:00:00.000Z',
            totalRequests: 10,
            avgLatencyMs: 1200,
            p95LatencyMs: 2500,
            totalTokens: { input: 5000, output: 2000 },
            errorRate: 0.02,
          },
        ],
      };
      mockAggregateTimeSeries.mockResolvedValueOnce(timeSeriesResult);

      const response = await controller.getMetrics(
        undefined,
        '2026-04-24T00:00:00Z',
        '2026-04-24T23:59:59Z',
        'hour',
      );

      expect(mockAggregateTimeSeries).toHaveBeenCalledWith(
        new Date('2026-04-24T00:00:00Z'),
        new Date('2026-04-24T23:59:59Z'),
        'hour',
      );
      expect(response).toEqual(timeSeriesResult);
    });

    it('rejects invalid window values', async () => {
      await expect(controller.getMetrics('invalid')).rejects.toMatchObject({
        response: {
          code: 'INVALID_TIME_WINDOW',
        },
      });
    });

    it('rejects missing date range when window is not provided', async () => {
      await expect(controller.getMetrics()).rejects.toMatchObject({
        response: {
          code: 'MISSING_DATE_RANGE',
        },
      });
    });

    it('rejects invalid date format', async () => {
      await expect(
        controller.getMetrics(undefined, 'not-a-date', '2026-04-24T00:00:00Z'),
      ).rejects.toMatchObject({
        response: {
          code: 'INVALID_DATE_FORMAT',
        },
      });
    });

    it('rejects from date after to date', async () => {
      await expect(
        controller.getMetrics(
          undefined,
          '2026-04-24T00:00:00Z',
          '2026-04-01T00:00:00Z',
        ),
      ).rejects.toMatchObject({
        response: {
          code: 'INVALID_DATE_RANGE',
        },
      });
    });

    it('rejects invalid granularity values', async () => {
      await expect(
        controller.getMetrics(
          undefined,
          '2026-04-01T00:00:00Z',
          '2026-04-24T23:59:59Z',
          'minute',
        ),
      ).rejects.toMatchObject({
        response: {
          code: 'INVALID_GRANULARITY',
        },
      });
    });
  });
});
