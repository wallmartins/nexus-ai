import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenAiProvider } from './openai.provider';

describe('OpenAiProvider', () => {
  let provider: OpenAiProvider;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    mockFetch.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenAiProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'OPENAI_API_KEY') return 'sk-test-key';
              throw new Error(`Unknown config key: ${key}`);
            },
          },
        },
      ],
    }).compile();

    provider = module.get<OpenAiProvider>(OpenAiProvider);
  });

  it('instantiates', () => {
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('openai');
  });

  describe('generate', () => {
    it('calls OpenAI chat completions with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1714000000,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Hello there!' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 },
        }),
      } as Response);

      const result = await provider.generate({ user: 'Hi' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/chat/completions');
      expect(init?.method).toBe('POST');

      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer sk-test-key');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
      expect(body.temperature).toBeUndefined();
      expect(body.max_tokens).toBeUndefined();

      expect(result.content).toBe('Hello there!');
      expect(result.model).toBe('gpt-4o-mini');
      expect(result.provider).toBe('openai');
      expect(result.tokens.input).toBe(12);
      expect(result.tokens.output).toBe(3);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('includes system prompt and history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-456',
          object: 'chat.completion',
          created: 1714000001,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '42' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 20, completion_tokens: 1, total_tokens: 21 },
        }),
      } as Response);

      await provider.generate({
        system: 'You are a math tutor.',
        user: 'What is 6 times 7?',
        history: [
          { role: 'user', content: 'What is 2 plus 2?' },
          { role: 'assistant', content: 'That is 4.' },
        ],
      });

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.messages).toEqual([
        { role: 'system', content: 'You are a math tutor.' },
        { role: 'user', content: 'What is 2 plus 2?' },
        { role: 'assistant', content: 'That is 4.' },
        { role: 'user', content: 'What is 6 times 7?' },
      ]);
    });

    it('passes options (temperature, maxTokens, jsonMode, model)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-789',
          object: 'chat.completion',
          created: 1714000002,
          model: 'gpt-4o',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '{"answer":42}' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      } as Response);

      await provider.generate(
        { user: 'Give me JSON' },
        { temperature: 0.2, maxTokens: 50, jsonMode: true, model: 'gpt-4o' },
      );

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('gpt-4o');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(50);
      expect(body.response_format).toEqual({ type: 'json_object' });
    });

    it('trims whitespace from response content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-abc',
          object: 'chat.completion',
          created: 1714000003,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: '  Trimmed  ' },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
        }),
      } as Response);

      const result = await provider.generate({ user: 'Test' });

      expect(result.content).toBe('Trimmed');
    });

    it('estimates tokens when usage is missing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-def',
          object: 'chat.completion',
          created: 1714000004,
          model: 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: 'Hi' },
              finish_reason: 'stop',
            },
          ],
        }),
      } as Response);

      const result = await provider.generate({ user: 'Hello' });

      expect(result.tokens.input).toBeGreaterThan(0);
      expect(result.tokens.output).toBeGreaterThan(0);
    });

    it('throws on non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      } as Response);

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'OpenAI request failed (401 Unauthorized): Invalid API key',
      );
    });

    it('throws on invalid response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'data' }),
      } as Response);

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'Invalid OpenAI chat completions response structure',
      );
    });

    it('throws on connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'OpenAI connection failed',
      );
    });
  });
});
