import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service';
import { QUEUE_NAMES, QueueName } from './queue.config';
import {
  IngestionJobPayload,
  EmbeddingJobPayload,
  EvaluationJobPayload,
} from './queue.types';

@Injectable()
export class QueueService {
  private readonly queues: Record<QueueName, Queue>;

  constructor(private readonly redisService: RedisService) {
    const redisConnection = this.redisService.getClient();

    this.queues = {
      [QUEUE_NAMES.INGESTION]: new Queue(QUEUE_NAMES.INGESTION, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      }),
      [QUEUE_NAMES.EMBEDDING]: new Queue(QUEUE_NAMES.EMBEDDING, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      }),
      [QUEUE_NAMES.EVALUATION]: new Queue(QUEUE_NAMES.EVALUATION, {
        connection: redisConnection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      }),
    };
  }

  async enqueueIngestion(payload: IngestionJobPayload): Promise<string> {
    const job = await this.queues[QUEUE_NAMES.INGESTION].add(
      'ingest-document',
      payload,
    );
    return job.id ?? '';
  }

  async enqueueEmbedding(payload: EmbeddingJobPayload): Promise<string> {
    const job = await this.queues[QUEUE_NAMES.EMBEDDING].add(
      'generate-embeddings',
      payload,
    );
    return job.id ?? '';
  }

  async enqueueEvaluation(payload: EvaluationJobPayload): Promise<string> {
    const job = await this.queues[QUEUE_NAMES.EVALUATION].add(
      'run-evaluation',
      payload,
    );
    return job.id ?? '';
  }

  getQueue(name: QueueName): Queue {
    return this.queues[name];
  }

  async getQueueStatus(name: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const queue = this.queues[name];
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    return { waiting, active, completed, failed };
  }
}
