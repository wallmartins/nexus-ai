import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES } from './queue.config';

const mockAdd = jest.fn();
const mockGetWaitingCount = jest.fn();
const mockGetActiveCount = jest.fn();
const mockGetCompletedCount = jest.fn();
const mockGetFailedCount = jest.fn();

jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: mockAdd,
    getWaitingCount: mockGetWaitingCount,
    getActiveCount: mockGetActiveCount,
    getCompletedCount: mockGetCompletedCount,
    getFailedCount: mockGetFailedCount,
  })),
}));

describe('QueueService', () => {
  let service: QueueService;

  const mockRedisClient = {} as any;

  beforeEach(async () => {
    mockAdd.mockClear();
    mockGetWaitingCount.mockClear();
    mockGetActiveCount.mockClear();
    mockGetCompletedCount.mockClear();
    mockGetFailedCount.mockClear();

    const { Queue } = jest.requireMock('bullmq');
    Queue.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
          },
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  it('creates 3 queues on construction', () => {
    const { Queue } = jest.requireMock('bullmq');
    expect(Queue).toHaveBeenCalledTimes(3);
    expect(Queue).toHaveBeenCalledWith(
      QUEUE_NAMES.INGESTION,
      expect.objectContaining({
        connection: mockRedisClient,
        defaultJobOptions: expect.objectContaining({
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
        }),
      }),
    );
    expect(Queue).toHaveBeenCalledWith(
      QUEUE_NAMES.EMBEDDING,
      expect.any(Object),
    );
    expect(Queue).toHaveBeenCalledWith(
      QUEUE_NAMES.EVALUATION,
      expect.any(Object),
    );
  });

  describe('enqueueIngestion', () => {
    it('adds job to ingestion queue and returns job id', async () => {
      mockAdd.mockResolvedValueOnce({ id: 'job-123' });

      const id = await service.enqueueIngestion({
        documentId: 'doc-1',
        filePath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
      });

      expect(mockAdd).toHaveBeenCalledWith('ingest-document', {
        documentId: 'doc-1',
        filePath: '/uploads/test.pdf',
        mimeType: 'application/pdf',
      });
      expect(id).toBe('job-123');
    });
  });

  describe('enqueueEmbedding', () => {
    it('adds job to embedding queue and returns job id', async () => {
      mockAdd.mockResolvedValueOnce({ id: 'job-456' });

      const id = await service.enqueueEmbedding({
        documentId: 'doc-1',
        chunkIds: ['chunk-1', 'chunk-2'],
        embeddingModel: 'nomic-embed-text',
      });

      expect(mockAdd).toHaveBeenCalledWith('generate-embeddings', {
        documentId: 'doc-1',
        chunkIds: ['chunk-1', 'chunk-2'],
        embeddingModel: 'nomic-embed-text',
      });
      expect(id).toBe('job-456');
    });
  });

  describe('enqueueEvaluation', () => {
    it('adds job to evaluation queue and returns job id', async () => {
      mockAdd.mockResolvedValueOnce({ id: 'job-789' });

      const id = await service.enqueueEvaluation({
        runId: 'run-1',
        datasetVersion: 'v1.0.0',
        models: [{ provider: 'ollama', modelName: 'llama3' }],
      });

      expect(mockAdd).toHaveBeenCalledWith('run-evaluation', {
        runId: 'run-1',
        datasetVersion: 'v1.0.0',
        models: [{ provider: 'ollama', modelName: 'llama3' }],
      });
      expect(id).toBe('job-789');
    });
  });

  describe('getQueueStatus', () => {
    it('returns counts for all statuses', async () => {
      mockGetWaitingCount.mockResolvedValueOnce(5);
      mockGetActiveCount.mockResolvedValueOnce(2);
      mockGetCompletedCount.mockResolvedValueOnce(100);
      mockGetFailedCount.mockResolvedValueOnce(3);

      const status = await service.getQueueStatus(QUEUE_NAMES.INGESTION);

      expect(status).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
      });
    });
  });

  describe('getQueue', () => {
    it('returns the queue instance by name', () => {
      const queue = service.getQueue(QUEUE_NAMES.EMBEDDING);
      expect(queue).toBeDefined();
      expect(queue.add).toBeDefined();
    });
  });
});
