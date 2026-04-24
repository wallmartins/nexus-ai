export type SessionMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type MemoryContext = {
  messages: SessionMessage[];
};
