import { Test, TestingModule } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { PrismaService } from '../database/prisma.service';
import { DatasetLoader } from './dataset-loader.service';
import { ScoringService } from './scoring.service';
import { SynthesisWorkflow } from '../agent/synthesis-workflow.service';

describe('EvaluationService', () => {
  let service: EvaluationService;

  const mockPrisma = {
    evaluationRun: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    evaluationResult: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockDatasetLoader = {
    load: jest.fn(),
    getQuestions: jest.fn(),
  };

  const mockScoringService = {
    computeRelevance: jest.fn().mockReturnValue(0.8),
    computeConsistency: jest.fn().mockReturnValue(0.7),
    computeGrounding: jest.fn().mockReturnValue(0.9),
  };

  const mockSynthesisWorkflow = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvaluationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DatasetLoader, useValue: mockDatasetLoader },
        { provide: ScoringService, useValue: mockScoringService },
        { provide: SynthesisWorkflow, useValue: mockSynthesisWorkflow },
      ],
    }).compile();

    service = module.get<EvaluationService>(EvaluationService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('createRun', () => {
    it('creates an evaluation run and returns trigger response', async () => {
      mockDatasetLoader.load.mockReturnValue({ version: '1.0.0' });
      mockPrisma.evaluationRun.create.mockResolvedValue({
        id: 'run-123',
        status: 'pending',
        startedAt: new Date('2026-04-24T12:00:00Z'),
      });

      const result = await service.createRun([
        { provider: 'ollama', modelName: 'llama3' },
      ]);

      expect(result.runId).toBe('run-123');
      expect(result.status).toBe('pending');
      expect(mockPrisma.evaluationRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            datasetVersion: '1.0.0',
            status: 'pending',
          }),
        }),
      );
    });
  });

  describe('executeRun', () => {
    it('runs all questions through the model and saves results', async () => {
      const questions = [
        {
          id: 'q001',
          question: 'What is the policy?',
          expectedAnswer: 'The policy is X.',
          referenceChunks: ['chunk-1'],
          category: 'test',
        },
      ];

      mockDatasetLoader.getQuestions.mockReturnValue(questions);
      mockPrisma.evaluationRun.update.mockResolvedValue({});
      mockPrisma.evaluationResult.create.mockResolvedValue({});
      mockPrisma.evaluationResult.findMany.mockResolvedValue([
        {
          relevanceScore: 0.8,
          consistencyScore: 0.7,
          groundingScore: 0.9,
          latencyMs: 1200,
          tokens: { input: 100, output: 50 },
          generatedAnswer: 'The policy is X.',
        },
      ]);

      mockSynthesisWorkflow.execute.mockResolvedValue({
        content: 'The policy is X.',
        sources: [{ chunkId: 'chunk-1', documentId: 'doc-1', preview: 'The policy', score: 0.95 }],
        classification: 'RAG',
        latencyMs: 1200,
        tokens: { input: 100, output: 50 },
        model: 'llama3',
        provider: 'ollama',
        correlationId: 'eval-run-123-q001-ollama',
      });

      await service.executeRun('run-123', [
        { provider: 'ollama', modelName: 'llama3' },
      ]);

      expect(mockPrisma.evaluationRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'run-123' },
          data: { status: 'running' },
        }),
      );

      expect(mockSynthesisWorkflow.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'What is the policy?',
          options: {
            provider: 'ollama',
            model: 'llama3',
            useCache: false,
          },
        }),
      );

      expect(mockPrisma.evaluationResult.create).toHaveBeenCalled();
      expect(mockPrisma.evaluationRun.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: 'run-123' },
          data: expect.objectContaining({
            status: 'completed',
          }),
        }),
      );
    });

    it('uses eval- correlation id prefix', async () => {
      const questions = [
        {
          id: 'q001',
          question: 'Test?',
          expectedAnswer: 'Yes.',
          referenceChunks: ['chunk-1'],
          category: 'test',
        },
      ];

      mockDatasetLoader.getQuestions.mockReturnValue(questions);
      mockPrisma.evaluationRun.update.mockResolvedValue({});
      mockPrisma.evaluationResult.create.mockResolvedValue({});
      mockPrisma.evaluationResult.findMany.mockResolvedValue([]);

      mockSynthesisWorkflow.execute.mockResolvedValue({
        content: 'Yes.',
        sources: [],
        classification: 'DIRECT',
        latencyMs: 500,
        tokens: { input: 10, output: 5 },
        model: 'llama3',
        provider: 'ollama',
        correlationId: 'eval-run-123-q001-ollama',
      });

      await service.executeRun('run-123', [
        { provider: 'ollama', modelName: 'llama3' },
      ]);

      const call = mockSynthesisWorkflow.execute.mock.calls[0][0];
      expect(call.correlationId).toMatch(/^eval-run-123-q001-ollama/);
    });

    it('continues with remaining questions after a failure', async () => {
      const questions = [
        {
          id: 'q001',
          question: 'Fail?',
          expectedAnswer: 'No.',
          referenceChunks: ['chunk-1'],
          category: 'test',
        },
        {
          id: 'q002',
          question: 'Succeed?',
          expectedAnswer: 'Yes.',
          referenceChunks: ['chunk-2'],
          category: 'test',
        },
      ];

      mockDatasetLoader.getQuestions.mockReturnValue(questions);
      mockPrisma.evaluationRun.update.mockResolvedValue({});
      mockPrisma.evaluationResult.create.mockResolvedValue({});
      mockPrisma.evaluationResult.findMany.mockResolvedValue([
        {
          relevanceScore: 0.5,
          consistencyScore: 0.5,
          groundingScore: 0.5,
          latencyMs: 500,
          tokens: { input: 10, output: 5 },
          generatedAnswer: 'Yes.',
        },
      ]);

      mockSynthesisWorkflow.execute
        .mockRejectedValueOnce(new Error('LLM timeout'))
        .mockResolvedValueOnce({
          content: 'Yes.',
          sources: [{ chunkId: 'chunk-2', documentId: 'doc-1', preview: 'Yes', score: 0.9 }],
          classification: 'DIRECT',
          latencyMs: 500,
          tokens: { input: 10, output: 5 },
          model: 'llama3',
          provider: 'ollama',
          correlationId: 'eval-run-123-q002-ollama',
        });

      await service.executeRun('run-123', [
        { provider: 'ollama', modelName: 'llama3' },
      ]);

      expect(mockSynthesisWorkflow.execute).toHaveBeenCalledTimes(2);
      expect(mockPrisma.evaluationResult.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.evaluationRun.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'completed' }),
        }),
      );
    });
  });

  describe('listRuns', () => {
    it('returns paginated runs ordered by startedAt desc', async () => {
      const runs = [
        { id: 'run-2', status: 'completed' },
        { id: 'run-1', status: 'running' },
      ];
      mockPrisma.evaluationRun.findMany.mockResolvedValueOnce(runs);
      mockPrisma.evaluationRun.count.mockResolvedValueOnce(2);

      const result = await service.listRuns({ limit: 10, offset: 0 });

      expect(mockPrisma.evaluationRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startedAt: 'desc' },
          take: 10,
          skip: 0,
        }),
      );
      expect(result.runs).toEqual(runs);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.offset).toBe(0);
    });

    it('filters by status when provided', async () => {
      mockPrisma.evaluationRun.findMany.mockResolvedValueOnce([]);
      mockPrisma.evaluationRun.count.mockResolvedValueOnce(0);

      await service.listRuns({ status: 'completed' });

      expect(mockPrisma.evaluationRun.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'completed' },
        }),
      );
    });
  });

  describe('getRunById', () => {
    it('returns a run when found', async () => {
      const run = { id: 'run-123', status: 'completed' };
      mockPrisma.evaluationRun.findUnique.mockResolvedValueOnce(run);

      const result = await service.getRunById('run-123');

      expect(mockPrisma.evaluationRun.findUnique).toHaveBeenCalledWith({
        where: { id: 'run-123' },
      });
      expect(result).toEqual(run);
    });

    it('returns null when not found', async () => {
      mockPrisma.evaluationRun.findUnique.mockResolvedValueOnce(null);

      const result = await service.getRunById('missing');

      expect(result).toBeNull();
    });
  });

  describe('getRunResults', () => {
    it('returns paginated results ordered by createdAt asc', async () => {
      const results = [
        { id: 'res-1', questionId: 'q001' },
        { id: 'res-2', questionId: 'q002' },
      ];
      mockPrisma.evaluationResult.findMany.mockResolvedValueOnce(results);
      mockPrisma.evaluationResult.count.mockResolvedValueOnce(2);

      const result = await service.getRunResults({ runId: 'run-123', limit: 10, offset: 0 });

      expect(mockPrisma.evaluationResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { runId: 'run-123' },
          orderBy: { createdAt: 'asc' },
          take: 10,
          skip: 0,
        }),
      );
      expect(result.results).toEqual(results);
      expect(result.total).toBe(2);
    });
  });
});
