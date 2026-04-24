export const QUEUE_NAMES = {
  INGESTION: 'ingestion',
  EMBEDDING: 'embedding',
  EVALUATION: 'evaluation',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];
