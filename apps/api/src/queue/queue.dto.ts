import { ApiProperty } from '@nestjs/swagger';

export class QueueOverviewDto {
  @ApiProperty({ description: 'Queue name', example: 'ingestion' })
  name!: string;

  @ApiProperty({ description: 'Waiting jobs count', example: 2 })
  waiting!: number;

  @ApiProperty({ description: 'Active jobs count', example: 1 })
  active!: number;

  @ApiProperty({ description: 'Completed jobs count', example: 42 })
  completed!: number;

  @ApiProperty({ description: 'Failed jobs count', example: 0 })
  failed!: number;
}

export class JobInfoDto {
  @ApiProperty({ description: 'Job ID', example: 'job-123' })
  id!: string;

  @ApiProperty({ description: 'Queue name', example: 'embedding' })
  queueName!: string;

  @ApiProperty({ description: 'Job status', example: 'completed' })
  status!: string;

  @ApiProperty({ description: 'Job payload summary', example: { documentId: 'doc-1' } })
  payload!: unknown;

  @ApiProperty({ description: 'Number of attempts', example: 1 })
  attempts!: number;

  @ApiProperty({ description: 'Failure reason if failed', example: null, nullable: true })
  failedReason!: string | null;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-04-24T12:00:00Z' })
  createdAt!: Date;

  @ApiProperty({ description: 'Last update timestamp', example: '2026-04-24T12:01:00Z' })
  updatedAt!: Date;
}
