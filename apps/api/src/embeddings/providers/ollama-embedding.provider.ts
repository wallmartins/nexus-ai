import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../interfaces/embedding-provider.interface';

type OllamaEmbeddingRequest = {
  model: string;
  prompt: string;
};

type OllamaEmbeddingResponse = {
  embedding: number[];
};

function isOllamaEmbeddingResponse(value: unknown): value is OllamaEmbeddingResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return Array.isArray(obj.embedding) && obj.embedding.every((n) => typeof n === 'number');
}

@Injectable()
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly providerName = 'ollama';
  readonly dimension = 768;

  constructor(private readonly config: ConfigService) {}

  async embed(texts: string[], model: string): Promise<number[][]> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    const url = `${baseUrl.replace(/\/$/, '')}/api/embeddings`;

    const embeddings: number[][] = [];

    for (const text of texts) {
      const body: OllamaEmbeddingRequest = {
        model,
        prompt: text,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => 'unknown error');
        throw new Error(
          `Ollama embedding failed (${res.status} ${res.statusText}): ${errText}`,
        );
      }

      const responseBody = await res.json();
      if (!isOllamaEmbeddingResponse(responseBody)) {
        throw new Error('Invalid Ollama embedding response structure');
      }
      embeddings.push(responseBody.embedding);
    }

    return embeddings;
  }
}
