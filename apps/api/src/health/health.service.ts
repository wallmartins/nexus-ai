import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: { status: 'up' | 'down'; latencyMs: number };
    redis: { status: 'up' | 'down'; latencyMs: number };
    pgvector: { status: 'up' | 'down'; latencyMs: number };
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthStatus> {
    const timestamp = new Date().toISOString();

    const [dbResult, redisResult, pgvectorResult] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkPgvector(),
    ]);

    const allHealthy =
      dbResult.status === 'up' &&
      redisResult.status === 'up' &&
      pgvectorResult.status === 'up';

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp,
      services: {
        database: dbResult,
        redis: redisResult,
        pgvector: pgvectorResult,
      },
    };
  }

  private async checkDatabase(): Promise<{ status: 'up' | 'down'; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start };
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down'; latencyMs: number }> {
    const start = Date.now();
    try {
      const pong = await this.redis.ping();
      return { status: pong ? 'up' : 'down', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start };
    }
  }

  private async checkPgvector(): Promise<{ status: 'up' | 'down'; latencyMs: number }> {
    const start = Date.now();
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      `;
      const hasExtension = Array.isArray(result) && result.length > 0;
      return { status: hasExtension ? 'up' : 'down', latencyMs: Date.now() - start };
    } catch {
      return { status: 'down', latencyMs: Date.now() - start };
    }
  }
}
