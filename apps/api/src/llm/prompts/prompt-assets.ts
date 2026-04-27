import { PromptContext } from '../interfaces/llm-provider.interface';

export type PromptBuildContext = {
  userQuery: string;
  retrievedContext?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export type PromptAsset = {
  readonly name: string;
  readonly version: string;
  build(context: PromptBuildContext): PromptContext;
};

const RAG_SYNTHESIS_SYSTEM = `You are a precise knowledge assistant. Answer the user's question using only the provided context. If the context does not contain enough information, say so clearly. Always cite your sources using [N] format where N is the chunk index.`;

const DECISION_SYSTEM = `You are a query classifier. Analyze the user's query and classify it as either needing external document retrieval (RAG) or being answerable directly (DIRECT). Respond with exactly one word: RAG or DIRECT.`;

const DIRECT_ANSWER_SYSTEM = `You are a helpful assistant. Answer the user's question concisely and accurately.`;

export const RAG_SYNTHESIS_PROMPT: PromptAsset = {
  name: 'rag-synthesis',
  version: '1.0.0',
  build(context: PromptBuildContext): PromptContext {
    const parts: string[] = [];
    parts.push(`Question: ${context.userQuery}`);

    if (context.retrievedContext && context.retrievedContext.length > 0) {
      parts.push(`\nContext:\n${context.retrievedContext}`);
    }

    return {
      system: RAG_SYNTHESIS_SYSTEM,
      user: parts.join(''),
      history: context.history,
    };
  },
};

export const DECISION_PROMPT: PromptAsset = {
  name: 'decision',
  version: '1.0.0',
  build(context: PromptBuildContext): PromptContext {
    return {
      system: DECISION_SYSTEM,
      user: context.userQuery,
      history: context.history,
    };
  },
};

export const DIRECT_ANSWER_PROMPT: PromptAsset = {
  name: 'direct-answer',
  version: '1.0.0',
  build(context: PromptBuildContext): PromptContext {
    return {
      system: DIRECT_ANSWER_SYSTEM,
      user: context.userQuery,
      history: context.history,
    };
  },
};

const PROMPT_REGISTRY: Record<string, PromptAsset> = {
  [RAG_SYNTHESIS_PROMPT.name]: RAG_SYNTHESIS_PROMPT,
  [DECISION_PROMPT.name]: DECISION_PROMPT,
  [DIRECT_ANSWER_PROMPT.name]: DIRECT_ANSWER_PROMPT,
};

export function getPromptAsset(name: string): PromptAsset | undefined {
  return PROMPT_REGISTRY[name];
}

export function listPromptAssets(): PromptAsset[] {
  return Object.values(PROMPT_REGISTRY);
}
