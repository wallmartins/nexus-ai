import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsRequestDto {
  @ApiPropertyOptional({ description: 'Active LLM provider', enum: ['ollama', 'openai', 'anthropic'], example: 'ollama' })
  llmProvider?: 'ollama' | 'openai' | 'anthropic';

  @ApiPropertyOptional({ description: 'Active LLM model', example: 'llama3' })
  llmModel?: string;

  @ApiPropertyOptional({ description: 'Active embedding model', example: 'nomic-embed-text' })
  embeddingModel?: string;

  @ApiPropertyOptional({ description: 'Chunk size for text splitting', minimum: 100, maximum: 4000, example: 500 })
  chunkSize?: number;

  @ApiPropertyOptional({ description: 'Chunk overlap for text splitting', minimum: 0, maximum: 1000, example: 50 })
  chunkOverlap?: number;

  @ApiPropertyOptional({ description: 'Top-K retrieval count', minimum: 1, maximum: 20, example: 5 })
  retrievalTopK?: number;

  @ApiPropertyOptional({ description: 'Enable MMR diversification', example: false })
  useMMR?: boolean;

  @ApiPropertyOptional({ description: 'Session memory depth (messages)', minimum: 1, maximum: 50, example: 10 })
  sessionMemoryDepth?: number;

  @ApiPropertyOptional({ description: 'Cache TTL in seconds', minimum: 60, maximum: 86400, example: 3600 })
  cacheTtlSeconds?: number;

  @ApiPropertyOptional({ description: 'Maximum input length', minimum: 100, maximum: 10000, example: 4000 })
  maxInputLength?: number;
}

export class SettingsResponseDto {
  @ApiProperty({ description: 'Active LLM provider', example: 'ollama' })
  llmProvider!: 'ollama' | 'openai' | 'anthropic';

  @ApiProperty({ description: 'Active LLM model', example: 'llama3' })
  llmModel!: string;

  @ApiProperty({ description: 'Active embedding model', example: 'nomic-embed-text' })
  embeddingModel!: string;

  @ApiProperty({ description: 'Chunk size', example: 500 })
  chunkSize!: number;

  @ApiProperty({ description: 'Chunk overlap', example: 50 })
  chunkOverlap!: number;

  @ApiProperty({ description: 'Top-K retrieval count', example: 5 })
  retrievalTopK!: number;

  @ApiProperty({ description: 'MMR enabled', example: false })
  useMMR!: boolean;

  @ApiProperty({ description: 'Session memory depth', example: 10 })
  sessionMemoryDepth!: number;

  @ApiProperty({ description: 'Cache TTL seconds', example: 3600 })
  cacheTtlSeconds!: number;

  @ApiProperty({ description: 'Max input length', example: 4000 })
  maxInputLength!: number;
}
