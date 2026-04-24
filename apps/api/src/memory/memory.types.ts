export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface MemoryContext {
  messages: SessionMessage[];
}
