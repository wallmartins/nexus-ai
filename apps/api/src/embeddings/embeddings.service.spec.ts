import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingsService } from './embeddings.service';
import { PrismaService } from '../database/prisma.service';
import { QueueService } from '../queue/queue.service';
import { OllamaEmbeddingProvider } from './providers/ollama-embedding.provider';

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let prisma: PrismaService;
  let queueService: QueueService;
  let ollamaProvider: OllamaEmbeddingProvider;

  const mockQueryRaw = jest.fn();
  const mockDocumentUpdate = jest.fn();
  const mockChunkFindMany = jest.fn();
  const mockEnqueueEmbedding = jest.fn();
  const mockEmbed = jest.fn();

  beforeEach(async () => {
    mockQueryRaw.mockClear();
    mockDocumentUpdate.mockClear();
    mockChunkFindMany.mockClear();
    mockEnqueueEmbedding.mockClear();
    mockEmbed.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingsService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: mockQueryRaw,
            document: { update: mockDocumentUpdate },
            chunk: { findMany: mockChunkFindMany },
          },
        },
        {
          provide: QueueService,
          useValue: {
            enqueueEmbedding: mockEnqueueEmbedding,
          },
        },
        {
          provide: OllamaEmbeddingProvider,
          useValue: {
            providerName: 'ollama',
            dimension: 768,
            embed: mockEmbed,
          },
        },
      ],
    }).compile();

    service = module.get<EmbeddingsService>(EmbeddingsService);
    prisma = module.get<PrismaService>(PrismaService);
    queueService = module.get<QueueService>(QueueService);
    ollamaProvider = module.get<OllamaEmbeddingProvider>(OllamaEmbeddingProvider);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueEmbeddingJob', () => {
    it('updates document status to embedding and enqueues job', async () => {
      mockDocumentUpdate.mockResolvedValueOnce({ id: 'doc-1', status: 'embedding' });
      mockEnqueueEmbedding.mockResolvedValueOnce('job-123');

      const jobId = await service.enqueueEmbeddingJob('doc-1', ['chunk-1', 'chunk-2'], 'nomic-embed-text');

      expect(mockDocumentUpdate).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: 'embedding' },
      });
      expect(mockEnqueueEmbedding).toHaveBeenCalledWith({
        documentId: 'doc-1',
        chunkIds: ['chunk-1', 'chunk-2'],
        embeddingModel: 'nomic-embed-text',
      });
      expect(jobId).toBe('job-123');
    });
  });

  describe('generateAndStoreEmbeddings', () => {
    it('generates embeddings and stores them in pgvector', async () => {
      mockChunkFindMany.mockResolvedValueOnce([
        { id: 'chunk-1', content: 'Hello world' },
        { id: 'chunk-2', content: 'Second chunk' },
      ]);
      mockEmbed.mockResolvedValueOnce([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]);
      mockQueryRaw.mockResolvedValueOnce(undefined);
      mockDocumentUpdate.mockResolvedValueOnce({ id: 'doc-1', status: 'completed' });

      await service.generateAndStoreEmbeddings('doc-1', ['chunk-1', 'chunk-2'], 'nomic-embed-text');

      expect(mockChunkFindMany).toHaveBeenCalledWith({
        where: { id: { in: ['chunk-1', 'chunk-2'] } },
        select: { id: true, content: true },
      });
      expect(mockEmbed).toHaveBeenCalledWith(
        ['Hello world', 'Second chunk'],
        'nomic-embed-text',
      );
      expect(mockQueryRaw).toHaveBeenCalledTimes(2);
      expect(mockDocumentUpdate).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
        data: { status: 'completed' },
      });
    });

    it('throws when no chunks are found', async () => {
      mockChunkFindMany.mockResolvedValueOnce([]);

      await expect(
        service.generateAndStoreEmbeddings('doc-1', ['chunk-1'], 'nomic-embed-text'),
      ).rejects.toThrow('No chunks found');
    });

    it('throws when embedding count does not match chunk count', async () => {
      mockChunkFindMany.mockResolvedValueOnce([
        { id: 'chunk-1', content: 'Hello' },
        { id: 'chunk-2', content: 'World' },
      ]);
      mockEmbed.mockResolvedValueOnce([[0.1, 0.2]]); // only 1 embedding for 2 chunks

      await expect(
        service.generateAndStoreEmbeddings('doc-1', ['chunk-1', 'chunk-2'], 'nomic-embed-text'),
      ).rejects.toThrow('Embedding count mismatch');
    });
  });
});
