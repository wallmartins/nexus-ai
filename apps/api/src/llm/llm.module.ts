import { Module } from '@nestjs/common';
import { OllamaProvider } from './providers/ollama.provider';
import { OpenAiProvider } from './providers/openai.provider';

@Module({
  providers: [OllamaProvider, OpenAiProvider],
  exports: [OllamaProvider, OpenAiProvider],
})
export class LlmModule {}
