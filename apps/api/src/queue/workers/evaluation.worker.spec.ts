import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bullmq';
import { EvaluationWorker } from './evaluation.worker';
import { EvaluationService } from '../../evaluation/evaluation.service';
import { JobRecordService } from './job-record.service';
import { RedisService } from '../../redis/redis.service';

describe('EvaluationWorker', () => {
  let worker: EvaluationWorker;

  const mockExecuteRun = jest.fn();
  const mockCreateOrUpdate = jest.fn();
  const mockMarkCompleted = jest.fn();
  const mockMarkFailed = jest.fn();
  const mockRedisClient = { quit: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationWorker,
        {
          provide: EvaluationService,
          useValue: {
            executeRun: mockExecuteRun,
          },
        },
        {
          provide: JobRecordService,
          useValue: {
            createOrUpdate: mockCreateOrUpdate,
            markCompleted: mockMarkCompleted,
            markFailed: mockMarkFailed,
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
          },
        },
      ],
    }).compile();

    worker = module.get<EvaluationWorker>(EvaluationWorker);
  });

  afterEach(async () => {
    if (worker && worker['worker']) {
      await worker['worker'].close();
    }
  });

  it('instantiates', () => {
    expect(worker).toBeDefined();
  });

  describe('processJob', () => {
    it('creates job record and runs evaluation', async () => {
      mockExecuteRun.mockResolvedValueOnce(undefined);

      const job = {
        id: 'job-123',
        data: {
          runId: 'run-456',
          datasetVersion: '1.0.0',
          models: [{ provider: 'ollama', modelName: 'llama3' }],
        },
        attemptsMade: 0,
      } as unknown as Parameters<typeof worker['processJob']>[0];

      await worker['processJob'](job);

      expect(mockCreateOrUpdate).toHaveBeenCalledWith(
        'evaluation',
        'job-123',
        'active',
        { runId: 'run-456', models: [{ provider: 'ollama', modelName: 'llama3' }] },
        1,
      );
      expect(mockExecuteRun).toHaveBeenCalledWith('run-456', [
        { provider: 'ollama', modelName: 'llama3' },
      ]);
      expect(mockMarkCompleted).toHaveBeenCalledWith('job-123');
    });

    it('marks job failed and rethrows on error', async () => {
      mockExecuteRun.mockRejectedValueOnce(new Error('LLM timeout'));

      const job = {
        id: 'job-123',
        data: {
          runId: 'run-456',
          models: [{ provider: 'ollama', modelName: 'llama3' }],
        },
        attemptsMade: 0,
      } as unknown as Parameters<typeof worker['processJob']>[0];

      await expect(worker['processJob'](job)).rejects.toThrow('LLM timeout');

      expect(mockMarkFailed).toHaveBeenCalledWith(
        'job-123',
        'LLM timeout',
        1,
      );
    });

    it('tracks retry attempts in job record', async () => {
      mockExecuteRun.mockResolvedValueOnce(undefined);

      const job = {
        id: 'job-123',
        data: {
          runId: 'run-456',
          models: [{ provider: 'ollama', modelName: 'llama3' }],
        },
        attemptsMade: 2,
      } as unknown as Parameters<typeof worker['processJob']>[0];

      await worker['processJob'](job);

      expect(mockCreateOrUpdate).toHaveBeenCalledWith(
        'evaluation',
        'job-123',
        'active',
        expect.any(Object),
        3,
      );
    });
  });

  describe('failed event handler', () => {
    beforeEach(() => {
      worker.onModuleInit();
    });

    it('marks dead-letter on final failure attempt', () => {
      mockMarkFailed.mockResolvedValueOnce(undefined);

      const job = {
        id: 'job-123',
        attemptsMade: 2,
        opts: { attempts: 3 },
      } as unknown as Job;

      const error = new Error('Final failure');

      worker['worker'].emit('failed', job, error, 'active');

      expect(mockMarkFailed).toHaveBeenCalledWith(
        'job-123',
        'Final failure',
        3,
      );
    });

    it('does not mark dead-letter when retries remain', () => {
      const job = {
        id: 'job-123',
        attemptsMade: 0,
        opts: { attempts: 3 },
      } as unknown as Job;

      const error = new Error('Transient failure');

      worker['worker'].emit('failed', job, error, 'active');

      expect(mockMarkFailed).not.toHaveBeenCalled();
    });
  });
});
