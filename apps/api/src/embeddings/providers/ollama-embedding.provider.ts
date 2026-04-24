import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingProvider } from '../interfaces/embedding-provider.interface';

interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
}

interface OllamaEmbeddingResponse {
  embedding: number[];
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

      const data = (await res.json()) as OllamaEmbeddingResponse;
      embeddings.push(data.embedding);
    }

    return embeddings;
  }
}
