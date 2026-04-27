import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { EvaluationService } from '../../evaluation/evaluation.service';
import { JobRecordService } from './job-record.service';
import { QUEUE_NAMES } from '../queue.config';
import { EvaluationJobPayload } from '../queue.types';

@Injectable()
export class EvaluationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationWorker.name);
  private worker!: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly evaluationService: EvaluationService,
    private readonly jobRecord: JobRecordService,
  ) {}

  onModuleInit() {
    const connection = this.redisService.getClient();

    this.worker = new Worker(
      QUEUE_NAMES.EVALUATION,
      this.processJob.bind(this),
      {
        connection,
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Evaluation job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      const bullJobId = String(job?.id);
      const attemptsMade = (job?.attemptsMade ?? 0) + 1;
      const maxAttempts = job?.opts?.attempts ?? 3;
      const isFinalAttempt = attemptsMade >= maxAttempts;

      if (isFinalAttempt) {
        this.logger.error(
          `Evaluation job ${bullJobId} dead-lettered after ${attemptsMade} attempts: ${err.message}`,
        );
        void this.jobRecord.markFailed(bullJobId, err.message, attemptsMade);
      } else {
        this.logger.warn(
          `Evaluation job ${bullJobId} failed (attempt ${attemptsMade}/${maxAttempts}), will retry: ${err.message}`,
        );
      }
    });

    this.logger.log('Evaluation worker started (concurrency=1)');
  }

  onModuleDestroy() {
    void this.worker?.close();
  }

  protected async processJob(job: Job<EvaluationJobPayload>): Promise<void> {
    const { runId, models } = job.data;
    const bullJobId = String(job.id);

    this.logger.log(`Processing evaluation job ${bullJobId} for run ${runId}`);

    await this.jobRecord.createOrUpdate(
      QUEUE_NAMES.EVALUATION,
      bullJobId,
      'active',
      { runId, models },
      job.attemptsMade + 1,
    );

    try {
      await this.evaluationService.executeRun(runId, models);
      await this.jobRecord.markCompleted(bullJobId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Evaluation run ${runId} failed on attempt ${job.attemptsMade + 1}: ${message}`,
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
