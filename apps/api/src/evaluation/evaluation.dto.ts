import { ApiProperty } from '@nestjs/swagger';

export class EvaluationModelConfigDto {
  @ApiProperty({ description: 'LLM provider', example: 'ollama' })
  provider!: string;

  @ApiProperty({ description: 'Model name', example: 'llama3' })
  modelName!: string;
}

export class EvaluationTriggerRequestDto {
  @ApiProperty({ type: [EvaluationModelConfigDto], description: 'Models to evaluate' })
  models!: EvaluationModelConfigDto[];
}

export class EvaluationTriggerResponseDto {
  @ApiProperty({ description: 'Run ID', example: 'run-123' })
  runId!: string;

  @ApiProperty({ description: 'Run status', example: 'pending' })
  status!: string;

  @ApiProperty({ description: 'Queue timestamp', example: '2026-04-24T12:00:00Z' })
  queuedAt!: string;
}
