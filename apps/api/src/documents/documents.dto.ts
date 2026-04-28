import { ApiProperty } from '@nestjs/swagger';

export class DocumentUploadResponseDto {
  @ApiProperty({ description: 'Document ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Original file name', example: 'report.pdf' })
  originalName!: string;

  @ApiProperty({ description: 'MIME type', example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 102400 })
  sizeBytes!: number;

  @ApiProperty({ description: 'Ingestion status', example: 'pending' })
  status!: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-04-24T12:00:00Z' })
  createdAt!: Date;
}

export class DocumentListItemDto {
  @ApiProperty({ description: 'Document ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ description: 'Original file name', example: 'report.pdf' })
  originalName!: string;

  @ApiProperty({ description: 'Ingestion status', example: 'completed' })
  status!: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2026-04-24T12:00:00Z' })
  createdAt!: Date;
}
