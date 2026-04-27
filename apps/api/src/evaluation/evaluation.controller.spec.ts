import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { QueueService } from '../queue/queue.service';

describe('EvaluationController', () => {
  let controller: EvaluationController;

  const mockCreateRun = jest.fn();
  const mockEnqueueEvaluation = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EvaluationController],
      providers: [
        {
          provide: EvaluationService,
          useValue: {
            createRun: mockCreateRun,
          },
        },
        {
          provide: QueueService,
          useValue: {
            enqueueEvaluation: mockEnqueueEvaluation,
          },
        },
      ],
    }).compile();

    controller = module.get<EvaluationController>(EvaluationController);
  });

  it('instantiates', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/v1/evaluations', () => {
    it('creates a run and enqueues evaluation job', async () => {
      mockCreateRun.mockResolvedValueOnce({
        runId: 'run-123',
        status: 'pending',
        queuedAt: '2026-04-24T12:00:00Z',
      });
      mockEnqueueEvaluation.mockResolvedValueOnce('job-456');

      const result = await controller.triggerEvaluation({
        models: [{ provider: 'ollama', modelName: 'llama3' }],
      });

      expect(mockCreateRun).toHaveBeenCalledWith([
        { provider: 'ollama', modelName: 'llama3' },
      ]);
      expect(mockEnqueueEvaluation).toHaveBeenCalledWith(
        expect.objectContaining({
          runId: 'run-123',
          models: [{ provider: 'ollama', modelName: 'llama3' }],
        }),
      );
      expect(result.runId).toBe('run-123');
      expect(result.status).toBe('pending');
    });

    it('rejects empty models array', async () => {
      await expect(
        controller.triggerEvaluation({ models: [] }),
      ).rejects.toMatchObject({
        response: { code: 'MISSING_MODELS' },
      });
    });

    it('rejects missing provider', async () => {
      await expect(
        controller.triggerEvaluation({
          models: [{ provider: '', modelName: 'llama3' }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_MODEL_PROVIDER' },
      });
    });

    it('rejects missing modelName', async () => {
      await expect(
        controller.triggerEvaluation({
          models: [{ provider: 'ollama', modelName: '' }],
        }),
      ).rejects.toMatchObject({
        response: { code: 'INVALID_MODEL_NAME' },
      });
    });
  });
});
