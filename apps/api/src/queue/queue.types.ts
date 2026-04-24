export type IngestionJobPayload = {
  documentId: string;
  filePath: string;
  mimeType: string;
};

export type EmbeddingJobPayload = {
  documentId: string;
  chunkIds: string[];
  embeddingModel: string;
};

export type EvaluationJobPayload = {
  runId: string;
  datasetVersion: string;
  models: Array<{ provider: string; modelName: string }>;
};

export type QueueJobPayload =
  | IngestionJobPayload
  | EmbeddingJobPayload
  | EvaluationJobPayload;
