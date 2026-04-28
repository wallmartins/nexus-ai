import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogEntryDto {
  @ApiProperty({ description: 'Log entry ID', example: 'log-123' })
  id!: string;

  @ApiProperty({ description: 'Correlation ID', example: 'corr-456' })
  correlationId!: string;

  @ApiProperty({ description: 'Log level', example: 'info' })
  level!: string;

  @ApiProperty({ description: 'Service name', example: 'ChatService' })
  service!: string;

  @ApiProperty({ description: 'Event type', example: 'llm.request' })
  eventType!: string;

  @ApiProperty({ description: 'Structured payload', example: {} })
  payload!: unknown;

  @ApiProperty({ description: 'Timestamp', example: '2026-04-24T12:00:00Z' })
  timestamp!: Date;
}

export class LogQueryResultDto {
  @ApiProperty({ type: [LogEntryDto], description: 'Log entries' })
  data!: LogEntryDto[];

  @ApiProperty({ description: 'Total matching entries', example: 100 })
  total!: number;
}

export class MetricsResponseDto {
  @ApiProperty({ description: 'Total requests', example: 150 })
  totalRequests!: number;

  @ApiProperty({ description: 'Average latency in ms', example: 1200 })
  avgLatencyMs!: number;

  @ApiProperty({ description: 'P95 latency in ms', example: 3200 })
  p95LatencyMs!: number;

  @ApiProperty({ description: 'Total input tokens', example: 45000 })
  totalTokensIn!: number;

  @ApiProperty({ description: 'Total output tokens', example: 12000 })
  totalTokensOut!: number;

  @ApiProperty({ description: 'Error rate (0-1)', example: 0.02 })
  errorRate!: number;
}
