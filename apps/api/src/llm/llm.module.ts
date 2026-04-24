import { Module } from '@nestjs/common';
import { OllamaProvider } from './providers/ollama.provider';

@Module({
  providers: [OllamaProvider],
  exports: [OllamaProvider],
})
export class LlmModule {}
