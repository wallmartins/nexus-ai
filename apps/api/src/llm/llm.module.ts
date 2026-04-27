import { Module } from '@nestjs/common';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';

@Module({
  providers: [OllamaProvider, OpenAiProvider, AnthropicProvider],
  exports: [OllamaProvider, OpenAiProvider, AnthropicProvider],
})
export class LlmModule {}
