import { Test, TestingModule } from '@nestjs/testing';
import { EmbeddingWorker } from './embedding.worker';
import { RedisService } from '../../redis/redis.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { JobRecordService } from './job-record.service';

describe('EmbeddingWorker', () => {
  let worker: EmbeddingWorker;
  let embeddingsService: { generateAndStoreEmbeddings: jest.Mock };
  let jobRecord: {
    createOrUpdate: jest.Mock;
    markCompleted: jest.Mock;
    markFailed: jest.Mock;
  };

  beforeEach(async () => {
    embeddingsService = {
      generateAndStoreEmbeddings: jest.fn().mockResolvedValue(undefined),
    };

    jobRecord = {
      createOrUpdate: jest.fn().mockResolvedValue(undefined),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmbeddingWorker,
        { provide: RedisService, useValue: { getClient: () => ({}) } },
        { provide: EmbeddingsService, useValue: embeddingsService },
        { provide: JobRecordService, useValue: jobRecord },
      ],
    }).compile();

    worker = module.get<EmbeddingWorker>(EmbeddingWorker);
  });

  it('instantiates', () => {
    expect(worker).toBeDefined();
  });

  describe('processJob', () => {
    it('generates embeddings and marks job completed', async () => {
      const job = {
        id: 'job-10',
        data: {
          documentId: 'doc-10',
          chunkIds: ['chunk-a', 'chunk-b'],
          embeddingModel: 'nomic-embed-text',
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job;

      await (worker as any).processJob(job);

      expect(embeddingsService.generateAndStoreEmbeddings).toHaveBeenCalledWith(
        'doc-10',
        ['chunk-a', 'chunk-b'],
        'nomic-embed-text',
      );

      expect(jobRecord.createOrUpdate).toHaveBeenCalledWith(
        'embedding',
        'job-10',
        'active',
        { documentId: 'doc-10', chunkIds: ['chunk-a', 'chunk-b'], embeddingModel: 'nomic-embed-text' },
        1,
      );
      expect(jobRecord.markCompleted).toHaveBeenCalledWith('job-10');
    });

    it('marks job failed on embedding error', async () => {
      embeddingsService.generateAndStoreEmbeddings.mockRejectedValue(
        new Error('Ollama unreachable'),
      );

      const job = {
        id: 'job-11',
        data: {
          documentId: 'doc-11',
          chunkIds: ['chunk-c'],
          embeddingModel: 'nomic-embed-text',
        },
        attemptsMade: 1,
      } as unknown as import('bullmq').Job;

      await expect(
        (worker as any).processJob(job),
      ).rejects.toThrow('Ollama unreachable');

      expect(jobRecord.markFailed).toHaveBeenCalledWith(
        'job-11',
        'Ollama unreachable',
        2,
      );
    });
  });
});
