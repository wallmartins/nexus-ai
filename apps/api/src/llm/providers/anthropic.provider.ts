import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILLMProvider,
  PromptContext,
  LlmOptions,
  LlmResponse,
} from '../interfaces/llm-provider.interface';

type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AnthropicContentBlock = {
  type: 'text';
  text: string;
};

type AnthropicRequest = {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  system?: string;
  temperature?: number;
};

type AnthropicResponse = {
  id: string;
  type: string;
  role: string;
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
};

function isAnthropicResponse(value: unknown): value is AnthropicResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.content) || obj.content.length === 0) return false;
  const firstBlock = obj.content[0] as Record<string, unknown>;
  if (typeof firstBlock.text !== 'string') return false;
  if (
    typeof obj.usage !== 'object' ||
    obj.usage === null ||
    typeof (obj.usage as Record<string, unknown>).input_tokens !== 'number' ||
    typeof (obj.usage as Record<string, unknown>).output_tokens !== 'number'
  ) {
    return false;
  }
  return typeof obj.model === 'string';
}

@Injectable()
export class AnthropicProvider implements ILLMProvider {
  readonly providerName = 'anthropic';

  constructor(private readonly config: ConfigService) {}

  async generate(
    prompt: PromptContext,
    options: LlmOptions = {},
  ): Promise<LlmResponse> {
    const apiKey = this.config.getOrThrow<string>('ANTHROPIC_API_KEY');
    const model = options.model ?? 'claude-3-sonnet-20240229';
    const url = 'https://api.anthropic.com/v1/messages';

    const messages = this.buildMessages(prompt);

    const body: AnthropicRequest = {
      model,
      max_tokens: options.maxTokens ?? 1024,
      messages,
      ...(prompt.system && { system: prompt.system }),
      ...(options.temperature !== undefined && {
        temperature: options.temperature,
      }),
    };

    const start = performance.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => 'unknown error');
        throw new Error(
          `Anthropic request failed (${res.status} ${res.statusText}): ${text}`,
        );
      }

      const responseBody = await res.json();
      if (!isAnthropicResponse(responseBody)) {
        throw new Error('Invalid Anthropic messages response structure');
      }

      const latencyMs = Math.round(performance.now() - start);
      const content = responseBody.content[0].text.trim();

      return {
        content,
        model: responseBody.model,
        provider: this.providerName,
        tokens: {
          input: responseBody.usage.input_tokens,
          output: responseBody.usage.output_tokens,
        },
        latencyMs,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TypeError') {
        throw new Error(
          `Anthropic connection failed: unable to reach ${url}. ${err.message}`,
        );
      }
      throw err;
    }
  }

  private buildMessages(context: PromptContext): AnthropicMessage[] {
    const messages: AnthropicMessage[] = [];

    if (context.history && context.history.length > 0) {
      for (const msg of context.history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: context.user });

    return messages;
  }
}
