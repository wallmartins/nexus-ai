export type CachedResponse = {
  content: string;
  sources: Array<{
    chunkId: string;
    documentId: string;
    preview: string;
    score: number;
  }>;
  model: string;
  provider: string;
  tokens: { input: number; output: number };
  latencyMs: number;
  cached: true;
};

export type CacheFingerprint = {
  query: string;
  provider: string;
  model: string;
  chunkIds: string[];
};
