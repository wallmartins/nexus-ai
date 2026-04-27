import { Test, TestingModule } from '@nestjs/testing';
import { ScoringService } from './scoring.service';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScoringService],
    }).compile();

    service = module.get<ScoringService>(ScoringService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('computeRelevance', () => {
    it('returns 1.0 when all retrieved chunks are in reference', () => {
      const score = service.computeRelevance(
        ['chunk-1', 'chunk-2'],
        ['chunk-1', 'chunk-2', 'chunk-3'],
      );
      expect(score).toBe(1.0);
    });

    it('returns 0.5 when half of retrieved chunks are in reference', () => {
      const score = service.computeRelevance(
        ['chunk-1', 'chunk-2'],
        ['chunk-1', 'chunk-3'],
      );
      expect(score).toBe(0.5);
    });

    it('returns 0.0 when no retrieved chunks match reference', () => {
      const score = service.computeRelevance(
        ['chunk-1', 'chunk-2'],
        ['chunk-3', 'chunk-4'],
      );
      expect(score).toBe(0);
    });

    it('returns 0.0 when no chunks are retrieved', () => {
      const score = service.computeRelevance([], ['chunk-1']);
      expect(score).toBe(0);
    });
  });

  describe('computeConsistency', () => {
    it('returns high score for similar answers', () => {
      const score = service.computeConsistency(
        'The quick brown fox jumps over the lazy dog.',
        'The quick brown fox jumps over the lazy dog.',
      );
      expect(score).toBe(1.0);
    });

    it('returns lower score for partially overlapping answers', () => {
      const score = service.computeConsistency(
        'The quick brown fox jumps over the lazy dog.',
        'The quick brown fox sleeps under the tree.',
      );
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('returns 0.0 for completely different answers', () => {
      const score = service.computeConsistency(
        'The quick brown fox jumps over the lazy dog.',
        'abcdefg hijklmnop qrstuvw xyz12345',
      );
      expect(score).toBe(0);
    });

    it('returns 0.0 for empty generated answer', () => {
      const score = service.computeConsistency('', 'Some expected answer');
      expect(score).toBe(0);
    });
  });

  describe('computeGrounding', () => {
    it('returns high score when answer is derived from chunks', () => {
      const score = service.computeGrounding(
        'The company offers health insurance and 401k matching.',
        [
          'Benefits include health insurance dental and vision coverage.',
          'Retirement benefits include 401k matching up to four percent.',
        ],
      );
      expect(score).toBeGreaterThan(0.5);
    });

    it('returns low score when answer is unrelated to chunks', () => {
      const score = service.computeGrounding(
        'The weather is sunny today with a chance of rain.',
        [
          'Employee handbook chapter three covers remote work policy.',
          'Code review guidelines require at least one approval.',
        ],
      );
      expect(score).toBeLessThan(0.3);
    });

    it('returns 0.0 for empty answer', () => {
      const score = service.computeGrounding('', ['Some chunk content']);
      expect(score).toBe(0);
    });
  });
});
