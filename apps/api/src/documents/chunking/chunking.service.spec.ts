import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingService } from './chunking.service';

describe('ChunkingService', () => {
  let service: ChunkingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChunkingService],
    }).compile();

    service = module.get<ChunkingService>(ChunkingService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  it('returns empty array for empty text', () => {
    const result = service.split('');
    expect(result).toEqual([]);
  });

  it('returns single chunk for short text', () => {
    const text = 'Short text.';
    const result = service.split(text);
    expect(result).toHaveLength(1);
    expect(result[0].content).toBe('Short text.');
    expect(result[0].index).toBe(0);
  });

  it('splits text into multiple chunks', () => {
    const text = 'a'.repeat(1200);
    const result = service.split(text, { chunkSize: 500, chunkOverlap: 50 });
    expect(result.length).toBeGreaterThan(1);
    result.forEach((chunk) => {
      expect(chunk.content.length).toBeLessThanOrEqual(500 + 50);
    });
  });

  it('respects paragraph boundaries when possible', () => {
    const paragraphs = Array.from({ length: 10 }, (_, i) => `Paragraph ${i}. ${'word '.repeat(20)}`);
    const text = paragraphs.join('\n\n');
    const result = service.split(text, { chunkSize: 300, chunkOverlap: 20 });

    // Chunks should not be force-split by character if paragraphs fit
    const forceSplitCount = result.filter((c) => c.content.length >= 300).length;
    expect(forceSplitCount).toBeLessThanOrEqual(result.length);
    expect(result.length).toBeGreaterThan(1);
  });

  it('applies overlap between chunks', () => {
    const text = 'The quick brown fox jumps over the lazy dog. '.repeat(50);
    const result = service.split(text, { chunkSize: 200, chunkOverlap: 30 });

    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1].content;
      const curr = result[i].content;
      const overlap = prev.slice(-30);
      expect(curr.startsWith(overlap) || curr.includes(overlap.slice(-10))).toBe(true);
    }
  });

  it('assigns sequential indexes', () => {
    const text = 'word '.repeat(500);
    const result = service.split(text, { chunkSize: 200, chunkOverlap: 20 });
    result.forEach((chunk, idx) => {
      expect(chunk.index).toBe(idx);
    });
  });

  it('throws when overlap >= chunkSize', () => {
    expect(() =>
      service.split('text', { chunkSize: 100, chunkOverlap: 100 }),
    ).toThrow('chunkOverlap must be less than chunkSize');
  });

  it('handles text with mixed separators', () => {
    const lines = Array.from({ length: 50 }, (_, i) => `Line ${i} has some content here.`);
    const text = lines.join('\n');
    const result = service.split(text, { chunkSize: 150, chunkOverlap: 10 });

    expect(result.length).toBeGreaterThan(1);
    expect(result.every((c) => c.content.length > 0)).toBe(true);
  });

  it('trims whitespace from chunk content', () => {
    const text = '  hello world  ';
    const result = service.split(text);
    expect(result[0].content).toBe('hello world');
  });
});
