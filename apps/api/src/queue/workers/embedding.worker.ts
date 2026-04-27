import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { EmbeddingsService } from '../../embeddings/embeddings.service';
import { JobRecordService } from './job-record.service';
import { QUEUE_NAMES } from '../queue.config';
import { EmbeddingJobPayload } from '../queue.types';

@Injectable()
export class EmbeddingWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmbeddingWorker.name);
  private worker!: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly jobRecord: JobRecordService,
  ) {}

  onModuleInit() {
    const connection = this.redisService.getClient();

    this.worker = new Worker(
      QUEUE_NAMES.EMBEDDING,
      this.processJob.bind(this),
      {
        connection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Embedding job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Embedding job ${job?.id} failed: ${err.message}`,
        err.stack,
      );
    });

    this.logger.log('Embedding worker started (concurrency=2)');
  }

  onModuleDestroy() {
    void this.worker?.close();
  }

  protected async processJob(job: Job<EmbeddingJobPayload>): Promise<void> {
    const { documentId, chunkIds, embeddingModel } = job.data;
    const bullJobId = String(job.id);

    this.logger.log(
      `Processing embedding job ${bullJobId} for document ${documentId} (${chunkIds.length} chunks)`,
    );

    await this.jobRecord.createOrUpdate(
      QUEUE_NAMES.EMBEDDING,
      bullJobId,
      'active',
      { documentId, chunkIds, embeddingModel },
      job.attemptsMade + 1,
    );

    try {
      await this.embeddingsService.generateAndStoreEmbeddings(
        documentId,
        chunkIds,
        embeddingModel,
      );

      await this.jobRecord.markCompleted(bullJobId);

      this.logger.log(
        `Embedding completed for document ${documentId}`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Embedding failed for document ${documentId}: ${message}`,
      );

      await this.jobRecord.markFailed(
        bullJobId,
        message,
        job.attemptsMade + 1,
      );

      throw err;
    }
  }
}
