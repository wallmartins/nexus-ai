import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { LoggerService } from '../observability/logger.service';
import { CorrelationService } from '../observability/correlation.service';

describe('LlmService', () => {
  let service: LlmService;

  const ollamaProvider = {
    providerName: 'ollama',
    generate: jest.fn(),
  };

  const openAiProvider = {
    providerName: 'openai',
    generate: jest.fn(),
  };

  const anthropicProvider = {
    providerName: 'anthropic',
    generate: jest.fn(),
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmService,
        { provide: OllamaProvider, useValue: ollamaProvider },
        { provide: OpenAiProvider, useValue: openAiProvider },
        { provide: AnthropicProvider, useValue: anthropicProvider },
        { provide: LoggerService, useValue: loggerService },
        { provide: CorrelationService, useValue: correlationService },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn(() => 'mock-value') },
        },
      ],
    }).compile();

    service = module.get<LlmService>(LlmService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('calls the default (ollama) provider and logs request/response', async () => {
      ollamaProvider.generate.mockResolvedValue({
        content: 'Hello!',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 10, output: 3 },
        latencyMs: 250,
      });

      correlationService.getCorrelationId.mockReturnValue('corr-abc');

      const result = await service.generate({
        prompt: { user: 'Hi' },
        options: { model: 'llama3' },
      });

      expect(ollamaProvider.generate).toHaveBeenCalledWith(
        { user: 'Hi' },
        { model: 'llama3' },
      );
      expect(result.content).toBe('Hello!');
      expect(result.tokens).toEqual({ input: 10, output: 3 });
      expect(result.latencyMs).toBe(250);

      expect(loggerService.info).toHaveBeenCalledWith(
        'LLM request dispatching',
        expect.objectContaining({
          service: 'llm-service',
          eventType: 'llm.request',
          correlationId: 'corr-abc',
          provider: 'ollama',
          model: 'llama3',
        }),
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        'LLM response received',
        expect.objectContaining({
          service: 'llm-service',
          eventType: 'llm.response',
          correlationId: 'corr-abc',
          provider: 'ollama',
          model: 'llama3',
          latencyMs: 250,
          tokens: { input: 10, output: 3 },
        }),
      );
    });

    it('routes to OpenAI when providerName is openai', async () => {
      openAiProvider.generate.mockResolvedValue({
        content: 'Hello from OpenAI',
        model: 'gpt-4o',
        provider: 'openai',
        tokens: { input: 12, output: 4 },
        latencyMs: 400,
      });

      const result = await service.generate({
        prompt: { user: 'Hi' },
        providerName: 'openai',
        options: { model: 'gpt-4o' },
      });

      expect(openAiProvider.generate).toHaveBeenCalled();
      expect(ollamaProvider.generate).not.toHaveBeenCalled();
      expect(result.provider).toBe('openai');
    });

    it('routes to Anthropic when providerName is anthropic', async () => {
      anthropicProvider.generate.mockResolvedValue({
        content: 'Hello from Claude',
        model: 'claude-3-sonnet',
        provider: 'anthropic',
        tokens: { input: 8, output: 3 },
        latencyMs: 350,
      });

      const result = await service.generate({
        prompt: { user: 'Hi' },
        providerName: 'anthropic',
      });

      expect(anthropicProvider.generate).toHaveBeenCalled();
      expect(ollamaProvider.generate).not.toHaveBeenCalled();
      expect(result.provider).toBe('anthropic');
    });

    it('uses provided correlationId over context', async () => {
      ollamaProvider.generate.mockResolvedValue({
        content: 'Ok',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 5, output: 1 },
        latencyMs: 100,
      });

      correlationService.getCorrelationId.mockReturnValue('context-corr');

      await service.generate({
        prompt: { user: 'Test' },
        correlationId: 'explicit-corr',
      });

      expect(loggerService.info).toHaveBeenCalledWith(
        'LLM request dispatching',
        expect.objectContaining({ correlationId: 'explicit-corr' }),
      );
    });

    it('falls back to "unknown" when no correlationId is available', async () => {
      ollamaProvider.generate.mockResolvedValue({
        content: 'Ok',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 5, output: 1 },
        latencyMs: 100,
      });

      correlationService.getCorrelationId.mockReturnValue(undefined);

      await service.generate({
        prompt: { user: 'Test' },
      });

      expect(loggerService.info).toHaveBeenCalledWith(
        'LLM request dispatching',
        expect.objectContaining({ correlationId: 'unknown' }),
      );
    });

    it('logs error and re-throws when provider fails', async () => {
      const error = new Error('Provider timeout');
      ollamaProvider.generate.mockRejectedValue(error);

      correlationService.getCorrelationId.mockReturnValue('corr-err');

      await expect(
        service.generate({
          prompt: { user: 'Test' },
          options: { model: 'llama3' },
        }),
      ).rejects.toThrow('Provider timeout');

      expect(loggerService.error).toHaveBeenCalledWith(
        'LLM call failed',
        error,
        expect.objectContaining({
          service: 'llm-service',
          eventType: 'llm.error',
          correlationId: 'corr-err',
          provider: 'ollama',
          model: 'llama3',
        }),
      );
    });

    it('truncates long prompt previews in logs', async () => {
      ollamaProvider.generate.mockResolvedValue({
        content: 'Short',
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 500, output: 1 },
        latencyMs: 100,
      });

      const longPrompt = 'a'.repeat(500);
      await service.generate({
        prompt: { user: longPrompt },
      });

      const dispatchCall = loggerService.info.mock.calls.find(
        (call) => call[0] === 'LLM request dispatching',
      );
      expect(dispatchCall).toBeDefined();
      const preview = dispatchCall[1].promptPreview as string;
      expect(preview.length).toBeLessThanOrEqual(201);
      expect(preview.endsWith('…')).toBe(true);
    });

    it('truncates long response previews in logs', async () => {
      ollamaProvider.generate.mockResolvedValue({
        content: 'b'.repeat(500),
        model: 'llama3',
        provider: 'ollama',
        tokens: { input: 10, output: 125 },
        latencyMs: 100,
      });

      await service.generate({
        prompt: { user: 'Hi' },
      });

      const responseCall = loggerService.info.mock.calls.find(
        (call) => call[0] === 'LLM response received',
      );
      expect(responseCall).toBeDefined();
      const preview = responseCall[1].responsePreview as string;
      expect(preview.length).toBeLessThanOrEqual(201);
      expect(preview.endsWith('…')).toBe(true);
    });
  });
});
