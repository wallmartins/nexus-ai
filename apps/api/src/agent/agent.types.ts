import { Annotation } from '@langchain/langgraph';

export type QueryClassification = 'DIRECT' | 'RAG';

export const StateAnnotation = Annotation.Root({
  query: Annotation<string>,
  classification: Annotation<QueryClassification | null>,
  correlationId: Annotation<string>,
});

export type AgentState = typeof StateAnnotation.State;
