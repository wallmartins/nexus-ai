import { z } from 'zod';

const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default('3001')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .optional()
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  OLLAMA_BASE_URL: z
    .string()
    .optional()
    .default('http://localhost:11434'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().optional().default('http://localhost:3000'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${issues}`);
  }

  return result.data;
}
