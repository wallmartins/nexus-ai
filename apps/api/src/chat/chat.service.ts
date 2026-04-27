import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { SynthesisWorkflow } from '../agent/synthesis-workflow.service';
import { MemoryService } from '../memory/memory.service';
import { LoggerService } from '../observability/logger.service';
import { CorrelationService } from '../observability/correlation.service';
import { GuardrailService } from '../llm/guardrails/guardrail.service';
import {
  ChatMessageRequest,
  ChatMessageResponse,
  ChatHistoryMessage,
  ChatMessageSource,
} from './chat.types';
import { randomUUID } from 'crypto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly synthesisWorkflow: SynthesisWorkflow,
    private readonly memoryService: MemoryService,
    private readonly logger: LoggerService,
    private readonly correlationService: CorrelationService,
    private readonly guardrailService: GuardrailService,
  ) {}

  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const correlationId =
      this.correlationService.getCorrelationId() ?? randomUUID();

    this.logger.info('Chat message received', {
      service: 'chat',
      eventType: 'chat.request',
      correlationId,
      sessionId: request.sessionId,
    });

    // Input guardrail
    this.guardrailService.validateInput(request.message);

    // Resolve or create session
    const sessionId = request.sessionId ?? (await this.createSession());

    // Persist user message
    const userMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        content: request.message,
        correlationId,
        modelProvider: '',
        modelName: '',
      },
    });

    // Add to Redis session memory
    await this.memoryService.addMessage(sessionId, {
      role: 'user',
      content: request.message,
    });

    // Run synthesis workflow
    const result = await this.synthesisWorkflow.execute({
      query: request.message,
      sessionId,
      correlationId,
      options: request.options,
    });

    // Persist assistant message
    const assistantMessage = await this.prisma.message.create({
      data: {
        sessionId,
        role: 'assistant',
        content: result.content,
        sources: result.sources as unknown as Prisma.InputJsonValue,
        latencyMs: result.latencyMs,
        tokens: result.tokens as unknown as Prisma.InputJsonValue,
        correlationId: result.correlationId,
        modelProvider: result.provider,
        modelName: result.model,
      },
    });

    // Add assistant response to Redis memory
    await this.memoryService.addMessage(sessionId, {
      role: 'assistant',
      content: result.content,
    });

    this.logger.info('Chat message completed', {
      service: 'chat',
      eventType: 'chat.complete',
      correlationId: result.correlationId,
      sessionId,
      latencyMs: result.latencyMs,
      tokens: result.tokens,
    });

    return {
      sessionId,
      messageId: assistantMessage.id,
      role: 'assistant',
      content: result.content,
      sources: result.sources,
      latencyMs: result.latencyMs,
      tokens: result.tokens,
      correlationId: result.correlationId,
    };
  }

  async getSessionMessages(sessionId: string): Promise<ChatHistoryMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      sources: (m.sources as unknown as ChatMessageSource[]) ?? [],
      latencyMs: m.latencyMs,
      tokens: (m.tokens as unknown as { input: number; output: number }) ?? {
        input: 0,
        output: 0,
      },
      correlationId: m.correlationId,
      modelProvider: m.modelProvider,
      modelName: m.modelName,
      createdAt: m.createdAt,
    }));
  }

  private async createSession(): Promise<string> {
    const session = await this.prisma.session.create({
      data: {},
    });
    return session.id;
  }
}
