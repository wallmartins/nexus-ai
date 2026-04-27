export type EvaluationTriggerRequest = {
  models: Array<{ provider: string; modelName: string }>;
};

export type EvaluationTriggerResponse = {
  runId: string;
  status: string;
  queuedAt: string;
};
