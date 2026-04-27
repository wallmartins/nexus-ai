import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnthropicProvider } from './anthropic.provider';

describe('AnthropicProvider', () => {
  let provider: AnthropicProvider;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    mockFetch.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnthropicProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'ANTHROPIC_API_KEY') return 'sk-ant-test-key';
              throw new Error(`Unknown config key: ${key}`);
            },
          },
        },
      ],
    }).compile();

    provider = module.get<AnthropicProvider>(AnthropicProvider);
  });

  it('instantiates', () => {
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('anthropic');
  });

  describe('generate', () => {
    it('calls Anthropic messages API with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_01X',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet-20240229',
          content: [{ type: 'text', text: 'Hello there!' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 12, output_tokens: 3 },
        }),
      } as Response);

      const result = await provider.generate({ user: 'Hi' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.anthropic.com/v1/messages');
      expect(init?.method).toBe('POST');

      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['x-api-key']).toBe('sk-ant-test-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
      expect(headers['Content-Type']).toBe('application/json');

      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('claude-3-sonnet-20240229');
      expect(body.messages).toEqual([{ role: 'user', content: 'Hi' }]);
      expect(body.max_tokens).toBe(1024);
      expect(body.temperature).toBeUndefined();
      expect(body.system).toBeUndefined();

      expect(result.content).toBe('Hello there!');
      expect(result.model).toBe('claude-3-sonnet-20240229');
      expect(result.provider).toBe('anthropic');
      expect(result.tokens.input).toBe(12);
      expect(result.tokens.output).toBe(3);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('includes system prompt and history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_02Y',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet-20240229',
          content: [{ type: 'text', text: '42' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 20, output_tokens: 1 },
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
      expect(body.system).toBe('You are a math tutor.');
      expect(body.messages).toEqual([
        { role: 'user', content: 'What is 2 plus 2?' },
        { role: 'assistant', content: 'That is 4.' },
        { role: 'user', content: 'What is 6 times 7?' },
      ]);
    });

    it('passes options (temperature, maxTokens, model)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_03Z',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-opus-20240229',
          content: [{ type: 'text', text: 'Opus reply' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      } as Response);

      await provider.generate(
        { user: 'Give me a reply' },
        { temperature: 0.2, maxTokens: 50, model: 'claude-3-opus-20240229' },
      );

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('claude-3-opus-20240229');
      expect(body.temperature).toBe(0.2);
      expect(body.max_tokens).toBe(50);
    });

    it('trims whitespace from response content', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'msg_04A',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-sonnet-20240229',
          content: [{ type: 'text', text: '  Trimmed  ' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 5, output_tokens: 2 },
        }),
      } as Response);

      const result = await provider.generate({ user: 'Test' });

      expect(result.content).toBe('Trimmed');
    });

    it('throws on non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      } as Response);

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'Anthropic request failed (401 Unauthorized): Invalid API key',
      );
    });

    it('throws on invalid response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'data' }),
      } as Response);

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'Invalid Anthropic messages response structure',
      );
    });

    it('throws on connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'Anthropic connection failed',
      );
    });
  });
});
