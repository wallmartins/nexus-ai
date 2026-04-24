import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemoryService } from './memory.service';
import { RedisService } from '../redis/redis.service';

describe('MemoryService', () => {
  let service: MemoryService;

  const mockLpush = jest.fn();
  const mockLtrim = jest.fn();
  const mockLrange = jest.fn();
  const mockDel = jest.fn();
  const mockExpire = jest.fn();

  const mockRedisClient = {
    lpush: mockLpush,
    ltrim: mockLtrim,
    lrange: mockLrange,
    del: mockDel,
    expire: mockExpire,
  };

  beforeEach(async () => {
    mockLpush.mockClear();
    mockLtrim.mockClear();
    mockLrange.mockClear();
    mockDel.mockClear();
    mockExpire.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue: unknown) => {
              const defaults: Record<string, unknown> = {
                SESSION_MEMORY_DEPTH: 10,
                SESSION_TTL_SECONDS: 86400,
              };
              return defaults[key] ?? defaultValue;
            },
          },
        },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('addMessage', () => {
    it('stores message in Redis list with timestamp', async () => {
      mockLpush.mockResolvedValueOnce(1);
      mockLtrim.mockResolvedValueOnce('OK');
      mockExpire.mockResolvedValueOnce(1);

      await service.addMessage('session-1', {
        role: 'user',
        content: 'Hello',
      });

      expect(mockLpush).toHaveBeenCalledTimes(1);
      const [key, value] = mockLpush.mock.calls[0];
      expect(key).toBe('session:session-1');
      const parsed = JSON.parse(value);
      expect(parsed.role).toBe('user');
      expect(parsed.content).toBe('Hello');
      expect(typeof parsed.timestamp).toBe('number');
    });

    it('trims list to configured depth', async () => {
      mockLpush.mockResolvedValueOnce(1);
      mockLtrim.mockResolvedValueOnce('OK');
      mockExpire.mockResolvedValueOnce(1);

      await service.addMessage('session-1', { role: 'user', content: 'Hello' });

      expect(mockLtrim).toHaveBeenCalledWith('session:session-1', 0, 9);
    });

    it('sets expiration on session key', async () => {
      mockLpush.mockResolvedValueOnce(1);
      mockLtrim.mockResolvedValueOnce('OK');
      mockExpire.mockResolvedValueOnce(1);

      await service.addMessage('session-1', { role: 'user', content: 'Hello' });

      expect(mockExpire).toHaveBeenCalledWith('session:session-1', 86400);
    });
  });

  describe('getContext', () => {
    it('returns messages in chronological order', async () => {
      const entries = [
        JSON.stringify({ role: 'assistant', content: 'Hi', timestamp: 2000 }),
        JSON.stringify({ role: 'user', content: 'Hello', timestamp: 1000 }),
      ];
      mockLrange.mockResolvedValueOnce(entries);

      const context = await service.getContext('session-1');

      expect(mockLrange).toHaveBeenCalledWith('session:session-1', 0, -1);
      expect(context.messages).toHaveLength(2);
      expect(context.messages[0].content).toBe('Hello');
      expect(context.messages[1].content).toBe('Hi');
    });

    it('skips invalid JSON entries', async () => {
      mockLrange.mockResolvedValueOnce([
        JSON.stringify({ role: 'user', content: 'Valid', timestamp: 1000 }),
        'not-json',
        JSON.stringify({ role: 'assistant', content: 'Also valid', timestamp: 2000 }),
      ]);

      const context = await service.getContext('session-1');

      expect(context.messages).toHaveLength(2);
      expect(context.messages[0].content).toBe('Also valid');
      expect(context.messages[1].content).toBe('Valid');
    });

    it('returns empty array when no messages exist', async () => {
      mockLrange.mockResolvedValueOnce([]);

      const context = await service.getContext('session-1');

      expect(context.messages).toEqual([]);
    });
  });

  describe('clearSession', () => {
    it('deletes session key from Redis', async () => {
      mockDel.mockResolvedValueOnce(1);

      await service.clearSession('session-1');

      expect(mockDel).toHaveBeenCalledWith('session:session-1');
    });
  });

  describe('extendTtl', () => {
    it('refreshes expiration on session key', async () => {
      mockExpire.mockResolvedValueOnce(1);

      await service.extendTtl('session-1');

      expect(mockExpire).toHaveBeenCalledWith('session:session-1', 86400);
    });
  });
});
