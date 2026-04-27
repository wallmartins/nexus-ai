import { Injectable } from '@nestjs/common';
import { QueueService } from './queue.service';
import { JobRecordService } from './workers/job-record.service';
import { QueueName, QUEUE_NAMES } from './queue.config';

export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed';

export type JobInfo = {
  id: string;
  queueName: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  attempts: number;
  failedReason: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type QueueOverview = {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
};

@Injectable()
export class JobStatusService {
  constructor(
    private readonly queueService: QueueService,
    private readonly jobRecordService: JobRecordService,
  ) {}

  async getQueueOverview(): Promise<QueueOverview[]> {
    const queues: QueueName[] = [
      QUEUE_NAMES.INGESTION,
      QUEUE_NAMES.EMBEDDING,
      QUEUE_NAMES.EVALUATION,
    ];

    return Promise.all(
      queues.map(async (name) => {
        const status = await this.queueService.getQueueStatus(name);
        return {
          name,
          waiting: status.waiting,
          active: status.active,
          completed: status.completed,
          failed: status.failed,
        };
      }),
    );
  }

  async getJobsByQueue(
    queueName: QueueName,
    status?: JobStatus,
    limit = 50,
    offset = 0,
  ): Promise<JobInfo[]> {
    const queue = this.queueService.getQueue(queueName);
    let jobs: Array<{ id: string; data: unknown; attemptsMade: number; failedReason?: string; timestamp: number }> = [];

    if (!status || status === 'waiting') {
      const waiting = await queue.getWaiting(offset, limit);
      jobs = jobs.concat(waiting as typeof jobs);
    }
    if (!status || status === 'active') {
      const active = await queue.getActive(offset, limit);
      jobs = jobs.concat(active as typeof jobs);
    }
    if (!status || status === 'completed') {
      const completed = await queue.getCompleted(offset, limit);
      jobs = jobs.concat(completed as typeof jobs);
    }
    if (!status || status === 'failed') {
      const failed = await queue.getFailed(offset, limit);
      jobs = jobs.concat(failed as typeof jobs);
    }

    return jobs.map((job) => ({
      id: job.id,
      queueName,
      status: this.inferStatus(job, status),
      payload: (job.data ?? {}) as Record<string, unknown>,
      attempts: job.attemptsMade ?? 0,
      failedReason: job.failedReason ?? null,
      createdAt: job.timestamp ? new Date(job.timestamp) : null,
      updatedAt: null,
    }));
  }

  async getJobById(
    queueName: QueueName,
    jobId: string,
  ): Promise<JobInfo | null> {
    const queue = this.queueService.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) return null;

    const state = await job.getState();

    return {
      id: job.id ?? jobId,
      queueName,
      status: state as JobStatus,
      payload: (job.data ?? {}) as Record<string, unknown>,
      attempts: job.attemptsMade ?? 0,
      failedReason: job.failedReason ?? null,
      createdAt: job.timestamp ? new Date(job.timestamp) : null,
      updatedAt: null,
    };
  }

  async getDeadLetterJobs(limit = 50, offset = 0): Promise<JobInfo[]> {
    // Query JobRecord table for failed jobs with max attempts
    const records = await this.jobRecordService.findFailed(offset, limit);

    return records.map((r) => ({
      id: r.bullJobId,
      queueName: r.queueName,
      status: 'failed' as JobStatus,
      payload: (r.payload as Record<string, unknown>) ?? {},
      attempts: r.attempts,
      failedReason: r.failedReason,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  private inferStatus(
    job: { failedReason?: string },
    filterStatus?: JobStatus,
  ): JobStatus {
    if (filterStatus) return filterStatus;
    if (job.failedReason) return 'failed';
    return 'waiting';
  }
}
