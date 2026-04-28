import { ApiProperty } from '@nestjs/swagger';

export class ServiceHealthDto {
  @ApiProperty({ description: 'Service status', enum: ['up', 'down'], example: 'up' })
  status!: 'up' | 'down';

  @ApiProperty({ description: 'Check latency in milliseconds', example: 12 })
  latencyMs!: number;
}

export class HealthStatusDto {
  @ApiProperty({ description: 'Overall health status', enum: ['healthy', 'unhealthy'], example: 'healthy' })
  status!: 'healthy' | 'unhealthy';

  @ApiProperty({ description: 'Check timestamp', example: '2026-04-24T12:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ type: () => ({
    database: { status: 'up', latencyMs: 5 },
    redis: { status: 'up', latencyMs: 3 },
    pgvector: { status: 'up', latencyMs: 4 },
    hnswIndex: { status: 'up', latencyMs: 2 },
  }) })
  services!: {
    database: ServiceHealthDto;
    redis: ServiceHealthDto;
    pgvector: ServiceHealthDto;
    hnswIndex: ServiceHealthDto;
  };
}
