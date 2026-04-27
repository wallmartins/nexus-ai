import { Injectable } from '@nestjs/common';
import { AppSettings, UpdateSettingsDto } from './settings.schema';

const DEFAULT_SETTINGS: AppSettings = {
  llmProvider: 'ollama',
  llmModel: 'llama3',
  embeddingModel: 'nomic-embed-text',
  chunkSize: 500,
  chunkOverlap: 50,
  retrievalTopK: 5,
  useMMR: false,
  sessionMemoryDepth: 10,
  cacheTtlSeconds: 3600,
  maxInputLength: 4000,
};

@Injectable()
export class SettingsService {
  private settings: AppSettings = { ...DEFAULT_SETTINGS };

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(partial: UpdateSettingsDto): AppSettings {
    this.settings = { ...this.settings, ...partial };
    return this.getSettings();
  }
}
