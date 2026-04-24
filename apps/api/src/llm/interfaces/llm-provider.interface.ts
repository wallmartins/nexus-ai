export type PromptContext = {
  system?: string;
  user: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export type LlmOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
};

export type TokenUsage = {
  input: number;
  output: number;
};

export type LlmResponse = {
  content: string;
  model: string;
  provider: string;
  tokens: TokenUsage;
  latencyMs: number;
};

export type ILLMProvider = {
  readonly providerName: string;

  generate(prompt: PromptContext, options?: LlmOptions): Promise<LlmResponse>;
};
