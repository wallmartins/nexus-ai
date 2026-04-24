import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentParserService } from './parsers/document-parser.service';
import { ChunkingService } from './chunking/chunking.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentParserService, ChunkingService],
  exports: [DocumentsService, DocumentParserService, ChunkingService],
})
export class DocumentsModule {}
