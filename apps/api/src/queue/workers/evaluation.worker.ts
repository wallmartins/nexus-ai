import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';
import { EvaluationService } from '../../evaluation/evaluation.service';
import { QUEUE_NAMES } from '../queue.config';
import { EvaluationJobPayload } from '../queue.types';

@Injectable()
export class EvaluationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EvaluationWorker.name);
  private worker!: Worker;

  constructor(
    private readonly redisService: RedisService,
    private readonly evaluationService: EvaluationService,
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
      this.logger.error(
        `Evaluation job ${job?.id} failed: ${err.message}`,
        err.stack,
      );
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

    await this.evaluationService.executeRun(runId, models);
  }
}
