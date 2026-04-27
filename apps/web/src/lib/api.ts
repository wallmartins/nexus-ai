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
