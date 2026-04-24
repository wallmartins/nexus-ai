export interface IngestionJobPayload {
  documentId: string;
  filePath: string;
  mimeType: string;
}

export interface EmbeddingJobPayload {
  documentId: string;
  chunkIds: string[];
  embeddingModel: string;
}

export interface EvaluationJobPayload {
  runId: string;
  datasetVersion: string;
  models: Array<{ provider: string; modelName: string }>;
}

export type QueueJobPayload =
  | IngestionJobPayload
  | EmbeddingJobPayload
  | EvaluationJobPayload;
