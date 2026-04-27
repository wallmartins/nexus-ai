import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { QueueService } from '../queue/queue.service';

describe('EvaluationController', () => {
  let controller: EvaluationController;

  const mockCreateRun = jest.fn();
  const mockListRuns = jest.fn();
  const mockGetRunById = jest.fn();
  const mockGetRunResults = jest.fn();
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
            listRuns: mockListRuns,
            getRunById: mockGetRunById,
            getRunResults: mockGetRunResults,
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

  describe('GET /api/v1/evaluations', () => {
    it('returns paginated list of runs', async () => {
      const runsResponse = {
        runs: [{ id: 'run-1', status: 'completed' }],
        total: 1,
        limit: 20,
        offset: 0,
      };
      mockListRuns.mockResolvedValueOnce(runsResponse);

      const result = await controller.listRuns();

      expect(mockListRuns).toHaveBeenCalledWith({
        limit: undefined,
        offset: undefined,
        status: undefined,
      });
      expect(result).toEqual(runsResponse);
    });

    it('passes status filter to service', async () => {
      mockListRuns.mockResolvedValueOnce({ runs: [], total: 0, limit: 20, offset: 0 });

      await controller.listRuns('completed', '10', '5');

      expect(mockListRuns).toHaveBeenCalledWith({
        status: 'completed',
        limit: 10,
        offset: 5,
      });
    });
  });

  describe('GET /api/v1/evaluations/:id', () => {
    it('returns a run when found', async () => {
      const run = { id: 'run-123', status: 'completed' };
      mockGetRunById.mockResolvedValueOnce(run);

      const result = await controller.getRun('run-123');

      expect(mockGetRunById).toHaveBeenCalledWith('run-123');
      expect(result).toEqual(run);
    });

    it('throws 404 when run not found', async () => {
      mockGetRunById.mockResolvedValueOnce(null);

      await expect(controller.getRun('non-existent')).rejects.toMatchObject({
        response: { code: 'RUN_NOT_FOUND' },
      });
    });
  });

  describe('GET /api/v1/evaluations/:id/results', () => {
    it('returns results for an existing run', async () => {
      mockGetRunById.mockResolvedValueOnce({ id: 'run-123' });
      const resultsResponse = {
        results: [{ id: 'res-1', questionId: 'q001' }],
        total: 1,
        limit: 50,
        offset: 0,
      };
      mockGetRunResults.mockResolvedValueOnce(resultsResponse);

      const result = await controller.getRunResults('run-123');

      expect(mockGetRunById).toHaveBeenCalledWith('run-123');
      expect(mockGetRunResults).toHaveBeenCalledWith({
        runId: 'run-123',
        limit: undefined,
        offset: undefined,
      });
      expect(result).toEqual(resultsResponse);
    });

    it('throws 404 when run not found', async () => {
      mockGetRunById.mockResolvedValueOnce(null);

      await expect(
        controller.getRunResults('non-existent'),
      ).rejects.toMatchObject({
        response: { code: 'RUN_NOT_FOUND' },
      });
    });
  });
});
