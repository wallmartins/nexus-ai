import { Test, TestingModule } from '@nestjs/testing';
import { HealthService, HealthStatus } from './health.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthService', () => {
  let service: HealthService;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockQueryRaw = jest.fn();
  const mockPing = jest.fn();

  beforeEach(async () => {
    mockQueryRaw.mockClear();
    mockPing.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: mockQueryRaw,
          },
        },
        {
          provide: RedisService,
          useValue: {
            ping: mockPing,
          },
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('returns healthy when all services are up', async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ '?column?': 1 }])
        .mockResolvedValueOnce([{ '?column?': 1 }])
        .mockResolvedValueOnce([{ '?column?': 1 }]);
      mockPing.mockResolvedValueOnce(true);

      const result = await service.check();

      expect(result.status).toBe('healthy');
      expect(result.services.database.status).toBe('up');
      expect(result.services.redis.status).toBe('up');
      expect(result.services.pgvector.status).toBe('up');
      expect(result.services.hnswIndex.status).toBe('up');
    });

    it('returns unhealthy when database is down', async () => {
      mockQueryRaw
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValueOnce([{ '?column?': 1 }])
        .mockResolvedValueOnce([{ '?column?': 1 }]);
      mockPing.mockResolvedValueOnce(true);

      const result = await service.check();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('down');
    });

    it('returns unhealthy when HNSW index is missing', async () => {
      mockQueryRaw
        .mockResolvedValueOnce([{ '?column?': 1 }])
        .mockResolvedValueOnce([{ '?column?': 1 }])
        .mockResolvedValueOnce([]);
      mockPing.mockResolvedValueOnce(true);

      const result = await service.check();

      expect(result.status).toBe('unhealthy');
      expect(result.services.hnswIndex.status).toBe('down');
    });
  });
});
