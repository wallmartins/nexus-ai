import { Test, TestingModule } from '@nestjs/testing';
import { JobStatusController } from './job-status.controller';
import { JobStatusService } from './job-status.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('JobStatusController', () => {
  let controller: JobStatusController;

  const jobStatusService = {
    getQueueOverview: jest.fn(),
    getJobsByQueue: jest.fn(),
    getJobById: jest.fn(),
    getDeadLetterJobs: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobStatusController],
      providers: [{ provide: JobStatusService, useValue: jobStatusService }],
    }).compile();

    controller = module.get<JobStatusController>(JobStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /queues', () => {
    it('should return queue overview', async () => {
      jobStatusService.getQueueOverview.mockResolvedValue([
        { name: 'ingestion', waiting: 0, active: 0, completed: 5, failed: 0 },
      ]);

      const result = await controller.getQueueOverview();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('ingestion');
    });
  });

  describe('GET /queues/:queueName/jobs', () => {
    it('should return jobs for valid queue', async () => {
      jobStatusService.getJobsByQueue.mockResolvedValue([
        {
          id: 'job-1',
          queueName: 'ingestion',
          status: 'active',
          payload: {},
          attempts: 1,
          failedReason: null,
          createdAt: new Date(),
          updatedAt: null,
        },
      ]);

      const result = await controller.getJobs('ingestion', 'active');

      expect(result).toHaveLength(1);
      expect(jobStatusService.getJobsByQueue).toHaveBeenCalledWith(
        'ingestion',
        'active',
        50,
        0,
      );
    });

    it('should reject invalid queue name', async () => {
      await expect(controller.getJobs('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('GET /queues/:queueName/jobs/:jobId', () => {
    it('should return job details', async () => {
      jobStatusService.getJobById.mockResolvedValue({
        id: 'job-1',
        queueName: 'ingestion',
        status: 'completed',
        payload: {},
        attempts: 1,
        failedReason: null,
        createdAt: new Date(),
        updatedAt: null,
      });

      const result = await controller.getJob('ingestion', 'job-1');

      expect(result.id).toBe('job-1');
    });

    it('should throw NotFoundException for missing job', async () => {
      jobStatusService.getJobById.mockResolvedValue(null);

      await expect(controller.getJob('ingestion', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject invalid queue name', async () => {
      await expect(controller.getJob('invalid', 'job-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('GET /queues/dead-letter', () => {
    it('should return dead letter jobs', async () => {
      jobStatusService.getDeadLetterJobs.mockResolvedValue([
        {
          id: 'job-1',
          queueName: 'ingestion',
          status: 'failed',
          payload: {},
          attempts: 3,
          failedReason: 'Timeout',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await controller.getDeadLetterJobs();

      expect(result).toHaveLength(1);
      expect(result[0].failedReason).toBe('Timeout');
    });
  });
});
