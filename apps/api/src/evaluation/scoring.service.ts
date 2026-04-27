import { Injectable } from '@nestjs/common';

@Injectable()
export class ScoringService {
  computeRelevance(
    retrievedChunkIds: string[],
    referenceChunkIds: string[],
  ): number {
    if (retrievedChunkIds.length === 0) return 0;

    const retrieved = new Set(retrievedChunkIds);
    const reference = new Set(referenceChunkIds);
    const intersection = [...retrieved].filter((id) => reference.has(id)).length;

    return Math.round((intersection / retrieved.size) * 10000) / 10000;
  }

  computeConsistency(generatedAnswer: string, expectedAnswer: string): number {
    const genTokens = this.tokenize(generatedAnswer);
    const expTokens = this.tokenize(expectedAnswer);

    if (genTokens.size === 0 || expTokens.size === 0) return 0;

    const intersection = [...genTokens].filter((t) => expTokens.has(t)).length;
    const union = new Set([...genTokens, ...expTokens]).size;

    return Math.round((intersection / union) * 10000) / 10000;
  }

  computeGrounding(
    generatedAnswer: string,
    retrievedChunkContents: string[],
  ): number {
    const answerTokens = this.tokenize(generatedAnswer);

    if (answerTokens.size === 0) return 0;

    const chunkText = retrievedChunkContents.join(' ');
    const chunkTokens = this.tokenize(chunkText);

    const intersection = [...answerTokens].filter((t) =>
      chunkTokens.has(t),
    ).length;

    return Math.round((intersection / answerTokens.size) * 10000) / 10000;
  }

  private tokenize(text: string): Set<string> {
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((t) => t.length > 2),
    );
  }
}
