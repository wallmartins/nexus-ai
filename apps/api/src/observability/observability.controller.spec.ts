import { Test, TestingModule } from '@nestjs/testing';
import { ObservabilityController } from './observability.controller';
import { LogPersistenceService } from './log-persistence.service';

describe('ObservabilityController', () => {
  let controller: ObservabilityController;

  const mockQueryLogs = jest.fn();

  beforeEach(async () => {
    mockQueryLogs.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObservabilityController],
      providers: [
        {
          provide: LogPersistenceService,
          useValue: {
            queryLogs: mockQueryLogs,
          },
        },
      ],
    }).compile();

    controller = module.get<ObservabilityController>(ObservabilityController);
  });

  it('instantiates', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/observability/logs', () => {
    it('returns logs with default pagination', async () => {
      const result = {
        entries: [{ id: 'log-1' }],
        total: 1,
        limit: 50,
        offset: 0,
      };
      mockQueryLogs.mockResolvedValueOnce(result);

      const response = await controller.getLogs();

      expect(mockQueryLogs).toHaveBeenCalledWith({
        correlationId: undefined,
        level: undefined,
        eventType: undefined,
        limit: 50,
        offset: 0,
      });
      expect(response).toEqual(result);
    });

    it('parses query filters correctly', async () => {
      mockQueryLogs.mockResolvedValueOnce({ entries: [], total: 0, limit: 10, offset: 5 });

      await controller.getLogs(
        'corr-123',
        '2026-04-01T00:00:00Z',
        '2026-04-24T23:59:59Z',
        undefined,
        undefined,
        'error',
        'llm.request',
        '10',
        '5',
      );

      expect(mockQueryLogs).toHaveBeenCalledWith({
        correlationId: 'corr-123',
        start: new Date('2026-04-01T00:00:00Z'),
        end: new Date('2026-04-24T23:59:59Z'),
        level: 'error',
        eventType: 'llm.request',
        limit: 10,
        offset: 5,
      });
    });

    it('accepts from and to as aliases for start and end', async () => {
      mockQueryLogs.mockResolvedValueOnce({ entries: [], total: 0, limit: 50, offset: 0 });

      await controller.getLogs(
        undefined,
        undefined,
        undefined,
        '2026-04-01T00:00:00Z',
        '2026-04-24T23:59:59Z',
      );

      expect(mockQueryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          start: new Date('2026-04-01T00:00:00Z'),
          end: new Date('2026-04-24T23:59:59Z'),
        }),
      );
    });

    it('prefers from/to over start/end when both are provided', async () => {
      mockQueryLogs.mockResolvedValueOnce({ entries: [], total: 0, limit: 50, offset: 0 });

      await controller.getLogs(
        undefined,
        '2026-03-01T00:00:00Z',
        '2026-03-31T23:59:59Z',
        '2026-04-01T00:00:00Z',
        '2026-04-24T23:59:59Z',
      );

      expect(mockQueryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          start: new Date('2026-04-01T00:00:00Z'),
          end: new Date('2026-04-24T23:59:59Z'),
        }),
      );
    });

    it('handles invalid date strings gracefully', async () => {
      mockQueryLogs.mockResolvedValueOnce({ entries: [], total: 0, limit: 50, offset: 0 });

      await controller.getLogs(undefined, 'invalid-date');

      const call = mockQueryLogs.mock.calls[0][0];
      expect(call.start).toBeInstanceOf(Date);
      expect(isNaN(call.start.getTime())).toBe(true);
    });
  });
});
