import {
  Controller,
  Get,
  Param,
  Query,
  Sse,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Observable, interval, concatMap } from 'rxjs';
import { JobStatusService, JobInfo, QueueOverview } from './job-status.service';
import { QUEUE_NAMES, QueueName } from './queue.config';

function isValidQueue(name: string): name is QueueName {
  return Object.values(QUEUE_NAMES).includes(name as QueueName);
}

@Controller('queues')
export class JobStatusController {
  constructor(private readonly jobStatusService: JobStatusService) {}

  @Get()
  async getQueueOverview(): Promise<QueueOverview[]> {
    return this.jobStatusService.getQueueOverview();
  }

  @Get(':queueName/jobs')
  async getJobs(
    @Param('queueName') queueName: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<JobInfo[]> {
    if (!isValidQueue(queueName)) {
      throw new BadRequestException({
        code: 'INVALID_QUEUE',
        message: `Queue must be one of: ${Object.values(QUEUE_NAMES).join(', ')}`,
      });
    }

    const validStatus =
      status && ['waiting', 'active', 'completed', 'failed'].includes(status)
        ? (status as 'waiting' | 'active' | 'completed' | 'failed')
        : undefined;

    return this.jobStatusService.getJobsByQueue(
      queueName,
      validStatus,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':queueName/jobs/:jobId')
  async getJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<JobInfo> {
    if (!isValidQueue(queueName)) {
      throw new BadRequestException({
        code: 'INVALID_QUEUE',
        message: `Queue must be one of: ${Object.values(QUEUE_NAMES).join(', ')}`,
      });
    }

    const job = await this.jobStatusService.getJobById(queueName, jobId);
    if (!job) {
      throw new NotFoundException({
        code: 'JOB_NOT_FOUND',
        message: `Job ${jobId} not found in queue ${queueName}`,
      });
    }
    return job;
  }

  @Get('dead-letter')
  async getDeadLetterJobs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<JobInfo[]> {
    return this.jobStatusService.getDeadLetterJobs(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Sse('stream')
  streamQueueStatus(): Observable<{ data: unknown }> {
    return interval(3000).pipe(
      concatMap(async () => {
        const overview = await this.jobStatusService.getQueueOverview();
        return { data: { type: 'queue-overview', payload: overview } };
      }),
    );
  }
}
