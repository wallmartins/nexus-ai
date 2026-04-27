import { Annotation } from '@langchain/langgraph';

export type QueryClassification = 'DIRECT' | 'RAG';

export const StateAnnotation = Annotation.Root({
  query: Annotation<string>,
  classification: Annotation<QueryClassification | null>,
  correlationId: Annotation<string>,
  toolOutputs: Annotation<Record<string, unknown>>({
    value: (a, b) => ({ ...a, ...b }),
    default: () => ({}),
  }),
});

export type AgentState = typeof StateAnnotation.State;

export type SynthesisSource = {
  chunkId: string;
  documentId: string;
  preview: string;
  score: number;
};

export type SynthesisInput = {
  query: string;
  sessionId?: string;
  correlationId: string;
  options?: {
    useCache?: boolean;
    provider?: string;
    model?: string;
  };
};

export type SynthesisResult = {
  content: string;
  sources: SynthesisSource[];
  classification: QueryClassification;
  latencyMs: number;
  tokens: { input: number; output: number };
  model: string;
  provider: string;
  correlationId: string;
};
