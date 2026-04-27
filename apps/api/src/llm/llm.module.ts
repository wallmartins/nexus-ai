import { Module } from '@nestjs/common';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { PromptManager } from './prompts/prompt-manager.service';
import { GuardrailService } from './guardrails/guardrail.service';
import { LlmService } from './llm.service';
import { ObservabilityModule } from '../observability/observability.module';

@Module({
  imports: [ObservabilityModule],
  providers: [
    OllamaProvider,
    OpenAiProvider,
    AnthropicProvider,
    PromptManager,
    GuardrailService,
    LlmService,
  ],
  exports: [
    OllamaProvider,
    OpenAiProvider,
    AnthropicProvider,
    PromptManager,
    GuardrailService,
    LlmService,
  ],
})
export class LlmModule {}
