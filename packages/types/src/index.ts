export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  checks: Record<string, { status: 'up' | 'down'; latencyMs?: number }>;
}
