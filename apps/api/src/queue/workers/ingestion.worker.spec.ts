import { Test, TestingModule } from '@nestjs/testing';
import { IngestionWorker } from './ingestion.worker';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { DocumentParserService } from '../../documents/parsers/document-parser.service';
import { ChunkingService } from '../../documents/chunking/chunking.service';
import { QueueService } from '../queue.service';
import { SettingsService } from '../../settings/settings.service';
import { JobRecordService } from './job-record.service';

describe('IngestionWorker', () => {
  let worker: IngestionWorker;
  let prisma: {
    document: { update: jest.Mock };
    chunk: { createManyAndReturn: jest.Mock };
  };
  let parser: { parse: jest.Mock };
  let chunking: { split: jest.Mock };
  let queueService: { enqueueEmbedding: jest.Mock };
  let jobRecord: {
    createOrUpdate: jest.Mock;
    markCompleted: jest.Mock;
    markFailed: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      document: {
        update: jest.fn().mockResolvedValue({}),
      },
      chunk: {
        createManyAndReturn: jest.fn().mockResolvedValue([
          { id: 'chunk-1' },
          { id: 'chunk-2' },
        ]),
      },
    };

    parser = {
      parse: jest.fn().mockResolvedValue({
        text: 'Parsed document text',
        pageCount: 3,
      }),
    };

    chunking = {
      split: jest.fn().mockReturnValue([
        { content: 'Chunk 1', index: 0 },
        { content: 'Chunk 2', index: 1 },
      ]),
    };

    queueService = {
      enqueueEmbedding: jest.fn().mockResolvedValue('embed-job-1'),
    };

    jobRecord = {
      createOrUpdate: jest.fn().mockResolvedValue(undefined),
      markCompleted: jest.fn().mockResolvedValue(undefined),
      markFailed: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionWorker,
        { provide: RedisService, useValue: { getClient: () => ({}) } },
        { provide: PrismaService, useValue: prisma },
        { provide: DocumentParserService, useValue: parser },
        { provide: ChunkingService, useValue: chunking },
        { provide: QueueService, useValue: queueService },
        {
          provide: SettingsService,
          useValue: {
            getSettings: () => ({
              chunkSize: 500,
              chunkOverlap: 50,
              embeddingModel: 'nomic-embed-text',
            }),
          },
        },
        { provide: JobRecordService, useValue: jobRecord },
      ],
    }).compile();

    worker = module.get<IngestionWorker>(IngestionWorker);
  });

  it('instantiates', () => {
    expect(worker).toBeDefined();
  });

  describe('processJob', () => {
    it('parses, chunks, stores, and enqueues embedding job', async () => {
      const job = {
        id: 'job-1',
        data: {
          documentId: 'doc-1',
          filePath: '/tmp/test.pdf',
          mimeType: 'application/pdf',
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job;

      await (worker as any).processJob(job);

      expect(prisma.document.update).toHaveBeenCalledTimes(3);
      expect(prisma.document.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'doc-1' },
        data: { status: 'parsing' },
      });
      expect(prisma.document.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'doc-1' },
        data: {
          status: 'chunking',
          metadata: { pageCount: 3 },
        },
      });

      expect(parser.parse).toHaveBeenCalledWith('/tmp/test.pdf', 'application/pdf');
      expect(chunking.split).toHaveBeenCalledWith('Parsed document text', {
        chunkSize: 500,
        chunkOverlap: 50,
      });

      expect(prisma.chunk.createManyAndReturn).toHaveBeenCalledWith({
        data: [
          { documentId: 'doc-1', content: 'Chunk 1', index: 0, metadata: {} },
          { documentId: 'doc-1', content: 'Chunk 2', index: 1, metadata: {} },
        ],
      });

      expect(queueService.enqueueEmbedding).toHaveBeenCalledWith({
        documentId: 'doc-1',
        chunkIds: ['chunk-1', 'chunk-2'],
        embeddingModel: 'nomic-embed-text',
      });

      expect(jobRecord.createOrUpdate).toHaveBeenCalledWith(
        'ingestion',
        'job-1',
        'active',
        { documentId: 'doc-1', filePath: '/tmp/test.pdf', mimeType: 'application/pdf' },
        1,
      );
      expect(jobRecord.markCompleted).toHaveBeenCalledWith('job-1');
    });

    it('marks document and job as failed on parse error', async () => {
      parser.parse.mockRejectedValue(new Error('Corrupt PDF'));

      const job = {
        id: 'job-2',
        data: {
          documentId: 'doc-2',
          filePath: '/tmp/bad.pdf',
          mimeType: 'application/pdf',
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job;

      await expect(
        (worker as any).processJob(job),
      ).rejects.toThrow('Corrupt PDF');

      expect(prisma.document.update).toHaveBeenCalledWith({
        where: { id: 'doc-2' },
        data: { status: 'failed' },
      });

      expect(jobRecord.markFailed).toHaveBeenCalledWith(
        'job-2',
        'Corrupt PDF',
        1,
      );
    });

    it('throws when document produces zero chunks', async () => {
      parser.parse.mockResolvedValue({ text: '', pageCount: 1 });
      chunking.split.mockReturnValue([]);

      const job = {
        id: 'job-3',
        data: {
          documentId: 'doc-3',
          filePath: '/tmp/empty.txt',
          mimeType: 'text/plain',
        },
        attemptsMade: 0,
      } as unknown as import('bullmq').Job;

      await expect(
        (worker as any).processJob(job),
      ).rejects.toThrow('Document produced zero chunks after parsing');
    });
  });
});
