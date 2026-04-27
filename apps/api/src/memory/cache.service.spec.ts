import { Test, TestingModule } from '@nestjs/testing';
import { CacheService } from './cache.service';
import { RedisService } from '../redis/redis.service';
import { SettingsService } from '../settings/settings.service';

describe('CacheService', () => {
  let service: CacheService;
  let redisClient: { get: jest.Mock; setex: jest.Mock; del: jest.Mock };

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => redisClient,
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: jest.fn().mockReturnValue({ cacheTtlSeconds: 3600 }),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('generateKey', () => {
    it('produces deterministic keys for identical fingerprints', () => {
      const fingerprint = {
        query: 'What is the refund policy?',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: ['chunk-1', 'chunk-2'],
      };

      const key1 = service.generateKey(fingerprint);
      const key2 = service.generateKey(fingerprint);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^response-cache:/);
    });

    it('produces different keys for different queries', () => {
      const key1 = service.generateKey({
        query: 'question A',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: ['chunk-1'],
      });

      const key2 = service.generateKey({
        query: 'question B',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: ['chunk-1'],
      });

      expect(key1).not.toBe(key2);
    });

    it('produces different keys for different chunk order', () => {
      const key1 = service.generateKey({
        query: 'question',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: ['chunk-1', 'chunk-2'],
      });

      const key2 = service.generateKey({
        query: 'question',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: ['chunk-2', 'chunk-1'],
      });

      expect(key1).not.toBe(key2);
    });

    it('is case-insensitive for query text', () => {
      const key1 = service.generateKey({
        query: 'Hello World',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: [],
      });

      const key2 = service.generateKey({
        query: 'hello world',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: [],
      });

      expect(key1).toBe(key2);
    });
  });

  describe('set and get', () => {
    it('stores and retrieves a cached response', async () => {
      const fingerprint = {
        query: 'What is the policy?',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: ['chunk-1'],
      };

      const response = {
        content: 'The policy allows refunds within 30 days.',
        sources: [
          {
            chunkId: 'chunk-1',
            documentId: 'doc-1',
            preview: 'Refunds within 30 days',
            score: 0.95,
          },
        ],
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 10, output: 8 },
        latencyMs: 1200,
      };

      await service.set(fingerprint, response);

      const storedRaw = JSON.stringify(response);
      expect(redisClient.setex).toHaveBeenCalledTimes(1);
      const [, ttl, payload] = redisClient.setex.mock.calls[0];
      expect(ttl).toBe(3600);
      expect(payload).toBe(storedRaw);

      redisClient.get.mockResolvedValueOnce(storedRaw);
      const result = await service.get(fingerprint);

      expect(result).not.toBeNull();
      expect(result?.content).toBe(response.content);
      expect(result?.cached).toBe(true);
      expect(result?.sources).toEqual(response.sources);
    });

    it('returns null on cache miss', async () => {
      redisClient.get.mockResolvedValueOnce(null);

      const result = await service.get({
        query: 'unknown question',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: [],
      });

      expect(result).toBeNull();
    });

    it('returns null and deletes corrupted cache entry', async () => {
      redisClient.get.mockResolvedValueOnce('not-valid-json');

      const result = await service.get({
        query: 'question',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: [],
      });

      expect(result).toBeNull();
      expect(redisClient.del).toHaveBeenCalledTimes(1);
    });

    it('returns null and deletes entry missing required fields', async () => {
      redisClient.get.mockResolvedValueOnce(JSON.stringify({ foo: 'bar' }));

      const result = await service.get({
        query: 'question',
        provider: 'ollama',
        model: 'llama3',
        chunkIds: [],
      });

      expect(result).toBeNull();
      expect(redisClient.del).toHaveBeenCalledTimes(1);
    });

    it('uses configured TTL from settings', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: RedisService,
            useValue: {
              getClient: () => redisClient,
            },
          },
          {
            provide: SettingsService,
            useValue: {
              getSettings: jest.fn().mockReturnValue({ cacheTtlSeconds: 1800 }),
            },
          },
        ],
      }).compile();

      const customService = module.get<CacheService>(CacheService);

      await customService.set(
        {
          query: 'q',
          provider: 'p',
          model: 'm',
          chunkIds: [],
        },
        {
          content: 'answer',
          sources: [],
          model: 'm',
          provider: 'p',
          tokens: { input: 1, output: 1 },
          latencyMs: 100,
        },
      );

      const [, ttl] = redisClient.setex.mock.calls[0];
      expect(ttl).toBe(1800);
    });
  });

  describe('invalidate', () => {
    it('deletes cached entry from Redis', async () => {
      const fingerprint = {
        query: 'q',
        provider: 'p',
        model: 'm',
        chunkIds: ['c1'],
      };

      await service.invalidate(fingerprint);

      expect(redisClient.del).toHaveBeenCalledTimes(1);
    });
  });
});
