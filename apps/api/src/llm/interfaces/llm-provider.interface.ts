export interface PromptContext {
  system?: string;
  user: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface LlmOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface LlmResponse {
  content: string;
  model: string;
  provider: string;
  tokens: TokenUsage;
  latencyMs: number;
}

export interface ILLMProvider {
  readonly providerName: string;

  generate(prompt: PromptContext, options?: LlmOptions): Promise<LlmResponse>;
}
