import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RedisService } from '../redis/redis.service';
import { SettingsService } from '../settings/settings.service';
import { CachedResponse, CacheFingerprint } from './cache.types';

const CACHE_KEY_PREFIX = 'response-cache';
const DEFAULT_TTL_SECONDS = 3600;

@Injectable()
export class CacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly settingsService: SettingsService,
  ) {}

  async get(
    fingerprint: CacheFingerprint,
  ): Promise<CachedResponse | null> {
    const client = this.redisService.getClient();
    const key = this.buildKey(fingerprint);

    const raw = await client.get(key);
    if (!raw) return null;

    const parsed = this.safeParse(raw);
    if (!parsed) {
      await client.del(key);
      return null;
    }

    return { ...parsed, cached: true };
  }

  async set(
    fingerprint: CacheFingerprint,
    response: Omit<CachedResponse, 'cached'>,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const key = this.buildKey(fingerprint);
    const ttl = this.resolveTtl();

    const payload = JSON.stringify(response);
    await client.setex(key, ttl, payload);
  }

  async invalidate(
    fingerprint: CacheFingerprint,
  ): Promise<void> {
    const client = this.redisService.getClient();
    const key = this.buildKey(fingerprint);
    await client.del(key);
  }

  generateKey(fingerprint: CacheFingerprint): string {
    return this.buildKey(fingerprint);
  }

  private buildKey(fingerprint: CacheFingerprint): string {
    const hashInput = [
      fingerprint.query.trim().toLowerCase(),
      fingerprint.provider,
      fingerprint.model,
      ...fingerprint.chunkIds,
    ].join('|');

    const hash = createHash('sha256').update(hashInput).digest('hex');
    return `${CACHE_KEY_PREFIX}:${hash}`;
  }

  private resolveTtl(): number {
    const settings = this.settingsService.getSettings();
    return settings.cacheTtlSeconds ?? DEFAULT_TTL_SECONDS;
  }

  private safeParse(raw: string): Omit<CachedResponse, 'cached'> | null {
    try {
      const parsed = JSON.parse(raw) as Omit<CachedResponse, 'cached'>;
      if (typeof parsed.content !== 'string') return null;
      if (typeof parsed.model !== 'string') return null;
      if (typeof parsed.provider !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }
}
