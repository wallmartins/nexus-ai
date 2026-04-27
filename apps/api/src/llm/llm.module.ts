import { Module } from '@nestjs/common';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { PromptManager } from './prompts/prompt-manager.service';
import { GuardrailService } from './guardrails/guardrail.service';

@Module({
  providers: [
    OllamaProvider,
    OpenAiProvider,
    AnthropicProvider,
    PromptManager,
    GuardrailService,
  ],
  exports: [
    OllamaProvider,
    OpenAiProvider,
    AnthropicProvider,
    PromptManager,
    GuardrailService,
  ],
})
export class LlmModule {}
