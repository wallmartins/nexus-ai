import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILLMProvider,
  PromptContext,
  LlmOptions,
  LlmResponse,
} from '../interfaces/llm-provider.interface';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  stream: false;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
  format?: 'json';
}

interface OllamaGenerateResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}

@Injectable()
export class OllamaProvider implements ILLMProvider {
  readonly providerName = 'ollama';

  constructor(private readonly config: ConfigService) {}

  async generate(
    prompt: PromptContext,
    options: LlmOptions = {},
  ): Promise<LlmResponse> {
    const baseUrl = this.config.getOrThrow<string>('OLLAMA_BASE_URL');
    const model = options.model ?? 'llama3';
    const url = `${baseUrl.replace(/\/$/, '')}/api/generate`;

    const fullPrompt = this.buildPrompt(prompt);

    const body: OllamaGenerateRequest = {
      model,
      prompt: fullPrompt,
      system: prompt.system,
      stream: false,
      options: {
        ...(options.temperature !== undefined && {
          temperature: options.temperature,
        }),
        ...(options.maxTokens !== undefined && {
          num_predict: options.maxTokens,
        }),
      },
      ...(options.jsonMode && { format: 'json' }),
    };

    const start = performance.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => 'unknown error');
        throw new Error(
          `Ollama request failed (${res.status} ${res.statusText}): ${text}`,
        );
      }

      const data = (await res.json()) as OllamaGenerateResponse;
      const latencyMs = Math.round(performance.now() - start);

      return {
        content: data.response.trim(),
        model: data.model,
        provider: this.providerName,
        tokens: {
          input: data.prompt_eval_count ?? this.estimateTokens(fullPrompt),
          output: data.eval_count ?? this.estimateTokens(data.response),
        },
        latencyMs,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TypeError') {
        throw new Error(
          `Ollama connection failed: unable to reach ${url}. ${err.message}`,
        );
      }
      throw err;
    }
  }

  private buildPrompt(context: PromptContext): string {
    const parts: string[] = [];

    if (context.history && context.history.length > 0) {
      for (const msg of context.history) {
        parts.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`);
      }
    }

    parts.push(`User: ${context.user}`);
    parts.push('Assistant:');

    return parts.join('\n\n');
  }

  private estimateTokens(text: string): number {
    // Rough heuristic: ~4 characters per token for English/ASCII text
    return Math.ceil(text.length / 4);
  }
}
