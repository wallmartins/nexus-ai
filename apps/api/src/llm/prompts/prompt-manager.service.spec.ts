import { Test, TestingModule } from '@nestjs/testing';
import { PromptManager } from './prompt-manager.service';

describe('PromptManager', () => {
  let manager: PromptManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptManager],
    }).compile();

    manager = module.get<PromptManager>(PromptManager);
  });

  it('instantiates', () => {
    expect(manager).toBeDefined();
  });

  describe('getAsset', () => {
    it('returns a known prompt asset', () => {
      const asset = manager.getAsset('rag-synthesis');
      expect(asset.name).toBe('rag-synthesis');
      expect(asset.version).toBe('1.0.0');
    });

    it('throws for unknown asset name', () => {
      expect(() => manager.getAsset('nonexistent')).toThrow(
        'Prompt asset not found: nonexistent',
      );
    });
  });

  describe('compose', () => {
    it('composes rag-synthesis prompt with context', () => {
      const context = manager.compose('rag-synthesis', {
        userQuery: 'What is the refund policy?',
        retrievedContext: 'Chunk 1: Refunds are available within 30 days.',
      });

      expect(context.system).toContain('knowledge assistant');
      expect(context.user).toContain('What is the refund policy?');
      expect(context.user).toContain('Chunk 1: Refunds are available within 30 days.');
      expect(context.history).toBeUndefined();
    });

    it('composes rag-synthesis prompt without context', () => {
      const context = manager.compose('rag-synthesis', {
        userQuery: 'Hello?',
      });

      expect(context.system).toBeDefined();
      expect(context.user).toBe('Question: Hello?');
      expect(context.user).not.toContain('Context:');
    });

    it('composes decision prompt', () => {
      const context = manager.compose('decision', {
        userQuery: 'What is our revenue?',
      });

      expect(context.system).toContain('query classifier');
      expect(context.user).toBe('What is our revenue?');
    });

    it('composes direct-answer prompt', () => {
      const context = manager.compose('direct-answer', {
        userQuery: 'Hello',
      });

      expect(context.system).toContain('helpful assistant');
      expect(context.user).toBe('Hello');
    });

    it('includes conversation history when provided', () => {
      const history = [
        { role: 'user' as const, content: 'Previous question' },
        { role: 'assistant' as const, content: 'Previous answer' },
      ];

      const context = manager.compose('rag-synthesis', {
        userQuery: 'Follow-up?',
        history,
      });

      expect(context.history).toEqual(history);
    });

    it('throws for unknown prompt name', () => {
      expect(() =>
        manager.compose('unknown', { userQuery: 'test' }),
      ).toThrow('Prompt asset not found: unknown');
    });
  });

  describe('listAssets', () => {
    it('returns all registered prompt assets', () => {
      const assets = manager.listAssets();
      const names = assets.map((a) => a.name);

      expect(names).toContain('rag-synthesis');
      expect(names).toContain('decision');
      expect(names).toContain('direct-answer');
      expect(assets).toHaveLength(3);
    });
  });
});
