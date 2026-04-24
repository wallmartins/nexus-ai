import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OllamaEmbeddingProvider } from './ollama-embedding.provider';

describe('OllamaEmbeddingProvider', () => {
  let provider: OllamaEmbeddingProvider;

  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  beforeEach(async () => {
    mockFetch.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaEmbeddingProvider,
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

    provider = module.get<OllamaEmbeddingProvider>(OllamaEmbeddingProvider);
  });

  it('instantiates', () => {
    expect(provider).toBeDefined();
    expect(provider.providerName).toBe('ollama');
    expect(provider.dimension).toBe(768);
  });

  describe('embed', () => {
    it('calls Ollama /api/embeddings for each text', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ embedding: [0.1, 0.2, 0.3] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ embedding: [0.4, 0.5, 0.6] }),
        } as Response);

      const result = await provider.embed(['Hello', 'World'], 'nomic-embed-text');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
      ]);

      const [, init] = mockFetch.mock.calls[0];
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('nomic-embed-text');
      expect(body.prompt).toBe('Hello');
    });

    it('throws on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'model not found',
      } as Response);

      await expect(provider.embed(['test'], 'unknown-model')).rejects.toThrow(
        'Ollama embedding failed (500 Internal Server Error): model not found',
      );
    });
  });
});
