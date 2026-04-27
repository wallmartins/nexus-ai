import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ILLMProvider,
  PromptContext,
  LlmOptions,
  LlmResponse,
} from '../interfaces/llm-provider.interface';

type OpenAiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OpenAiChatRequest = {
  model: string;
  messages: OpenAiMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
};

type OpenAiChatResponse = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

function isOpenAiChatResponse(value: unknown): value is OpenAiChatResponse {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!Array.isArray(obj.choices) || obj.choices.length === 0) return false;
  const firstChoice = obj.choices[0] as Record<string, unknown>;
  if (typeof firstChoice.message !== 'object' || firstChoice.message === null) return false;
  const message = firstChoice.message as Record<string, unknown>;
  return typeof message.content === 'string';
}

@Injectable()
export class OpenAiProvider implements ILLMProvider {
  readonly providerName = 'openai';

  constructor(private readonly config: ConfigService) {}

  async generate(
    prompt: PromptContext,
    options: LlmOptions = {},
  ): Promise<LlmResponse> {
    const apiKey = this.config.getOrThrow<string>('OPENAI_API_KEY');
    const model = options.model ?? 'gpt-4o-mini';
    const url = 'https://api.openai.com/v1/chat/completions';

    const messages = this.buildMessages(prompt);

    const body: OpenAiChatRequest = {
      model,
      messages,
      ...(options.temperature !== undefined && {
        temperature: options.temperature,
      }),
      ...(options.maxTokens !== undefined && {
        max_tokens: options.maxTokens,
      }),
      ...(options.jsonMode && { response_format: { type: 'json_object' } }),
    };

    const start = performance.now();

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => 'unknown error');
        throw new Error(
          `OpenAI request failed (${res.status} ${res.statusText}): ${text}`,
        );
      }

      const responseBody = await res.json();
      if (!isOpenAiChatResponse(responseBody)) {
        throw new Error('Invalid OpenAI chat completions response structure');
      }

      const latencyMs = Math.round(performance.now() - start);
      const content = responseBody.choices[0].message.content.trim();

      return {
        content,
        model: responseBody.model,
        provider: this.providerName,
        tokens: {
          input: responseBody.usage?.prompt_tokens ?? this.estimateTokens(body),
          output: responseBody.usage?.completion_tokens ?? this.estimateTokens(content),
        },
        latencyMs,
      };
    } catch (err) {
      if (err instanceof Error && err.name === 'TypeError') {
        throw new Error(
          `OpenAI connection failed: unable to reach ${url}. ${err.message}`,
        );
      }
      throw err;
    }
  }

  private buildMessages(context: PromptContext): OpenAiMessage[] {
    const messages: OpenAiMessage[] = [];

    if (context.system) {
      messages.push({ role: 'system', content: context.system });
    }

    if (context.history && context.history.length > 0) {
      for (const msg of context.history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    messages.push({ role: 'user', content: context.user });

    return messages;
  }

  private estimateTokens(value: unknown): number {
    if (typeof value === 'string') {
      return Math.ceil(value.length / 4);
    }
    if (typeof value === 'object' && value !== null) {
      return Math.ceil(JSON.stringify(value).length / 4);
    }
    return 0;
  }
}
