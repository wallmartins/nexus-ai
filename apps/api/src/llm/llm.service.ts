import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILLMProvider,
  PromptContext,
  LlmOptions,
  LlmResponse,
} from './interfaces/llm-provider.interface';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { LoggerService } from '../observability/logger.service';
import { CorrelationService } from '../observability/correlation.service';

export type LlmCallInput = {
  prompt: PromptContext;
  options?: LlmOptions;
  providerName?: string;
  correlationId?: string;
};

@Injectable()
export class LlmService {
  constructor(
    private readonly config: ConfigService,
    private readonly ollamaProvider: OllamaProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly logger: LoggerService,
    private readonly correlationService: CorrelationService,
  ) {}

  async generate(input: LlmCallInput): Promise<LlmResponse> {
    const provider = this.resolveProvider(input.providerName);
    const correlationId =
      input.correlationId ?? this.correlationService.getCorrelationId() ?? 'unknown';

    this.logger.info('LLM request dispatching', {
      service: 'llm-service',
      eventType: 'llm.request',
      correlationId,
      provider: provider.providerName,
      model: input.options?.model,
      promptPreview: this.truncatePreview(
        input.prompt.system ?? '' + input.prompt.user,
      ),
    });

    try {
      const result = await provider.generate(input.prompt, input.options);

      this.logger.info('LLM response received', {
        service: 'llm-service',
        eventType: 'llm.response',
        correlationId,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
        tokens: result.tokens,
        responsePreview: this.truncatePreview(result.content),
      });

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      this.logger.error('LLM call failed', error, {
        service: 'llm-service',
        eventType: 'llm.error',
        correlationId,
        provider: provider.providerName,
        model: input.options?.model,
      });

      throw err;
    }
  }

  private resolveProvider(providerName?: string): ILLMProvider {
    switch (providerName) {
      case 'openai':
        return this.openAiProvider;
      case 'anthropic':
        return this.anthropicProvider;
      case 'ollama':
      default:
        return this.ollamaProvider;
    }
  }

  private truncatePreview(text: string, maxLength = 200): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '…';
  }
}
