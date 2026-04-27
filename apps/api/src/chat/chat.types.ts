export type ChatMessageRequest = {
  sessionId?: string;
  message: string;
  options?: {
    useCache?: boolean;
    provider?: string;
    model?: string;
  };
};

export type ChatMessageSource = {
  chunkId: string;
  documentId: string;
  preview: string;
  score: number;
};

export type ChatMessageResponse = {
  sessionId: string;
  messageId: string;
  role: 'assistant';
  content: string;
  sources: ChatMessageSource[];
  latencyMs: number;
  tokens: { input: number; output: number };
  correlationId: string;
};

export type ChatHistoryMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatMessageSource[];
  latencyMs: number | null;
  tokens: { input: number; output: number };
  correlationId: string;
  modelProvider: string;
  modelName: string;
  createdAt: Date;
};
