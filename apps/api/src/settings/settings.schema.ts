import { Injectable } from '@nestjs/common';
import { z } from 'zod';

export const updateSettingsSchema = z.object({
  llmProvider: z.enum(['ollama', 'openai', 'anthropic']).optional(),
  llmModel: z.string().min(1).optional(),
  embeddingModel: z.string().min(1).optional(),
  chunkSize: z.number().int().min(100).max(4000).optional(),
  chunkOverlap: z.number().int().min(0).max(1000).optional(),
  retrievalTopK: z.number().int().min(1).max(20).optional(),
  useMMR: z.boolean().optional(),
  sessionMemoryDepth: z.number().int().min(1).max(50).optional(),
  cacheTtlSeconds: z.number().int().min(60).max(86400).optional(),
  maxInputLength: z.number().int().min(100).max(10000).optional(),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;

export interface AppSettings {
  llmProvider: 'ollama' | 'openai' | 'anthropic';
  llmModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  retrievalTopK: number;
  useMMR: boolean;
  sessionMemoryDepth: number;
  cacheTtlSeconds: number;
  maxInputLength: number;
}
