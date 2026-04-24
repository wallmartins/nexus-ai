import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OllamaProvider } from './ollama.provider';

describe('OllamaProvider', () => {
  let provider: OllamaProvider;
  let config: ConfigService;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    mockFetch.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaProvider,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'OLLAMA_BASE_URL') return 'http://localhost:11434';
              throw new Error(`Unknown config key: ${key}`);
            },
          },
        },
      ],
    }).compile();

    provider = module.get<OllamaProvider>(OllamaProvider);
    config = module.get<ConfigService>(ConfigService);
  });

  it('instantiates', () => {
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('ollama');
  });

  describe('generate', () => {
    it('calls Ollama /api/generate with correct payload', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hello!',
          model: 'llama3',
          created_at: '2026-04-24T00:00:00Z',
          done: true,
          prompt_eval_count: 10,
          eval_count: 2,
        }),
      } as Response);

      const result = await provider.generate({ user: 'Hi' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:11434/api/generate');
      expect(init?.method).toBe('POST');

      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('llama3');
      expect(body.prompt).toContain('User: Hi');
      expect(body.stream).toBe(false);
      expect(body.system).toBeUndefined();
    });

    it('includes system prompt when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Understood.',
          model: 'llama3',
          created_at: '2026-04-24T00:00:00Z',
          done: true,
        }),
      } as Response);

      await provider.generate({
        system: 'You are a helpful assistant.',
        user: 'Hello',
      });

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.system).toBe('You are a helpful assistant.');
    });

    it('includes conversation history when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '42',
          model: 'llama3',
          created_at: '2026-04-24T00:00:00Z',
          done: true,
        }),
      } as Response);

      await provider.generate({
        user: 'What is the answer?',
        history: [
          { role: 'user', content: 'What is 6 times 7?' },
          { role: 'assistant', content: 'Let me calculate...' },
        ],
      });

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.prompt).toContain('User: What is 6 times 7?');
      expect(body.prompt).toContain('Assistant: Let me calculate...');
      expect(body.prompt).toContain('User: What is the answer?');
    });

    it('passes options (temperature, maxTokens, jsonMode)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '{}',
          model: 'llama3',
          created_at: '2026-04-24T00:00:00Z',
          done: true,
        }),
      } as Response);

      await provider.generate(
        { user: 'Give me JSON' },
        { temperature: 0.5, maxTokens: 100, jsonMode: true, model: 'mistral' },
      );

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('mistral');
      expect(body.options.temperature).toBe(0.5);
      expect(body.options.num_predict).toBe(100);
      expect(body.format).toBe('json');
    });

    it('returns parsed response with metadata', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '  The answer is 42.  ',
          model: 'llama3',
          created_at: '2026-04-24T00:00:00Z',
          done: true,
          prompt_eval_count: 15,
          eval_count: 5,
        }),
      } as Response);

      const result = await provider.generate({ user: 'What is the answer?' });

      expect(result.content).toBe('The answer is 42.');
      expect(result.model).toBe('llama3');
      expect(result.provider).toBe('ollama');
      expect(result.tokens.input).toBe(15);
      expect(result.tokens.output).toBe(5);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('estimates tokens when Ollama does not return counts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Hi',
          model: 'llama3',
          created_at: '2026-04-24T00:00:00Z',
          done: true,
        }),
      } as Response);

      const result = await provider.generate({ user: 'Hello' });

      expect(result.tokens.input).toBeGreaterThan(0);
      expect(result.tokens.output).toBeGreaterThan(0);
    });

    it('throws on non-ok HTTP response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'model not found',
      } as Response);

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'Ollama request failed (500 Internal Server Error): model not found',
      );
    });

    it('throws on connection failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(provider.generate({ user: 'Test' })).rejects.toThrow(
        'Ollama connection failed',
      );
    });
  });
});
