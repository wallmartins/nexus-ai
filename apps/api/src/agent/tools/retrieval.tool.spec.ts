import { Test, TestingModule } from '@nestjs/testing';
import { RetrievalTool } from './retrieval.tool';
import { RetrievalService } from '../../rag/retrieval.service';

describe('RetrievalTool', () => {
  let tool: RetrievalTool;

  const retrievalService = {
    retrieve: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetrievalTool,
        { provide: RetrievalService, useValue: retrievalService },
      ],
    }).compile();

    tool = module.get<RetrievalTool>(RetrievalTool);
  });

  it('instantiates', () => {
    expect(tool).toBeDefined();
    expect(tool.name).toBe('retrieval');
  });

  describe('invoke', () => {
    it('returns chunks on successful retrieval', async () => {
      const chunks = [
        {
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          content: 'Refunds within 30 days.',
          index: 0,
          metadata: {},
          score: 0.92,
          modelName: 'nomic-embed-text',
        },
      ];

      retrievalService.retrieve.mockResolvedValue(chunks);

      const result = await tool.invoke({
        query: 'refund policy',
        correlationId: 'corr-1',
      });

      expect(retrievalService.retrieve).toHaveBeenCalledWith({ query: 'refund policy' });
      expect(result.toolName).toBe('retrieval');
      expect(result.output).toEqual(chunks);
      expect(result.error).toBeUndefined();
    });

    it('returns error when retrieval fails', async () => {
      retrievalService.retrieve.mockRejectedValue(new Error('Database error'));

      const result = await tool.invoke({
        query: 'refund policy',
        correlationId: 'corr-2',
      });

      expect(result.toolName).toBe('retrieval');
      expect(result.output).toEqual([]);
      expect(result.error).toBe('Database error');
    });
  });
});
