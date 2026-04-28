import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageOptionsDto {
  @ApiPropertyOptional({ description: 'Whether to use response cache', example: true })
  useCache?: boolean;

  @ApiPropertyOptional({ description: 'LLM provider to use', example: 'ollama' })
  provider?: string;

  @ApiPropertyOptional({ description: 'Model name to use', example: 'llama3' })
  model?: string;
}

export class ChatMessageRequestDto {
  @ApiPropertyOptional({ description: 'Session ID for multi-turn conversations', example: '550e8400-e29b-41d4-a716-446655440000' })
  sessionId?: string;

  @ApiProperty({ description: 'User message text', example: 'What is the refund policy?' })
  message!: string;

  @ApiPropertyOptional({ type: ChatMessageOptionsDto })
  options?: ChatMessageOptionsDto;
}

export class ChatMessageSourceDto {
  @ApiProperty({ description: 'Chunk ID', example: 'chunk-123' })
  chunkId!: string;

  @ApiProperty({ description: 'Document ID', example: 'doc-456' })
  documentId!: string;

  @ApiProperty({ description: 'Preview text of the chunk', example: 'Refund policy allows returns within 30 days...' })
  preview!: string;

  @ApiProperty({ description: 'Similarity score', example: 0.91 })
  score!: number;
}

export class ChatMessageResponseDto {
  @ApiProperty({ description: 'Session ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  sessionId!: string;

  @ApiProperty({ description: 'Message ID', example: 'msg-789' })
  messageId!: string;

  @ApiProperty({ description: 'Message role', example: 'assistant' })
  role!: 'assistant';

  @ApiProperty({ description: 'Assistant response content', example: 'You can request a refund within 30 days.' })
  content!: string;

  @ApiProperty({ type: [ChatMessageSourceDto], description: 'Retrieved source chunks' })
  sources!: ChatMessageSourceDto[];

  @ApiProperty({ description: 'Total latency in milliseconds', example: 1450 })
  latencyMs!: number;

  @ApiProperty({ description: 'Token usage', example: { input: 420, output: 110 } })
  tokens!: { input: number; output: number };

  @ApiProperty({ description: 'Correlation ID for tracing', example: 'abc-123' })
  correlationId!: string;
}
