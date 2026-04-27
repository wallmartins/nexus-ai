import { Module } from '@nestjs/common';
import { RetrievalService } from './retrieval.service';
import { EmbeddingsModule } from '../embeddings/embeddings.module';
import { SettingsModule } from '../settings/settings.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule, EmbeddingsModule, SettingsModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RagModule {}
