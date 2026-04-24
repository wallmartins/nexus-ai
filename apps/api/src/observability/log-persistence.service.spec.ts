import { Test, TestingModule } from '@nestjs/testing';
import { LogPersistenceService } from './log-persistence.service';
import { PrismaService } from '../database/prisma.service';

describe('LogPersistenceService', () => {
  let service: LogPersistenceService;

  const mockLogEntryCreate = jest.fn();
  const mockLogEntryFindMany = jest.fn();
  const mockLogEntryCount = jest.fn();

  beforeEach(async () => {
    mockLogEntryCreate.mockClear();
    mockLogEntryFindMany.mockClear();
    mockLogEntryCount.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogPersistenceService,
        {
          provide: PrismaService,
          useValue: {
            logEntry: {
              create: mockLogEntryCreate,
              findMany: mockLogEntryFindMany,
              count: mockLogEntryCount,
            },
          },
        },
      ],
    }).compile();

    service = module.get<LogPersistenceService>(LogPersistenceService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('writeLog', () => {
    it('creates a log entry with all fields', async () => {
      mockLogEntryCreate.mockResolvedValueOnce({ id: 'log-1' });

      await service.writeLog({
        correlationId: 'corr-123',
        level: 'info',
        service: 'retrieval',
        eventType: 'retrieval.complete',
        payload: { chunks: 5, latencyMs: 120 },
      });

      expect(mockLogEntryCreate).toHaveBeenCalledWith({
        data: {
          correlationId: 'corr-123',
          level: 'info',
          service: 'retrieval',
          eventType: 'retrieval.complete',
          payload: { chunks: 5, latencyMs: 120 },
        },
      });
    });
  });

  describe('queryLogs', () => {
    it('returns paginated logs ordered by timestamp desc', async () => {
      const logs = [
        { id: 'log-2', correlationId: 'corr-456', level: 'error' },
        { id: 'log-1', correlationId: 'corr-123', level: 'info' },
      ];
      mockLogEntryFindMany.mockResolvedValueOnce(logs);
      mockLogEntryCount.mockResolvedValueOnce(2);

      const result = await service.queryLogs({ limit: 10, offset: 0 });

      expect(mockLogEntryFindMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { timestamp: 'desc' },
        take: 10,
        skip: 0,
      });
      expect(result.data).toEqual(logs);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('filters by correlationId', async () => {
      mockLogEntryFindMany.mockResolvedValueOnce([]);
      mockLogEntryCount.mockResolvedValueOnce(0);

      await service.queryLogs({ correlationId: 'corr-123' });

      expect(mockLogEntryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { correlationId: 'corr-123' },
        }),
      );
    });

    it('filters by time range', async () => {
      mockLogEntryFindMany.mockResolvedValueOnce([]);
      mockLogEntryCount.mockResolvedValueOnce(0);

      const start = new Date('2026-04-01T00:00:00Z');
      const end = new Date('2026-04-24T23:59:59Z');

      await service.queryLogs({ start, end });

      expect(mockLogEntryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            timestamp: {
              gte: start,
              lte: end,
            },
          },
        }),
      );
    });

    it('filters by level and eventType', async () => {
      mockLogEntryFindMany.mockResolvedValueOnce([]);
      mockLogEntryCount.mockResolvedValueOnce(0);

      await service.queryLogs({ level: 'error', eventType: 'llm.request' });

      expect(mockLogEntryFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            level: 'error',
            eventType: 'llm.request',
          },
        }),
      );
    });
  });
});
