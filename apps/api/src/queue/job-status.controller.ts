import {
  Controller,
  Get,
  Param,
  Query,
  Sse,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable, interval, concatMap } from 'rxjs';
import { JobStatusService, JobInfo, QueueOverview } from './job-status.service';
import { QUEUE_NAMES, QueueName } from './queue.config';
import { QueueOverviewDto, JobInfoDto } from './queue.dto';

function isValidQueue(name: string): name is QueueName {
  return Object.values(QUEUE_NAMES).includes(name as QueueName);
}

@ApiTags('Queues')
@Controller('queues')
export class JobStatusController {
  constructor(private readonly jobStatusService: JobStatusService) {}

  @Get()
  @ApiOperation({ summary: 'Get queue overview counts' })
  @ApiResponse({ status: 200, description: 'Queue statistics', type: [QueueOverviewDto] })
  async getQueueOverview(): Promise<QueueOverview[]> {
    return this.jobStatusService.getQueueOverview();
  }

  @Get(':queueName/jobs')
  @ApiOperation({ summary: 'List jobs in a queue' })
  @ApiParam({ name: 'queueName', description: `Queue name: ${Object.values(QUEUE_NAMES).join(', ')}` })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Pagination limit' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiResponse({ status: 200, description: 'List of jobs', type: [JobInfoDto] })
  @ApiResponse({ status: 400, description: 'Invalid queue name' })
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
  @ApiOperation({ summary: 'Get a specific job' })
  @ApiParam({ name: 'queueName', description: 'Queue name' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({ status: 200, description: 'Job details', type: JobInfoDto })
  @ApiResponse({ status: 400, description: 'Invalid queue name' })
  @ApiResponse({ status: 404, description: 'Job not found' })
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
  @ApiOperation({ summary: 'Get dead-letter jobs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Pagination limit' })
  @ApiQuery({ name: 'offset', required: false, description: 'Pagination offset' })
  @ApiResponse({ status: 200, description: 'List of dead-letter jobs', type: [JobInfoDto] })
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
  @ApiOperation({ summary: 'Stream real-time queue status (SSE)' })
  streamQueueStatus(): Observable<{ data: unknown }> {
    return interval(3000).pipe(
      concatMap(async () => {
        const overview = await this.jobStatusService.getQueueOverview();
        return { data: { type: 'queue-overview', payload: overview } };
      }),
    );
  }
}
