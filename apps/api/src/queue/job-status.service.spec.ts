import { Test, TestingModule } from '@nestjs/testing';
import { JobStatusService } from './job-status.service';
import { QueueService } from './queue.service';
import { JobRecordService } from './workers/job-record.service';
import { QUEUE_NAMES } from './queue.config';

describe('JobStatusService', () => {
  let service: JobStatusService;

  const queueService = {
    getQueueStatus: jest.fn(),
    getQueue: jest.fn(),
  };

  const jobRecordService = {
    findFailed: jest.fn(),
  };

  const mockQueue = {
    getWaiting: jest.fn(),
    getActive: jest.fn(),
    getCompleted: jest.fn(),
    getFailed: jest.fn(),
    getJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobStatusService,
        { provide: QueueService, useValue: queueService },
        { provide: JobRecordService, useValue: jobRecordService },
      ],
    }).compile();

    service = module.get<JobStatusService>(JobStatusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQueueOverview', () => {
    it('should return overview for all queues', async () => {
      queueService.getQueueStatus.mockResolvedValue({
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 0,
      });

      const result = await service.getQueueOverview();

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        name: QUEUE_NAMES.INGESTION,
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 0,
      });
      expect(queueService.getQueueStatus).toHaveBeenCalledTimes(3);
    });
  });

  describe('getJobsByQueue', () => {
    it('should return jobs filtered by status', async () => {
      queueService.getQueue.mockReturnValue(mockQueue);
      mockQueue.getActive.mockResolvedValue([
        {
          id: 'job-1',
          data: { documentId: 'doc-1' },
          attemptsMade: 1,
          timestamp: Date.now(),
        },
      ]);

      const result = await service.getJobsByQueue(
        QUEUE_NAMES.INGESTION,
        'active',
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('job-1');
      expect(result[0].status).toBe('active');
      expect(mockQueue.getActive).toHaveBeenCalled();
      expect(mockQueue.getWaiting).not.toHaveBeenCalled();
    });

    it('should return jobs from all statuses when no filter', async () => {
      queueService.getQueue.mockReturnValue(mockQueue);
      mockQueue.getWaiting.mockResolvedValue([]);
      mockQueue.getActive.mockResolvedValue([
        {
          id: 'job-1',
          data: {},
          attemptsMade: 1,
          timestamp: Date.now(),
        },
      ]);
      mockQueue.getCompleted.mockResolvedValue([]);
      mockQueue.getFailed.mockResolvedValue([]);

      const result = await service.getJobsByQueue(QUEUE_NAMES.EMBEDDING);

      expect(result).toHaveLength(1);
      expect(mockQueue.getWaiting).toHaveBeenCalled();
      expect(mockQueue.getActive).toHaveBeenCalled();
      expect(mockQueue.getCompleted).toHaveBeenCalled();
      expect(mockQueue.getFailed).toHaveBeenCalled();
    });
  });

  describe('getJobById', () => {
    it('should return job details', async () => {
      queueService.getQueue.mockReturnValue(mockQueue);
      mockQueue.getJob.mockResolvedValue({
        id: 'job-1',
        data: { documentId: 'doc-1' },
        attemptsMade: 2,
        failedReason: null,
        timestamp: Date.now(),
        getState: jest.fn().mockResolvedValue('completed'),
      });

      const result = await service.getJobById(QUEUE_NAMES.INGESTION, 'job-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('job-1');
      expect(result?.status).toBe('completed');
    });

    it('should return null for missing job', async () => {
      queueService.getQueue.mockReturnValue(mockQueue);
      mockQueue.getJob.mockResolvedValue(null);

      const result = await service.getJobById(QUEUE_NAMES.INGESTION, 'missing');

      expect(result).toBeNull();
    });
  });

  describe('getDeadLetterJobs', () => {
    it('should return failed jobs from JobRecord', async () => {
      jobRecordService.findFailed.mockResolvedValue([
        {
          bullJobId: 'job-1',
          queueName: 'ingestion',
          status: 'failed',
          payload: { documentId: 'doc-1' },
          attempts: 3,
          failedReason: 'Timeout',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.getDeadLetterJobs();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('job-1');
      expect(result[0].status).toBe('failed');
      expect(result[0].failedReason).toBe('Timeout');
    });
  });
});
