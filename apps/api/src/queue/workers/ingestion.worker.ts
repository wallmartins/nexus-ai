import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { PrismaService } from '../../database/prisma.service';
import { DocumentParserService } from '../../documents/parsers/document-parser.service';
import { ChunkingService } from '../../documents/chunking/chunking.service';
import { QueueService } from '../queue.service';
import { SettingsService } from '../../settings/settings.service';
import { JobRecordService } from './job-record.service';
import { QUEUE_NAMES } from '../queue.config';
import { IngestionJobPayload } from '../queue.types';

@Injectable()
export class IngestionWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionWorker.name);
  private worker!: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly parser: DocumentParserService,
    private readonly chunking: ChunkingService,
    private readonly queueService: QueueService,
    private readonly settingsService: SettingsService,
    private readonly jobRecord: JobRecordService,
  ) {}

  onModuleInit() {
    const connection = this.redisService.getClient();

    this.worker = new Worker(
      QUEUE_NAMES.INGESTION,
      this.processJob.bind(this),
      {
        connection,
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Ingestion job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Ingestion job ${job?.id} failed: ${err.message}`,
        err.stack,
      );
    });

    this.logger.log('Ingestion worker started (concurrency=1)');
  }

  onModuleDestroy() {
    void this.worker?.close();
  }

  protected async processJob(job: Job<IngestionJobPayload>): Promise<void> {
    const { documentId, filePath, mimeType } = job.data;
    const bullJobId = String(job.id);

    this.logger.log(`Processing ingestion job ${bullJobId} for document ${documentId}`);

    await this.jobRecord.createOrUpdate(
      QUEUE_NAMES.INGESTION,
      bullJobId,
      'active',
      { documentId, filePath, mimeType },
      job.attemptsMade + 1,
    );

    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'parsing' },
      });

      const parsed = await this.parser.parse(filePath, mimeType);

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'chunking',
          metadata: {
            pageCount: parsed.pageCount,
          },
        },
      });

      const settings = this.settingsService.getSettings();
      const chunks = this.chunking.split(parsed.text, {
        chunkSize: settings.chunkSize,
        chunkOverlap: settings.chunkOverlap,
      });

      if (chunks.length === 0) {
        throw new Error('Document produced zero chunks after parsing');
      }

      const createdChunks = await this.prisma.chunk.createManyAndReturn({
        data: chunks.map((chunk) => ({
          documentId,
          content: chunk.content,
          index: chunk.index,
          metadata: {},
        })),
      });

      const chunkIds = createdChunks.map((c) => c.id);

      this.logger.log(
        `Document ${documentId} parsed into ${chunkIds.length} chunks`,
      );

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'embedding' },
      });

      await this.queueService.enqueueEmbedding({
        documentId,
        chunkIds,
        embeddingModel: settings.embeddingModel,
      });

      await this.jobRecord.markCompleted(bullJobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Ingestion failed for document ${documentId}: ${message}`,
      );

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'failed' },
      });

      await this.jobRecord.markFailed(
        bullJobId,
        message,
        job.attemptsMade + 1,
      );

      throw err;
    }
  }
}
