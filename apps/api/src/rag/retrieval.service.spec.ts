import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalService } from './retrieval.service';
import { PrismaService } from '../database/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SettingsService } from '../settings/settings.service';

describe('RetrievalService', () => {
  let service: RetrievalService;
  let prisma: PrismaService;
  let embeddingsService: EmbeddingsService;
  let settingsService: SettingsService;

  const mockQueryRaw = jest.fn();
  const mockEmbedQuery = jest.fn();
  const mockGetSettings = jest.fn();

  beforeEach(async () => {
    mockQueryRaw.mockClear();
    mockEmbedQuery.mockClear();
    mockGetSettings.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: mockQueryRaw,
          },
        },
        {
          provide: EmbeddingsService,
          useValue: {
            embedQuery: mockEmbedQuery,
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: mockGetSettings,
          },
        },
      ],
    }).compile();

    service = module.get<RetrievalService>(RetrievalService);
    prisma = module.get<PrismaService>(PrismaService);
    embeddingsService = module.get<EmbeddingsService>(EmbeddingsService);
    settingsService = module.get<SettingsService>(SettingsService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('retrieve (top-k)', () => {
    it('returns chunks ordered by similarity score', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 3,
        useMMR: false,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValueOnce([
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'First chunk',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.1,0.2,0.3]',
          score: 0.95,
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          content: 'Second chunk',
          index: 1,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.4,0.5,0.6]',
          score: 0.85,
        },
        {
          id: 'chunk-3',
          documentId: 'doc-2',
          content: 'Third chunk',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.7,0.8,0.9]',
          score: 0.75,
        },
      ]);

      const result = await service.retrieve({ query: 'test query' });

      expect(mockEmbedQuery).toHaveBeenCalledWith('test query', 'nomic-embed-text');
      expect(result).toHaveLength(3);
      expect(result[0].chunkId).toBe('chunk-1');
      expect(result[0].score).toBe(0.95);
      expect(result[1].chunkId).toBe('chunk-2');
      expect(result[2].chunkId).toBe('chunk-3');
    });

    it('respects topK option override', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 5,
        useMMR: false,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValueOnce([
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'A',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.1,0.0,0.0]',
          score: 0.9,
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          content: 'B',
          index: 1,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.2,0.0,0.0]',
          score: 0.8,
        },
      ]);

      const result = await service.retrieve({ query: 'test', topK: 2 });

      expect(mockQueryRaw).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('returns empty array when no embeddings match', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 5,
        useMMR: false,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValueOnce([]);

      const result = await service.retrieve({ query: 'test' });

      expect(result).toEqual([]);
    });
  });

  describe('retrieve (MMR)', () => {
    it('diversifies results with MMR enabled', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 2,
        useMMR: true,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([1, 0, 0]);

      // Four candidates: chunk-1 and chunk-2 are very similar (both near [1,0,0])
      // chunk-3 is different ([0,1,0]), chunk-4 is different ([0,0,1])
      mockQueryRaw.mockResolvedValueOnce([
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'Alpha',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.99,0.01,0.0]',
          score: 0.99,
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          content: 'Beta',
          index: 1,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.98,0.02,0.0]',
          score: 0.98,
        },
        {
          id: 'chunk-3',
          documentId: 'doc-2',
          content: 'Gamma',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.0,1.0,0.0]',
          score: 0.7,
        },
        {
          id: 'chunk-4',
          documentId: 'doc-2',
          content: 'Delta',
          index: 1,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.0,0.0,1.0]',
          score: 0.6,
        },
      ]);

      const result = await service.retrieve({ query: 'test' });

      // With MMR and lambda=0.5, the first pick is chunk-1 (highest query sim).
      // The second pick should be chunk-3 or chunk-4 because chunk-2 is too similar to chunk-1.
      expect(result).toHaveLength(2);
      expect(result[0].chunkId).toBe('chunk-1');
      expect(result[1].chunkId).not.toBe('chunk-2');
    });

    it('uses mmrLambda option override', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 2,
        useMMR: true,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([1, 0, 0]);
      mockQueryRaw.mockResolvedValueOnce([
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'Alpha',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[1.0,0.0,0.0]',
          score: 0.95,
        },
        {
          id: 'chunk-2',
          documentId: 'doc-1',
          content: 'Beta',
          index: 1,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.9,0.1,0.0]',
          score: 0.94,
        },
        {
          id: 'chunk-3',
          documentId: 'doc-2',
          content: 'Gamma',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.0,1.0,0.0]',
          score: 0.5,
        },
        {
          id: 'chunk-4',
          documentId: 'doc-2',
          content: 'Delta',
          index: 1,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.0,0.0,1.0]',
          score: 0.4,
        },
      ]);

      // With lambda=1.0, MMR should prioritize query similarity only (no diversity)
      const result = await service.retrieve({ query: 'test', mmrLambda: 1.0 });

      expect(result).toHaveLength(2);
      expect(result[0].chunkId).toBe('chunk-1');
      expect(result[1].chunkId).toBe('chunk-2');
    });

    it('limits fetchK when candidates are fewer than requested', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 10,
        useMMR: true,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValueOnce([
        {
          id: 'chunk-1',
          documentId: 'doc-1',
          content: 'Only chunk',
          index: 0,
          metadata: {},
          modelName: 'nomic-embed-text',
          vector_text: '[0.1,0.2,0.3]',
          score: 0.9,
        },
      ]);

      const result = await service.retrieve({ query: 'test' });

      expect(result).toHaveLength(1);
    });
  });

  describe('retrieve (settings overrides)', () => {
    it('uses options over settings for all parameters', async () => {
      mockGetSettings.mockReturnValueOnce({
        retrievalTopK: 5,
        useMMR: false,
        embeddingModel: 'nomic-embed-text',
      });
      mockEmbedQuery.mockResolvedValueOnce([0.1, 0.2, 0.3]);
      mockQueryRaw.mockResolvedValueOnce([]);

      await service.retrieve({
        query: 'test',
        topK: 3,
        useMMR: true,
        embeddingModel: 'text-embedding-3-small',
      });

      expect(mockEmbedQuery).toHaveBeenCalledWith('test', 'text-embedding-3-small');
    });
  });

  describe('verifyHnswIndex', () => {
    it('returns exists=true when the HNSW index is present', async () => {
      mockQueryRaw.mockResolvedValueOnce([{ indexname: 'embeddings_vector_hnsw_idx' }]);

      const result = await service.verifyHnswIndex();

      expect(result.exists).toBe(true);
      expect(result.name).toBe('embeddings_vector_hnsw_idx');
    });

    it('returns exists=false when the HNSW index is missing', async () => {
      mockQueryRaw.mockResolvedValueOnce([]);

      const result = await service.verifyHnswIndex();

      expect(result.exists).toBe(false);
      expect(result.name).toBe('embeddings_vector_hnsw_idx');
    });
  });
});
