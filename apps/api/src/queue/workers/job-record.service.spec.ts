import { Test, TestingModule } from '@nestjs/testing';
import { JobRecordService } from './job-record.service';
import { PrismaService } from '../../database/prisma.service';

describe('JobRecordService', () => {
  let service: JobRecordService;
  let prisma: {
    jobRecord: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      jobRecord: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobRecordService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<JobRecordService>(JobRecordService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('createOrUpdate', () => {
    it('creates job record when not existing', async () => {
      prisma.jobRecord.findFirst.mockResolvedValue(null);

      await service.createOrUpdate(
        'ingestion',
        'job-123',
        'active',
        { documentId: 'doc-1' },
        1,
      );

      expect(prisma.jobRecord.findFirst).toHaveBeenCalledWith({
        where: { bullJobId: 'job-123' },
      });
      expect(prisma.jobRecord.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          queueName: 'ingestion',
          bullJobId: 'job-123',
          status: 'active',
          attempts: 1,
          failedReason: null,
        }),
      });
      expect(prisma.jobRecord.update).not.toHaveBeenCalled();
    });

    it('updates job record when existing', async () => {
      prisma.jobRecord.findFirst.mockResolvedValue({ id: 'rec-1' });

      await service.createOrUpdate(
        'embedding',
        'job-456',
        'failed',
        {},
        2,
        'timeout',
      );

      expect(prisma.jobRecord.update).toHaveBeenCalledWith({
        where: { id: 'rec-1' },
        data: expect.objectContaining({
          queueName: 'embedding',
          bullJobId: 'job-456',
          status: 'failed',
          attempts: 2,
          failedReason: 'timeout',
        }),
      });
      expect(prisma.jobRecord.create).not.toHaveBeenCalled();
    });
  });

  describe('markCompleted', () => {
    it('updates status to completed', async () => {
      await service.markCompleted('job-123');

      expect(prisma.jobRecord.updateMany).toHaveBeenCalledWith({
        where: { bullJobId: 'job-123' },
        data: { status: 'completed' },
      });
    });
  });

  describe('markFailed', () => {
    it('updates status and records failure reason', async () => {
      await service.markFailed('job-123', 'Connection error', 3);

      expect(prisma.jobRecord.updateMany).toHaveBeenCalledWith({
        where: { bullJobId: 'job-123' },
        data: {
          status: 'failed',
          failedReason: 'Connection error',
          attempts: 3,
        },
      });
    });
  });
});
