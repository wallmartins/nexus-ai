import { Injectable } from '@nestjs/common';
import { DecisionAgent } from './decision-agent.service';
import { RetrievalService } from '../rag/retrieval.service';
import { PromptManager } from '../llm/prompts/prompt-manager.service';
import { GuardrailService } from '../llm/guardrails/guardrail.service';
import { MemoryService } from '../memory/memory.service';
import { CacheService } from '../memory/cache.service';
import { SettingsService } from '../settings/settings.service';
import { LoggerService } from '../observability/logger.service';
import { LlmService } from '../llm/llm.service';
import { ToolRegistry } from './tools/tool-registry.service';
import {
  SynthesisInput,
  SynthesisResult,
  QueryClassification,
} from './agent.types';
import { RetrievedChunk } from '../rag/rag.types';

@Injectable()
export class SynthesisWorkflow {
  constructor(
    private readonly decisionAgent: DecisionAgent,
    private readonly retrievalService: RetrievalService,
    private readonly promptManager: PromptManager,
    private readonly guardrailService: GuardrailService,
    private readonly memoryService: MemoryService,
    private readonly cacheService: CacheService,
    private readonly settingsService: SettingsService,
    private readonly logger: LoggerService,
    private readonly llmService: LlmService,
    private readonly toolRegistry: ToolRegistry,
  ) {}

  async execute(input: SynthesisInput): Promise<SynthesisResult> {
    const startTime = Date.now();
    const { query, sessionId, correlationId, options } = input;

    this.logger.info('Synthesis workflow started', {
      service: 'synthesis-workflow',
      eventType: 'workflow.start',
      correlationId,
      query,
      sessionId,
    });

    // 1. Memory context
    const memory = sessionId
      ? await this.memoryService.getContext(sessionId)
      : { messages: [] };
    const history =
      memory.messages.length > 0
        ? memory.messages.map((m) => ({ role: m.role, content: m.content }))
        : undefined;

    // 2. Try calculator tool for math expressions
    const calculatorResult = await this.toolRegistry.invoke('calculator', {
      query,
      correlationId,
    });

    if (calculatorResult.error === undefined && calculatorResult.output !== null) {
      const latencyMs = Date.now() - startTime;

      this.logger.info('Synthesis workflow: calculator result', {
        service: 'synthesis-workflow',
        eventType: 'workflow.step',
        correlationId,
        step: 'calculator',
        result: calculatorResult.output,
      });

      return {
        content: String(calculatorResult.output),
        sources: [],
        classification: 'DIRECT',
        latencyMs,
        tokens: { input: 0, output: 0 },
        model: '',
        provider: '',
        correlationId,
      };
    }

    // 3. Classify query
    const decisionState = await this.decisionAgent.invoke(query, correlationId);
    const classification: QueryClassification = decisionState.classification ?? 'RAG';

    this.logger.info('Synthesis workflow classified', {
      service: 'synthesis-workflow',
      eventType: 'workflow.step',
      correlationId,
      step: 'classify',
      classification,
    });

    // 4. Retrieve if RAG via tool registry
    let chunks: RetrievedChunk[] = [];
    if (classification === 'RAG') {
      const retrievalResult = await this.toolRegistry.invoke('retrieval', {
        query,
        correlationId,
      });

      chunks = Array.isArray(retrievalResult.output) ? retrievalResult.output : [];

      this.logger.info('Synthesis workflow retrieved', {
        service: 'synthesis-workflow',
        eventType: 'workflow.step',
        correlationId,
        step: 'retrieve',
        chunkCount: chunks.length,
      });
    }

    // 5. Zero chunks guard
    if (classification === 'RAG' && chunks.length === 0) {
      const latencyMs = Date.now() - startTime;

      this.logger.info('Synthesis workflow: no relevant context', {
        service: 'synthesis-workflow',
        eventType: 'workflow.step',
        correlationId,
        step: 'format',
        result: 'no_context',
      });

      return {
        content:
          'I could not find any relevant context in the uploaded documents to answer this question.',
        sources: [],
        classification,
        latencyMs,
        tokens: { input: 0, output: 0 },
        model: '',
        provider: '',
        correlationId,
      };
    }

    // 6. Resolve provider / model
    const settings = this.settingsService.getSettings();
    const providerName = options?.provider ?? settings.llmProvider;
    const modelName = options?.model ?? settings.llmModel;
    const chunkIds = chunks.map((c) => c.chunkId);

    // 7. Check cache
    if (options?.useCache !== false) {
      const cached = await this.cacheService.get({
        query,
        provider: providerName,
        model: modelName,
        chunkIds,
      });

      if (cached) {
        this.logger.info('Synthesis workflow: cache hit', {
          service: 'synthesis-workflow',
          eventType: 'workflow.step',
          correlationId,
          step: 'cache',
          result: 'hit',
        });

        return {
          content: cached.content,
          sources: cached.sources,
          classification,
          latencyMs: Date.now() - startTime,
          tokens: cached.tokens,
          model: cached.model,
          provider: cached.provider,
          correlationId,
        };
      }
    }

    // 8. Compose prompt
    const promptName = classification === 'RAG' ? 'rag-synthesis' : 'direct-answer';
    const retrievedContext =
      classification === 'RAG'
        ? chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
        : undefined;

    const prompt = this.promptManager.compose(promptName, {
      userQuery: query,
      retrievedContext,
      history,
    });

    // 9. Generate
    const llmResponse = await this.llmService.generate({
      prompt,
      options: { model: modelName, temperature: 0.3 },
      providerName,
      correlationId,
    });

    // 10. Validate
    if (!llmResponse.content || llmResponse.content.trim().length === 0) {
      throw new Error('LLM returned empty response after synthesis');
    }

    // 11. Format sources
    const sources = chunks.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      preview: c.content.slice(0, 200),
      score: c.score,
    }));

    // 12. Cache
    const latencyMs = Date.now() - startTime;
    if (options?.useCache !== false) {
      await this.cacheService.set(
        { query, provider: providerName, model: modelName, chunkIds },
        {
          content: llmResponse.content,
          sources,
          model: llmResponse.model,
          provider: llmResponse.provider,
          tokens: llmResponse.tokens,
          latencyMs,
        },
      );
    }

    this.logger.info('Synthesis workflow completed', {
      service: 'synthesis-workflow',
      eventType: 'workflow.complete',
      correlationId,
      step: 'format',
      classification,
      latencyMs,
      tokens: llmResponse.tokens,
    });

    return {
      content: llmResponse.content,
      sources,
      classification,
      latencyMs,
      tokens: llmResponse.tokens,
      model: llmResponse.model,
      provider: llmResponse.provider,
      correlationId,
    };
  }

}
