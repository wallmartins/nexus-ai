import { Injectable } from '@nestjs/common';

export interface Chunk {
  content: string;
  index: number;
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

@Injectable()
export class ChunkingService {
  private static readonly DEFAULT_CHUNK_SIZE = 500;
  private static readonly DEFAULT_CHUNK_OVERLAP = 50;

  private static readonly SEPARATORS = [
    '\n\n', // paragraphs
    '\n', // lines
    '. ', // sentences (with space)
    ' ', // words
    '', // characters
  ];

  split(text: string, options: ChunkingOptions = {}): Chunk[] {
    const chunkSize = options.chunkSize ?? ChunkingService.DEFAULT_CHUNK_SIZE;
    const chunkOverlap =
      options.chunkOverlap ?? ChunkingService.DEFAULT_CHUNK_OVERLAP;

    if (chunkOverlap >= chunkSize) {
      throw new Error('chunkOverlap must be less than chunkSize');
    }

    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = this.splitRecursively(text, chunkSize, chunkOverlap, 0);

    return chunks.map((content, index) => ({
      content: content.trim(),
      index,
    }));
  }

  private splitRecursively(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
    separatorIndex: number,
  ): string[] {
    // Base case: text fits in one chunk
    if (text.length <= chunkSize) {
      return [text];
    }

    // Base case: no more separators, force split by character
    if (separatorIndex >= ChunkingService.SEPARATORS.length) {
      return this.forceSplit(text, chunkSize, chunkOverlap);
    }

    const separator = ChunkingService.SEPARATORS[separatorIndex];
    const parts = separator === '' ? text.split('') : text.split(separator);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const part of parts) {
      const chunkWithSeparator =
        currentChunk.length > 0 && separator.length > 0
          ? currentChunk + separator + part
          : currentChunk + part;

      if (chunkWithSeparator.length <= chunkSize) {
        currentChunk = chunkWithSeparator;
      } else {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk);
        }
        // If a single part is larger than chunkSize, recurse with next separator
        if (part.length > chunkSize) {
          const subChunks = this.splitRecursively(
            part,
            chunkSize,
            chunkOverlap,
            separatorIndex + 1,
          );
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = part;
        }
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    return this.applyOverlap(chunks, chunkOverlap);
  }

  private forceSplit(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push(text.slice(start, end));
      start = end - chunkOverlap;
      if (start >= end) break; // safety
    }

    return chunks;
  }

  private applyOverlap(chunks: string[], chunkOverlap: number): string[] {
    if (chunks.length <= 1 || chunkOverlap <= 0) {
      return chunks;
    }

    const result: string[] = [chunks[0]];

    for (let i = 1; i < chunks.length; i++) {
      const prev = chunks[i - 1];
      const current = chunks[i];

      // Find overlap text from the end of previous chunk
      const overlapText = prev.slice(-chunkOverlap);

      // Only prepend overlap if current doesn't already start with it
      if (!current.startsWith(overlapText)) {
        result.push(overlapText + current);
      } else {
        result.push(current);
      }
    }

    return result;
  }
}
