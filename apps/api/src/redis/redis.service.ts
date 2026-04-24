import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('REDIS_URL');
    const maxRetries = this.config.get<number>('REDIS_MAX_RETRIES', 5);
    const retryDelayMs = this.config.get<number>('REDIS_RETRY_DELAY_MS', 100);

    this.client = new Redis(url, {
      maxRetriesPerRequest: maxRetries,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * retryDelayMs, 3000);
        this.logger.warn(`Redis reconnecting... attempt ${times}, delay ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        this.logger.error(`Redis error: ${err.message}`);
        return true;
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });

    this.client.on('ready', () => {
      this.logger.log('Redis client ready');
    });

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis connection error: ${err.message}`);
    });

    this.client.on('reconnecting', () => {
      this.logger.warn('Redis client reconnecting...');
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
    this.logger.log('Redis client disconnected');
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  getClient(): Redis {
    return this.client;
  }
}
