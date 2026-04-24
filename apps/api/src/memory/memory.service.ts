import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { SessionMessage, MemoryContext } from './memory.types';

@Injectable()
export class MemoryService {
  private readonly defaultDepth: number;
  private readonly defaultTtlSeconds: number;
  private readonly keyPrefix = 'session';

  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {
    this.defaultDepth = this.config.get<number>('SESSION_MEMORY_DEPTH', 10);
    this.defaultTtlSeconds = this.config.get<number>('SESSION_TTL_SECONDS', 86400);
  }

  async addMessage(
    sessionId: string,
    message: Omit<SessionMessage, 'timestamp'>,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const key = this.buildKey(sessionId);
    const entry: SessionMessage = {
      ...message,
      timestamp: Date.now(),
    };

    await client.lpush(key, JSON.stringify(entry));
    await client.ltrim(key, 0, this.defaultDepth - 1);
    await client.expire(key, this.defaultTtlSeconds);
  }

  async getContext(sessionId: string): Promise<MemoryContext> {
    const client = this.redisService.getClient();
    const key = this.buildKey(sessionId);

    const entries = await client.lrange(key, 0, -1);
    const messages = entries
      .map((e) => this.safeParse(e))
      .filter((m): m is SessionMessage => m !== null)
      .reverse(); // oldest first

    return { messages };
  }

  async clearSession(sessionId: string): Promise<void> {
    const client = this.redisService.getClient();
    const key = this.buildKey(sessionId);
    await client.del(key);
  }

  async extendTtl(sessionId: string): Promise<void> {
    const client = this.redisService.getClient();
    const key = this.buildKey(sessionId);
    await client.expire(key, this.defaultTtlSeconds);
  }

  private buildKey(sessionId: string): string {
    return `${this.keyPrefix}:${sessionId}`;
  }

  private safeParse(raw: string): SessionMessage | null {
    try {
      return JSON.parse(raw) as SessionMessage;
    } catch {
      return null;
    }
  }
}
