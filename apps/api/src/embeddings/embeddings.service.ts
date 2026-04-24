import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QueueService } from '../queue/queue.service';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.provider';
import { EmbeddingProvider } from './interfaces/embedding-provider.interface';

const EMBEDDING_MODEL_REGISTRY: Record<string, string> = {
  'nomic-embed-text': 'ollama',
  'text-embedding-3-small': 'openai',
  'text-embedding-3-large': 'openai',
};

@Injectable()
export class EmbeddingsService {
  private readonly providers: Map<string, EmbeddingProvider> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly ollamaProvider: OllamaEmbeddingProvider,
  ) {
    this.providers.set(ollamaProvider.providerName, ollamaProvider);
  }

  async enqueueEmbeddingJob(
    documentId: string,
    chunkIds: string[],
    embeddingModel: string,
  ): Promise<string> {
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'embedding' },
    });

    return this.queueService.enqueueEmbedding({
      documentId,
      chunkIds,
      embeddingModel,
    });
  }

  async generateAndStoreEmbeddings(
    documentId: string,
    chunkIds: string[],
    modelName: string,
  ): Promise<void> {
    const provider = this.resolveProvider(modelName);

    const chunks = await this.prisma.chunk.findMany({
      where: { id: { in: chunkIds } },
      select: { id: true, content: true },
    });

    if (chunks.length === 0) {
      throw new Error(`No chunks found for IDs: ${chunkIds.join(', ')}`);
    }

    const texts = chunks.map((c) => c.content);
    const embeddings = await provider.embed(texts, modelName);

    if (embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: expected ${chunks.length}, got ${embeddings.length}`,
      );
    }

    for (let i = 0; i < chunks.length; i++) {
      await this.insertVector(chunks[i].id, embeddings[i], modelName);
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'completed' },
    });
  }

  private resolveProvider(modelName: string): EmbeddingProvider {
    const providerName = EMBEDDING_MODEL_REGISTRY[modelName] ?? 'ollama';
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(
        `No embedding provider available for model: ${modelName} (provider: ${providerName})`,
      );
    }
    return provider;
  }

  private async insertVector(
    chunkId: string,
    vector: number[],
    modelName: string,
  ): Promise<void> {
    const vectorLiteral = `[${vector.join(',')}]`;
    await this.prisma.$queryRaw`
      INSERT INTO embeddings (id, "chunkId", vector, "modelName")
      VALUES (gen_random_uuid(), ${chunkId}, ${vectorLiteral}::vector(768), ${modelName})
      ON CONFLICT ("chunkId") DO UPDATE SET vector = ${vectorLiteral}::vector(768), "modelName" = ${modelName}
    `;
  }
}
