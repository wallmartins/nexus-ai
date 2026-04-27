import { Test, TestingModule } from '@nestjs/testing';
import { SynthesisWorkflow } from './synthesis-workflow.service';
import { DecisionAgent } from './decision-agent.service';
import { RetrievalService } from '../rag/retrieval.service';
import { PromptManager } from '../llm/prompts/prompt-manager.service';
import { GuardrailService } from '../llm/guardrails/guardrail.service';
import { MemoryService } from '../memory/memory.service';
import { CacheService } from '../memory/cache.service';
import { SettingsService } from '../settings/settings.service';
import { LoggerService } from '../observability/logger.service';
import { LlmService } from '../llm/llm.service';
import { SynthesisInput } from './agent.types';
import { RetrievedChunk } from '../rag/rag.types';

describe('SynthesisWorkflow', () => {
  let workflow: SynthesisWorkflow;

  const decisionAgent = {
    invoke: jest.fn(),
  };

  const retrievalService = {
    retrieve: jest.fn(),
  };

  const promptManager = {
    compose: jest.fn(),
  };

  const guardrailService = {
    validateInput: jest.fn(),
    validateOutput: jest.fn(),
    validateOutputWithRetry: jest.fn(),
  };

  const memoryService = {
    getContext: jest.fn(),
  };

  const cacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const settingsService = {
    getSettings: jest.fn().mockReturnValue({
      llmProvider: 'ollama',
      llmModel: 'llama3',
      retrievalTopK: 5,
      useMMR: false,
    }),
  };

  const loggerService = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  const llmService = {
    generate: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SynthesisWorkflow,
        { provide: DecisionAgent, useValue: decisionAgent },
        { provide: RetrievalService, useValue: retrievalService },
        { provide: PromptManager, useValue: promptManager },
        { provide: GuardrailService, useValue: guardrailService },
        { provide: MemoryService, useValue: memoryService },
        { provide: CacheService, useValue: cacheService },
        { provide: SettingsService, useValue: settingsService },
        { provide: LoggerService, useValue: loggerService },
        { provide: LlmService, useValue: llmService },
      ],
    }).compile();

    workflow = module.get<SynthesisWorkflow>(SynthesisWorkflow);
  });

  it('should be defined', () => {
    expect(workflow).toBeDefined();
  });

  describe('RAG path with retrieved chunks', () => {
    it('should return synthesized answer with sources', async () => {
      const input: SynthesisInput = {
        query: 'What is the refund policy?',
        correlationId: 'corr-123',
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'RAG',
        correlationId: input.correlationId,
      });

      const chunks: RetrievedChunk[] = [
        {
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          content: 'Refunds are allowed within 30 days.',
          index: 0,
          metadata: {},
          score: 0.92,
          modelName: 'nomic-embed-text',
        },
      ];

      retrievalService.retrieve.mockResolvedValue(chunks);
      cacheService.get.mockResolvedValue(null);

      promptManager.compose.mockReturnValue({
        system: 'You are a precise knowledge assistant.',
        user: 'Question: What is the refund policy?\n\nContext:\n[1] Refunds are allowed within 30 days.',
      });

      llmService.generate.mockResolvedValue({
        content: 'You can request a refund within 30 days [1].',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 120, output: 15 },
        latencyMs: 800,
      });

      const result = await workflow.execute(input);

      expect(result.classification).toBe('RAG');
      expect(result.content).toBe('You can request a refund within 30 days [1].');
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].chunkId).toBe('chunk-1');
      expect(result.sources[0].preview).toBe('Refunds are allowed within 30 days.');
      expect(result.tokens).toEqual({ input: 120, output: 15 });
      expect(result.correlationId).toBe('corr-123');
      expect(result.provider).toBe('ollama');

      expect(retrievalService.retrieve).toHaveBeenCalledWith({ query: input.query });
      expect(promptManager.compose).toHaveBeenCalledWith(
        'rag-synthesis',
        expect.objectContaining({
          userQuery: input.query,
          retrievedContext: '[1] Refunds are allowed within 30 days.',
        }),
      );
      expect(cacheService.set).toHaveBeenCalled();
    });
  });

  describe('RAG path with zero chunks', () => {
    it('should return no-context message when retrieval returns empty', async () => {
      const input: SynthesisInput = {
        query: 'What is the refund policy?',
        correlationId: 'corr-456',
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'RAG',
        correlationId: input.correlationId,
      });

      retrievalService.retrieve.mockResolvedValue([]);

      const result = await workflow.execute(input);

      expect(result.classification).toBe('RAG');
      expect(result.content).toContain('could not find any relevant context');
      expect(result.sources).toHaveLength(0);
      expect(result.tokens).toEqual({ input: 0, output: 0 });
      expect(result.model).toBe('');
      expect(result.provider).toBe('');

      expect(retrievalService.retrieve).toHaveBeenCalled();
      expect(llmService.generate).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('DIRECT path', () => {
    it('should skip retrieval and return direct answer', async () => {
      const input: SynthesisInput = {
        query: 'Hello!',
        correlationId: 'corr-789',
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'DIRECT',
        correlationId: input.correlationId,
      });

      cacheService.get.mockResolvedValue(null);

      promptManager.compose.mockReturnValue({
        system: 'You are a helpful assistant.',
        user: 'Hello!',
      });

      llmService.generate.mockResolvedValue({
        content: 'Hello! How can I help you today?',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 10, output: 8 },
        latencyMs: 300,
      });

      const result = await workflow.execute(input);

      expect(result.classification).toBe('DIRECT');
      expect(result.content).toBe('Hello! How can I help you today?');
      expect(result.sources).toHaveLength(0);
      expect(retrievalService.retrieve).not.toHaveBeenCalled();
      expect(promptManager.compose).toHaveBeenCalledWith(
        'direct-answer',
        expect.objectContaining({ userQuery: input.query }),
      );
    });
  });

  describe('Cache behavior', () => {
    it('should return cached response on cache hit', async () => {
      const input: SynthesisInput = {
        query: 'What is the refund policy?',
        correlationId: 'corr-cache',
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'RAG',
        correlationId: input.correlationId,
      });

      const chunks: RetrievedChunk[] = [
        {
          chunkId: 'chunk-1',
          documentId: 'doc-1',
          content: 'Refunds are allowed within 30 days.',
          index: 0,
          metadata: {},
          score: 0.92,
          modelName: 'nomic-embed-text',
        },
      ];

      retrievalService.retrieve.mockResolvedValue(chunks);

      cacheService.get.mockResolvedValue({
        content: 'Cached answer [1].',
        sources: [
          {
            chunkId: 'chunk-1',
            documentId: 'doc-1',
            preview: 'Refunds are allowed within 30 days.',
            score: 0.92,
          },
        ],
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 100, output: 10 },
        latencyMs: 50,
        cached: true,
      });

      const result = await workflow.execute(input);

      expect(result.content).toBe('Cached answer [1].');
      expect(llmService.generate).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });

    it('should bypass cache when useCache is false', async () => {
      const input: SynthesisInput = {
        query: 'What is the refund policy?',
        correlationId: 'corr-nocache',
        options: { useCache: false },
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'DIRECT',
        correlationId: input.correlationId,
      });

      promptManager.compose.mockReturnValue({
        system: 'You are a helpful assistant.',
        user: 'What is the refund policy?',
      });

      llmService.generate.mockResolvedValue({
        content: 'Direct answer.',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 10, output: 3 },
        latencyMs: 200,
      });

      const result = await workflow.execute(input);

      expect(result.content).toBe('Direct answer.');
      expect(cacheService.get).not.toHaveBeenCalled();
      expect(cacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('Provider resolution', () => {
    it('should use OpenAI when provider option is openai', async () => {
      const input: SynthesisInput = {
        query: 'Hello!',
        correlationId: 'corr-openai',
        options: { provider: 'openai', model: 'gpt-4o' },
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'DIRECT',
        correlationId: input.correlationId,
      });

      cacheService.get.mockResolvedValue(null);

      promptManager.compose.mockReturnValue({
        system: 'You are a helpful assistant.',
        user: 'Hello!',
      });

      llmService.generate.mockResolvedValue({
        content: 'Hello from OpenAI!',
        model: 'gpt-4o',
        provider: 'openai',
        tokens: { input: 10, output: 5 },
        latencyMs: 400,
      });

      const result = await workflow.execute(input);

      expect(result.provider).toBe('openai');
      expect(result.model).toBe('gpt-4o');
      expect(llmService.generate).toHaveBeenCalled();
    });
  });

  describe('Session memory injection', () => {
    it('should inject memory history into prompt context', async () => {
      const input: SynthesisInput = {
        query: 'Tell me more',
        sessionId: 'session-1',
        correlationId: 'corr-memory',
      };

      memoryService.getContext.mockResolvedValue({
        messages: [
          { role: 'user', content: 'What is the policy?', timestamp: 1 },
          { role: 'assistant', content: 'Here is the policy.', timestamp: 2 },
        ],
      });

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'DIRECT',
        correlationId: input.correlationId,
      });

      cacheService.get.mockResolvedValue(null);

      promptManager.compose.mockReturnValue({
        system: 'You are a helpful assistant.',
        user: 'Tell me more',
        history: [
          { role: 'user', content: 'What is the policy?' },
          { role: 'assistant', content: 'Here is the policy.' },
        ],
      });

      llmService.generate.mockResolvedValue({
        content: 'Sure, here is more info.',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 20, output: 6 },
        latencyMs: 300,
      });

      await workflow.execute(input);

      expect(memoryService.getContext).toHaveBeenCalledWith('session-1');
      expect(promptManager.compose).toHaveBeenCalledWith(
        'direct-answer',
        expect.objectContaining({
          userQuery: input.query,
          history: [
            { role: 'user', content: 'What is the policy?' },
            { role: 'assistant', content: 'Here is the policy.' },
          ],
        }),
      );
    });
  });

  describe('Error handling', () => {
    it('should throw when LLM returns empty content', async () => {
      const input: SynthesisInput = {
        query: 'Hello!',
        correlationId: 'corr-empty',
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'DIRECT',
        correlationId: input.correlationId,
      });

      cacheService.get.mockResolvedValue(null);

      promptManager.compose.mockReturnValue({
        system: 'You are a helpful assistant.',
        user: 'Hello!',
      });

      llmService.generate.mockResolvedValue({
        content: '',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 5, output: 0 },
        latencyMs: 200,
      });

      await expect(workflow.execute(input)).rejects.toThrow(
        'LLM returned empty response after synthesis',
      );
    });
  });

  describe('Logging', () => {
    it('should log workflow start, steps, and completion', async () => {
      const input: SynthesisInput = {
        query: 'Hello!',
        correlationId: 'corr-log',
      };

      decisionAgent.invoke.mockResolvedValue({
        query: input.query,
        classification: 'DIRECT',
        correlationId: input.correlationId,
      });

      cacheService.get.mockResolvedValue(null);

      promptManager.compose.mockReturnValue({
        system: 'You are a helpful assistant.',
        user: 'Hello!',
      });

      llmService.generate.mockResolvedValue({
        content: 'Hi there!',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 5, output: 3 },
        latencyMs: 200,
      });

      await workflow.execute(input);

      expect(loggerService.info).toHaveBeenCalledWith(
        'Synthesis workflow started',
        expect.objectContaining({ correlationId: 'corr-log', service: 'synthesis-workflow', eventType: 'workflow.start' }),
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        'Synthesis workflow classified',
        expect.objectContaining({ correlationId: 'corr-log', service: 'synthesis-workflow', eventType: 'workflow.step', step: 'classify' }),
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        'Synthesis workflow completed',
        expect.objectContaining({ correlationId: 'corr-log', service: 'synthesis-workflow', eventType: 'workflow.complete', step: 'format' }),
      );
    });
  });
});
