import { Injectable } from '@nestjs/common';
import { StateGraph, START, END } from '@langchain/langgraph';
import { OllamaProvider } from '../llm/providers/ollama.provider';
import { OpenAiProvider } from '../llm/providers/openai.provider';
import { AnthropicProvider } from '../llm/providers/anthropic.provider';
import { SettingsService } from '../settings/settings.service';
import { LoggerService } from '../observability/logger.service';
import { StateAnnotation, AgentState, QueryClassification } from './agent.types';

function normalizeClassification(raw: string): QueryClassification | null {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === 'DIRECT' || trimmed === 'RAG') {
    return trimmed;
  }
  return null;
}

@Injectable()
export class DecisionAgent {
  private graph = this.buildGraph();

  constructor(
    private readonly ollamaProvider: OllamaProvider,
    private readonly openAiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
    private readonly settingsService: SettingsService,
    private readonly logger: LoggerService,
  ) {}

  async invoke(query: string, correlationId: string): Promise<AgentState> {
    return this.graph.invoke({
      query,
      classification: null,
      correlationId,
    });
  }

  private buildGraph() {
    return new StateGraph(StateAnnotation)
      .addNode('classify', this.classifyNode.bind(this))
      .addNode('route', this.routeNode.bind(this))
      .addEdge(START, 'classify')
      .addEdge('classify', 'route')
      .addEdge('route', END)
      .compile();
  }

  private async classifyNode(state: AgentState): Promise<Partial<AgentState>> {
    this.logger.info('Agent step: classify', {
      service: 'decision-agent',
      eventType: 'agent.step',
      correlationId: state.correlationId,
      step: 'classify',
      query: state.query,
    });

    const provider = this.resolveProvider();

    try {
      const response = await provider.generate(
        {
          system:
            'You are a query classifier. Analyze the user query and classify it as either needing external document retrieval (RAG) or being answerable directly (DIRECT). Respond with exactly one word: RAG or DIRECT.',
          user: `Query: ${state.query}`,
        },
        { temperature: 0.1, maxTokens: 10 },
      );

      const classification = normalizeClassification(response.content);

      this.logger.info('Agent step: classify complete', {
        service: 'decision-agent',
        eventType: 'agent.step.complete',
        correlationId: state.correlationId,
        step: 'classify',
        classification: classification ?? 'UNKNOWN',
        rawResponse: response.content,
        latencyMs: response.latencyMs,
        tokens: response.tokens,
      });

      return { classification };
    } catch (err) {
      this.logger.error('Agent step: classify failed', err instanceof Error ? err : undefined, {
        service: 'decision-agent',
        eventType: 'agent.step.error',
        correlationId: state.correlationId,
        step: 'classify',
      });

      return { classification: 'RAG' };
    }
  }

  private async routeNode(state: AgentState): Promise<Partial<AgentState>> {
    const classification = state.classification ?? 'RAG';

    this.logger.info('Agent step: route', {
      service: 'decision-agent',
      eventType: 'agent.step',
      correlationId: state.correlationId,
      step: 'route',
      classification,
    });

    return { classification };
  }

  private resolveProvider() {
    const settings = this.settingsService.getSettings();

    switch (settings.llmProvider) {
      case 'openai':
        return this.openAiProvider;
      case 'anthropic':
        return this.anthropicProvider;
      case 'ollama':
      default:
        return this.ollamaProvider;
    }
  }
}
