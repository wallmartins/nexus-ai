import { Module } from '@nestjs/common';
import { IngestionWorker } from './ingestion.worker';
import { EmbeddingWorker } from './embedding.worker';
import { JobRecordService } from './job-record.service';
import { DocumentsModule } from '../../documents/documents.module';
import { EmbeddingsModule } from '../../embeddings/embeddings.module';
import { SettingsModule } from '../../settings/settings.module';

@Module({
  imports: [DocumentsModule, EmbeddingsModule, SettingsModule],
  providers: [IngestionWorker, EmbeddingWorker, JobRecordService],
})
export class WorkersModule {}
