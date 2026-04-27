import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationWorker } from './evaluation.worker';
import { EvaluationService } from '../../evaluation/evaluation.service';
import { RedisService } from '../../redis/redis.service';

describe('EvaluationWorker', () => {
  let worker: EvaluationWorker;

  const mockExecuteRun = jest.fn();
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
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue(mockRedisClient),
          },
        },
      ],
    }).compile();

    worker = module.get<EvaluationWorker>(EvaluationWorker);
  });

  it('instantiates', () => {
    expect(worker).toBeDefined();
  });

  describe('processJob', () => {
    it('calls evaluationService.executeRun with job data', async () => {
      mockExecuteRun.mockResolvedValueOnce(undefined);

      const job = {
        id: 'job-123',
        data: {
          runId: 'run-456',
          datasetVersion: '1.0.0',
          models: [{ provider: 'ollama', modelName: 'llama3' }],
        },
      } as unknown as Parameters<typeof worker['processJob']>[0];

      await worker['processJob'](job);

      expect(mockExecuteRun).toHaveBeenCalledWith('run-456', [
        { provider: 'ollama', modelName: 'llama3' },
      ]);
    });
  });
});
