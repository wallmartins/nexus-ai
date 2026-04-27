import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../database/prisma.service';
import { SynthesisWorkflow } from '../agent/synthesis-workflow.service';
import { MemoryService } from '../memory/memory.service';
import { LoggerService } from '../observability/logger.service';
import { CorrelationService } from '../observability/correlation.service';
import { GuardrailService } from '../llm/guardrails/guardrail.service';
import { ChatMessageRequest } from './chat.types';
import { BadRequestException } from '@nestjs/common';

describe('ChatService', () => {
  let service: ChatService;

  const prismaService = {
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  };

  const synthesisWorkflow = {
    execute: jest.fn(),
  };

  const memoryService = {
    addMessage: jest.fn(),
  };

  const loggerService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const correlationService = {
    getCorrelationId: jest.fn(),
  };

  const guardrailService = {
    validateInput: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    guardrailService.validateInput.mockImplementation(() => {
      // default: pass through
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prismaService },
        { provide: SynthesisWorkflow, useValue: synthesisWorkflow },
        { provide: MemoryService, useValue: memoryService },
        { provide: LoggerService, useValue: loggerService },
        { provide: CorrelationService, useValue: correlationService },
        { provide: GuardrailService, useValue: guardrailService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('should process a new chat message and return assistant response', async () => {
      const request: ChatMessageRequest = {
        message: 'What is the refund policy?',
      };

      correlationService.getCorrelationId.mockReturnValue('corr-123');

      prismaService.session.create.mockResolvedValue({ id: 'session-1' });

      prismaService.message.create
        .mockResolvedValueOnce({ id: 'msg-user-1' })
        .mockResolvedValueOnce({ id: 'msg-assistant-1' });

      synthesisWorkflow.execute.mockResolvedValue({
        content: 'You can request a refund within 30 days [1].',
        sources: [
          {
            chunkId: 'chunk-1',
            documentId: 'doc-1',
            preview: 'Refunds are allowed within 30 days.',
            score: 0.92,
          },
        ],
        classification: 'RAG',
        latencyMs: 1450,
        tokens: { input: 420, output: 110 },
        model: 'llama3',
        provider: 'ollama',
        correlationId: 'corr-123',
      });

      const result = await service.sendMessage(request);

      expect(result.sessionId).toBe('session-1');
      expect(result.messageId).toBe('msg-assistant-1');
      expect(result.role).toBe('assistant');
      expect(result.content).toBe('You can request a refund within 30 days [1].');
      expect(result.sources).toHaveLength(1);
      expect(result.latencyMs).toBe(1450);
      expect(result.tokens).toEqual({ input: 420, output: 110 });
      expect(result.correlationId).toBe('corr-123');

      expect(guardrailService.validateInput).toHaveBeenCalledWith(request.message);
      expect(prismaService.session.create).toHaveBeenCalled();
      expect(prismaService.message.create).toHaveBeenCalledTimes(2);
      expect(synthesisWorkflow.execute).toHaveBeenCalledWith({
        query: request.message,
        sessionId: 'session-1',
        correlationId: 'corr-123',
        options: undefined,
      });
      expect(memoryService.addMessage).toHaveBeenCalledTimes(2);
    });

    it('should reuse existing sessionId when provided', async () => {
      const request: ChatMessageRequest = {
        sessionId: 'existing-session',
        message: 'Tell me more',
      };

      correlationService.getCorrelationId.mockReturnValue('corr-456');

      prismaService.message.create
        .mockResolvedValueOnce({ id: 'msg-user-2' })
        .mockResolvedValueOnce({ id: 'msg-assistant-2' });

      synthesisWorkflow.execute.mockResolvedValue({
        content: 'Here is more information.',
        sources: [],
        classification: 'DIRECT',
        latencyMs: 300,
        tokens: { input: 20, output: 8 },
        model: 'llama3',
        provider: 'ollama',
        correlationId: 'corr-456',
      });

      const result = await service.sendMessage(request);

      expect(result.sessionId).toBe('existing-session');
      expect(prismaService.session.create).not.toHaveBeenCalled();
      expect(synthesisWorkflow.execute).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: 'existing-session' }),
      );
    });

    it('should pass options to synthesis workflow', async () => {
      const request: ChatMessageRequest = {
        message: 'Hello',
        options: {
          provider: 'openai',
          model: 'gpt-4o',
          useCache: false,
        },
      };

      correlationService.getCorrelationId.mockReturnValue('corr-789');
      prismaService.session.create.mockResolvedValue({ id: 'session-opt' });

      prismaService.message.create
        .mockResolvedValueOnce({ id: 'msg-user-3' })
        .mockResolvedValueOnce({ id: 'msg-assistant-3' });

      synthesisWorkflow.execute.mockResolvedValue({
        content: 'Hello from OpenAI!',
        sources: [],
        classification: 'DIRECT',
        latencyMs: 400,
        tokens: { input: 10, output: 5 },
        model: 'gpt-4o',
        provider: 'openai',
        correlationId: 'corr-789',
      });

      await service.sendMessage(request);

      expect(synthesisWorkflow.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            provider: 'openai',
            model: 'gpt-4o',
            useCache: false,
          },
        }),
      );
    });

    it('should throw when guardrail rejects input', async () => {
      const request: ChatMessageRequest = {
        message: '',
      };

      guardrailService.validateInput.mockImplementation(() => {
        throw new BadRequestException({
          code: 'GUARDRAIL_EMPTY_INPUT',
          message: 'Input cannot be empty',
        });
      });

      await expect(service.sendMessage(request)).rejects.toThrow(
        BadRequestException,
      );

      expect(prismaService.message.create).not.toHaveBeenCalled();
      expect(synthesisWorkflow.execute).not.toHaveBeenCalled();
    });

    it('should generate correlationId when not present in context', async () => {
      const request: ChatMessageRequest = {
        message: 'Hello',
      };

      correlationService.getCorrelationId.mockReturnValue(undefined);
      prismaService.session.create.mockResolvedValue({ id: 'session-gen' });

      prismaService.message.create
        .mockResolvedValueOnce({ id: 'msg-user-4' })
        .mockResolvedValueOnce({ id: 'msg-assistant-4' });

      synthesisWorkflow.execute.mockResolvedValue({
        content: 'Hi!',
        sources: [],
        classification: 'DIRECT',
        latencyMs: 200,
        tokens: { input: 5, output: 3 },
        model: 'llama3',
        provider: 'ollama',
        correlationId: 'generated-corr-id',
      });

      const result = await service.sendMessage(request);

      expect(result.correlationId).toBeDefined();
      expect(result.correlationId.length).toBeGreaterThan(0);
    });
  });

  describe('getSessionMessages', () => {
    it('should return messages ordered by createdAt asc', async () => {
      prismaService.message.findMany.mockResolvedValue([
        {
          id: 'msg-1',
          role: 'user',
          content: 'Question?',
          sources: [],
          latencyMs: null,
          tokens: {},
          correlationId: 'corr-a',
          modelProvider: '',
          modelName: '',
          createdAt: new Date('2026-01-01T10:00:00Z'),
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Answer.',
          sources: [
            {
              chunkId: 'chunk-1',
              documentId: 'doc-1',
              preview: 'Preview',
              score: 0.9,
            },
          ],
          latencyMs: 1000,
          tokens: { input: 100, output: 20 },
          correlationId: 'corr-b',
          modelProvider: 'ollama',
          modelName: 'llama3',
          createdAt: new Date('2026-01-01T10:00:01Z'),
        },
      ]);

      const result = await service.getSessionMessages('session-1');

      expect(result).toHaveLength(2);
      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
      expect(result[1].sources).toHaveLength(1);
      expect(result[1].latencyMs).toBe(1000);

      expect(prismaService.message.findMany).toHaveBeenCalledWith({
        where: { sessionId: 'session-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return empty array when session has no messages', async () => {
      prismaService.message.findMany.mockResolvedValue([]);

      const result = await service.getSessionMessages('empty-session');

      expect(result).toEqual([]);
    });
  });
});
