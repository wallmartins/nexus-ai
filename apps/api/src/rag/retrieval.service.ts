import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { SettingsService } from '../settings/settings.service';
import { RetrievedChunk, RetrievalOptions } from './rag.types';

const DEFAULT_MMR_LAMBDA = 0.5;
const DEFAULT_FETCH_MULTIPLIER = 4;

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function parsePgVector(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((v) => Number(v));
  }
  if (typeof value === 'string') {
    const cleaned = value
      .trim()
      .replace(/^\[|\]$/g, '')
      .replace(/^\{|\}$/g, '');
    if (!cleaned) return [];
    return cleaned.split(',').map((s) => Number(s.trim()));
  }
  return [];
}

type SimilarityRow = {
  id: string;
  documentId: string;
  content: string;
  index: number;
  metadata: unknown;
  modelName: string;
  vector_text: string;
  score: number;
};

@Injectable()
export class RetrievalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly settingsService: SettingsService,
  ) {}

  async retrieve(options: RetrievalOptions): Promise<RetrievedChunk[]> {
    const settings = this.settingsService.getSettings();
    const topK = options.topK ?? settings.retrievalTopK;
    const useMMR = options.useMMR ?? settings.useMMR;
    const mmrLambda = options.mmrLambda ?? DEFAULT_MMR_LAMBDA;
    const embeddingModel = options.embeddingModel ?? settings.embeddingModel;

    const queryEmbedding = await this.embeddingsService.embedQuery(
      options.query,
      embeddingModel,
    );

    const fetchK = useMMR
      ? topK * (options.fetchMultiplier ?? DEFAULT_FETCH_MULTIPLIER)
      : topK;

    const candidates = await this.runSimilaritySearch(
      queryEmbedding,
      fetchK,
      embeddingModel,
    );

    if (!useMMR || candidates.length <= topK) {
      return candidates.slice(0, topK);
    }

    return this.applyMMR(candidates, topK, mmrLambda);
  }

  private async runSimilaritySearch(
    queryVector: number[],
    limit: number,
    modelName: string,
  ): Promise<Array<RetrievedChunk & { vector: number[] }>> {
    const vectorLiteral = `[${queryVector.join(',')}]`;

    const rows = await this.prisma.$queryRaw<SimilarityRow[]>`
      SELECT
        c.id,
        c."documentId",
        c.content,
        c.index,
        c.metadata,
        e."modelName",
        e.vector::text as vector_text,
        1 - (e.vector <=> ${vectorLiteral}::vector(768)) as score
      FROM embeddings e
      JOIN chunks c ON e."chunkId" = c.id
      WHERE e."modelName" = ${modelName}
      ORDER BY e.vector <=> ${vectorLiteral}::vector(768)
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      chunkId: row.id,
      documentId: row.documentId,
      content: row.content,
      index: row.index,
      metadata:
        typeof row.metadata === 'object' && row.metadata !== null
          ? (row.metadata as Record<string, unknown>)
          : {},
      score: Number(row.score),
      modelName: row.modelName,
      vector: parsePgVector(row.vector_text),
    }));
  }

  private applyMMR(
    candidates: Array<RetrievedChunk & { vector: number[] }>,
    topK: number,
    lambda: number,
  ): RetrievedChunk[] {
    const selected: Array<RetrievedChunk & { vector: number[] }> = [];
    const remaining = [...candidates];

    while (selected.length < topK && remaining.length > 0) {
      let bestIndex = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const chunk = remaining[i];
        const querySim = chunk.score;

        let maxSelectedSim = 0;
        for (const sel of selected) {
          const sim = cosineSimilarity(chunk.vector, sel.vector);
          if (sim > maxSelectedSim) {
            maxSelectedSim = sim;
          }
        }

        const mmrScore = lambda * querySim - (1 - lambda) * maxSelectedSim;

        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIndex = i;
        }
      }

      const [chosen] = remaining.splice(bestIndex, 1);
      selected.push(chosen);
    }

    return selected.map(({ vector: _vector, ...rest }) => rest);
  }
}
