const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export type ChatSource = {
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
  sources: ChatSource[];
  latencyMs: number;
  tokens: { input: number; output: number };
  correlationId: string;
};

export type ChatHistoryMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[];
  latencyMs: number | null;
  tokens: { input: number; output: number };
  correlationId: string;
  modelProvider: string;
  modelName: string;
  createdAt: string;
};

export type ChatSendRequest = {
  sessionId?: string;
  message: string;
  options?: {
    useCache?: boolean;
    provider?: string;
    model?: string;
  };
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function sendChatMessage(
  request: ChatSendRequest,
): Promise<ChatMessageResponse> {
  return fetchJson<ChatMessageResponse>(`${API_BASE}/chat`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getSessionMessages(
  sessionId: string,
): Promise<ChatHistoryMessage[]> {
  return fetchJson<ChatHistoryMessage[]>(
    `${API_BASE}/chat/sessions/${sessionId}/messages`,
  );
}

export type AppSettings = {
  llmProvider: 'ollama' | 'openai' | 'anthropic';
  llmModel: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
  retrievalTopK: number;
  useMMR: boolean;
  sessionMemoryDepth: number;
  cacheTtlSeconds: number;
  maxInputLength: number;
};

export type UpdateSettingsDto = Partial<AppSettings>;

export async function getSettings(): Promise<AppSettings> {
  return fetchJson<AppSettings>(`${API_BASE}/settings`);
}

export async function updateSettings(
  dto: UpdateSettingsDto,
): Promise<AppSettings> {
  return fetchJson<AppSettings>(`${API_BASE}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export type DocumentItem = {
  id: string;
  originalName: string;
  status: string;
  sizeBytes: number;
  createdAt: string;
};

export async function listDocuments(): Promise<DocumentItem[]> {
  return fetchJson<DocumentItem[]>(`${API_BASE}/documents`);
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<DocumentItem>;
}

export async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `HTTP ${res.status}`);
  }
}

export type MetricsResponse = {
  period: { from: string; to: string };
  granularity?: string;
  summary: {
    totalRequests: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    totalTokens: { input: number; output: number };
    errorRate: number;
  };
  buckets?: Array<{
    timestamp: string;
    totalRequests: number;
    avgLatencyMs: number;
    p95LatencyMs: number;
    totalTokens: { input: number; output: number };
    errorRate: number;
  }>;
};

export async function getMetrics(window: string): Promise<MetricsResponse> {
  return fetchJson<MetricsResponse>(
    `${API_BASE}/observability/metrics?window=${encodeURIComponent(window)}`,
  );
}

export type LogEntry = {
  id: string;
  correlationId: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  service: string;
  eventType: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

export type LogsResponse = {
  entries: LogEntry[];
  total: number;
  limit: number;
  offset: number;
};

export async function getLogs(params?: {
  correlationId?: string;
  level?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<LogsResponse> {
  const search = new URLSearchParams();
  if (params?.correlationId) search.set('correlationId', params.correlationId);
  if (params?.level) search.set('level', params.level);
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));

  const qs = search.toString();
  return fetchJson<LogsResponse>(
    `${API_BASE}/observability/logs${qs ? `?${qs}` : ''}`,
  );
}

export type EvaluationRun = {
  id: string;
  datasetVersion: string;
  status: string;
  models: Array<{ provider: string; modelName: string }>;
  aggregatedMetrics: {
    avgRelevance?: number;
    avgConsistency?: number;
    avgGrounding?: number;
    avgLatencyMs?: number;
    totalTokens?: number;
  };
  startedAt: string;
  completedAt: string | null;
};

export type EvaluationResult = {
  id: string;
  runId: string;
  questionId: string;
  questionText: string;
  expectedAnswer: string | null;
  generatedAnswer: string;
  retrievedChunkIds: string[];
  relevanceScore: number | null;
  consistencyScore: number | null;
  groundingScore: number | null;
  latencyMs: number | null;
  tokens: { input?: number; output?: number };
  createdAt: string;
};

export type EvaluationRunsResponse = {
  runs: EvaluationRun[];
  total: number;
  limit: number;
  offset: number;
};

export type EvaluationResultsResponse = {
  results: EvaluationResult[];
  total: number;
  limit: number;
  offset: number;
};

export async function listEvaluationRuns(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<EvaluationRunsResponse> {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));

  const qs = search.toString();
  return fetchJson<EvaluationRunsResponse>(
    `${API_BASE}/evaluations${qs ? `?${qs}` : ''}`,
  );
}

export async function getEvaluationRun(id: string): Promise<EvaluationRun> {
  return fetchJson<EvaluationRun>(`${API_BASE}/evaluations/${id}`);
}

export async function getEvaluationResults(
  runId: string,
  params?: { limit?: number; offset?: number },
): Promise<EvaluationResultsResponse> {
  const search = new URLSearchParams();
  if (params?.limit) search.set('limit', String(params.limit));
  if (params?.offset) search.set('offset', String(params.offset));

  const qs = search.toString();
  return fetchJson<EvaluationResultsResponse>(
    `${API_BASE}/evaluations/${runId}/results${qs ? `?${qs}` : ''}`,
  );
}

export async function triggerEvaluation(models: Array<{ provider: string; modelName: string }>): Promise<{ runId: string; status: string; queuedAt: string }> {
  return fetchJson(`${API_BASE}/evaluations`, {
    method: 'POST',
    body: JSON.stringify({ models }),
  });
}
