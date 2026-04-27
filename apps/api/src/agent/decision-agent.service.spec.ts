import { Test, TestingModule } from '@nestjs/testing';
import { DecisionAgent } from './decision-agent.service';
import { OllamaProvider } from '../llm/providers/ollama.provider';
import { OpenAiProvider } from '../llm/providers/openai.provider';
import { AnthropicProvider } from '../llm/providers/anthropic.provider';
import { SettingsService } from '../settings/settings.service';
import { LoggerService } from '../observability/logger.service';

describe('DecisionAgent', () => {
  let agent: DecisionAgent;
  let ollamaProvider: OllamaProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionAgent,
        {
          provide: OllamaProvider,
          useValue: {
            providerName: 'ollama',
            generate: jest.fn(),
          },
        },
        {
          provide: OpenAiProvider,
          useValue: {
            providerName: 'openai',
            generate: jest.fn(),
          },
        },
        {
          provide: AnthropicProvider,
          useValue: {
            providerName: 'anthropic',
            generate: jest.fn(),
          },
        },
        {
          provide: SettingsService,
          useValue: {
            getSettings: jest.fn().mockReturnValue({ llmProvider: 'ollama' }),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            info: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    agent = module.get<DecisionAgent>(DecisionAgent);
    ollamaProvider = module.get<OllamaProvider>(OllamaProvider);
  });

  it('instantiates', () => {
    expect(agent).toBeDefined();
  });

  describe('invoke', () => {
    it('classifies factual query as RAG', async () => {
      (ollamaProvider.generate as jest.Mock).mockResolvedValue({
        content: 'RAG',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 20, output: 1 },
        latencyMs: 150,
      });

      const result = await agent.invoke(
        'What is our refund policy?',
        'corr-123',
      );

      expect(result.classification).toBe('RAG');
      expect(result.query).toBe('What is our refund policy?');
      expect(result.correlationId).toBe('corr-123');
    });

    it('classifies greeting as DIRECT', async () => {
      (ollamaProvider.generate as jest.Mock).mockResolvedValue({
        content: 'DIRECT',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 15, output: 1 },
        latencyMs: 120,
      });

      const result = await agent.invoke('hello', 'corr-456');

      expect(result.classification).toBe('DIRECT');
    });

    it('handles lowercase classification response', async () => {
      (ollamaProvider.generate as jest.Mock).mockResolvedValue({
        content: '  rag  ',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 15, output: 1 },
        latencyMs: 120,
      });

      const result = await agent.invoke('test', 'corr-789');

      expect(result.classification).toBe('RAG');
    });

    it('falls back to RAG on unknown classification', async () => {
      (ollamaProvider.generate as jest.Mock).mockResolvedValue({
        content: 'MAYBE',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 15, output: 1 },
        latencyMs: 120,
      });

      const result = await agent.invoke('test', 'corr-abc');

      expect(result.classification).toBe('RAG');
    });

    it('falls back to RAG on provider error', async () => {
      (ollamaProvider.generate as jest.Mock).mockRejectedValue(
        new Error('Connection timeout'),
      );

      const result = await agent.invoke('test', 'corr-def');

      expect(result.classification).toBe('RAG');
    });

    it('uses correct system prompt for classification', async () => {
      const generateMock = ollamaProvider.generate as jest.Mock;
      generateMock.mockResolvedValue({
        content: 'DIRECT',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 20, output: 1 },
        latencyMs: 150,
      });

      await agent.invoke('Hi there', 'corr-ghi');

      expect(generateMock).toHaveBeenCalledTimes(1);
      const [prompt, options] = generateMock.mock.calls[0];
      expect(prompt.system).toContain('query classifier');
      expect(prompt.user).toBe('Query: Hi there');
      expect(options.temperature).toBe(0.1);
      expect(options.maxTokens).toBe(10);
    });

    it('logs classification step with correlation ID', async () => {
      const logger = (agent as unknown as { logger: { info: jest.Mock } }).logger;
      (ollamaProvider.generate as jest.Mock).mockResolvedValue({
        content: 'RAG',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 20, output: 1 },
        latencyMs: 150,
      });

      await agent.invoke('question', 'corr-log');

      const classifyLog = logger.info.mock.calls.find(
        (call: [string, Record<string, unknown>]) =>
          call[1]?.step === 'classify' && call[1]?.eventType === 'agent.step',
      );
      expect(classifyLog).toBeDefined();
      expect(classifyLog[1].correlationId).toBe('corr-log');
    });
  });
});
