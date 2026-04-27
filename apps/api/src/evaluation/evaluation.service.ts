import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../database/prisma.service';
import { DatasetLoader } from './dataset-loader.service';
import { ScoringService } from './scoring.service';
import { SynthesisWorkflow } from '../agent/synthesis-workflow.service';
import { EvaluationTriggerResponse } from './evaluation.types';

export type EvaluationModelConfig = {
  provider: string;
  modelName: string;
};

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly datasetLoader: DatasetLoader,
    private readonly scoringService: ScoringService,
    private readonly synthesisWorkflow: SynthesisWorkflow,
  ) {}

  async createRun(
    models: EvaluationModelConfig[],
  ): Promise<EvaluationTriggerResponse> {
    const dataset = this.datasetLoader.load();

    const run = await this.prisma.evaluationRun.create({
      data: {
        datasetVersion: dataset.version,
        status: 'pending',
        models: models as unknown as Prisma.InputJsonValue,
        aggregatedMetrics: {},
      },
    });

    this.logger.log(`Evaluation run ${run.id} created for dataset ${dataset.version}`);

    return {
      runId: run.id,
      status: run.status,
      queuedAt: run.startedAt.toISOString(),
    };
  }

  async executeRun(
    runId: string,
    models: EvaluationModelConfig[],
  ): Promise<void> {
    this.logger.log(`Starting evaluation run ${runId}`);

    await this.prisma.evaluationRun.update({
      where: { id: runId },
      data: { status: 'running' },
    });

    const questions = this.datasetLoader.getQuestions();
    let completedCount = 0;
    const totalCount = questions.length * models.length;

    for (const model of models) {
      for (const question of questions) {
        const correlationId = `eval-${runId}-${question.id}-${model.provider}`;
        const startTime = Date.now();

        try {
          const result = await this.synthesisWorkflow.execute({
            query: question.question,
            correlationId,
            options: {
              provider: model.provider,
              model: model.modelName,
              useCache: false,
            },
          });

          const relevanceScore = this.scoringService.computeRelevance(
            result.sources.map((s) => s.chunkId),
            question.referenceChunks,
          );

          const consistencyScore = this.scoringService.computeConsistency(
            result.content,
            question.expectedAnswer,
          );

          const groundingScore = this.scoringService.computeGrounding(
            result.content,
            result.sources.map((s) => s.preview),
          );

          await this.prisma.evaluationResult.create({
            data: {
              runId,
              questionId: question.id,
              questionText: question.question,
              expectedAnswer: question.expectedAnswer,
              generatedAnswer: result.content,
              retrievedChunkIds: result.sources.map((s) => s.chunkId) as unknown as Prisma.InputJsonValue,
              relevanceScore,
              consistencyScore,
              groundingScore,
              latencyMs: result.latencyMs,
              tokens: result.tokens as unknown as Prisma.InputJsonValue,
            },
          });

          completedCount++;
          this.logger.log(
            `Evaluation progress: ${completedCount}/${totalCount} — ${question.id} via ${model.provider}`,
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Evaluation failed for ${question.id} with ${model.provider}/${model.modelName}: ${message}`,
          );

          await this.prisma.evaluationResult.create({
            data: {
              runId,
              questionId: question.id,
              questionText: question.question,
              expectedAnswer: question.expectedAnswer,
              generatedAnswer: `ERROR: ${message}`,
              retrievedChunkIds: [],
              relevanceScore: 0,
              consistencyScore: 0,
              groundingScore: 0,
              latencyMs: Date.now() - startTime,
              tokens: { input: 0, output: 0 } as unknown as Prisma.InputJsonValue,
            },
          });

          completedCount++;
        }
      }
    }

    await this.finalizeRun(runId);
  }

  private async finalizeRun(runId: string): Promise<void> {
    const results = await this.prisma.evaluationResult.findMany({
      where: { runId },
    });

    if (results.length === 0) {
      await this.prisma.evaluationRun.update({
        where: { id: runId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          aggregatedMetrics: { error: 'No results produced' } as unknown as Prisma.InputJsonValue,
        },
      });
      return;
    }

    const scores = results.filter((r) => r.generatedAnswer && !r.generatedAnswer.startsWith('ERROR:'));

    const avgRelevance =
      scores.length > 0
        ? scores.reduce((sum, r) => sum + (r.relevanceScore ?? 0), 0) / scores.length
        : 0;

    const avgConsistency =
      scores.length > 0
        ? scores.reduce((sum, r) => sum + (r.consistencyScore ?? 0), 0) / scores.length
        : 0;

    const avgGrounding =
      scores.length > 0
        ? scores.reduce((sum, r) => sum + (r.groundingScore ?? 0), 0) / scores.length
        : 0;

    const avgLatencyMs =
      scores.length > 0
        ? scores.reduce((sum, r) => sum + (r.latencyMs ?? 0), 0) / scores.length
        : 0;

    const totalTokens = scores.reduce((sum, r) => {
      const tokens = (r.tokens ?? {}) as { input?: number; output?: number };
      return sum + (tokens.input ?? 0) + (tokens.output ?? 0);
    }, 0);

    await this.prisma.evaluationRun.update({
      where: { id: runId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        aggregatedMetrics: {
          avgRelevance: Math.round(avgRelevance * 10000) / 10000,
          avgConsistency: Math.round(avgConsistency * 10000) / 10000,
          avgGrounding: Math.round(avgGrounding * 10000) / 10000,
          avgLatencyMs: Math.round(avgLatencyMs),
          totalTokens,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Evaluation run ${runId} completed with ${scores.length}/${results.length} successful questions`);
  }
}
