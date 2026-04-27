import { Module } from '@nestjs/common';
import { IngestionWorker } from './ingestion.worker';
import { EmbeddingWorker } from './embedding.worker';
import { EvaluationWorker } from './evaluation.worker';
import { JobRecordService } from './job-record.service';
import { DocumentsModule } from '../../documents/documents.module';
import { EmbeddingsModule } from '../../embeddings/embeddings.module';
import { SettingsModule } from '../../settings/settings.module';
import { EvaluationModule } from '../../evaluation/evaluation.module';

@Module({
  imports: [DocumentsModule, EmbeddingsModule, SettingsModule, EvaluationModule],
  providers: [IngestionWorker, EmbeddingWorker, EvaluationWorker, JobRecordService],
  exports: [JobRecordService],
})
export class WorkersModule {}
