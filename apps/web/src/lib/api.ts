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
