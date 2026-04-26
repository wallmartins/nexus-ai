export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  content: string;
  index: number;
  metadata: Record<string, unknown>;
  score: number;
  modelName: string;
};

export type RetrievalOptions = {
  query: string;
  topK?: number;
  useMMR?: boolean;
  mmrLambda?: number;
  embeddingModel?: string;
  fetchMultiplier?: number;
};
