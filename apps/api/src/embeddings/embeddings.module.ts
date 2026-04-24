import { Module } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.provider';

@Module({
  providers: [EmbeddingsService, OllamaEmbeddingProvider],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
