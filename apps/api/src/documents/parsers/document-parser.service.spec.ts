import { Test, TestingModule } from '@nestjs/testing';
import { DocumentParserService } from './document-parser.service';

describe('DocumentParserService', () => {
  let service: DocumentParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentParserService],
    }).compile();

    service = module.get<DocumentParserService>(DocumentParserService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('parse (txt)', () => {
    it('extracts plain text and normalizes whitespace', async () => {
      const result = await service.parse(
        __dirname + '/fixtures/sample.txt',
        'text/plain',
      );
      expect(result.text).toContain('Hello world');
      expect(result.text).not.toContain('\r');
      expect(result.pageCount).toBeUndefined();
    });

    it('strips repeated blank lines', async () => {
      const result = await service.parse(
        __dirname + '/fixtures/multiblank.txt',
        'text/plain',
      );
      expect(result.text).not.toMatch(/\n{3,}/);
    });
  });

  describe('parse (markdown)', () => {
    it('removes heading markers and keeps text', async () => {
      const result = await service.parse(
        __dirname + '/fixtures/sample.md',
        'text/markdown',
      );
      expect(result.text).toContain('Introduction');
      expect(result.text).not.toContain('# Introduction');
    });

    it('removes bold/italic markers', async () => {
      const result = await service.parse(
        __dirname + '/fixtures/sample.md',
        'text/markdown',
      );
      expect(result.text).toContain('important');
      expect(result.text).not.toContain('**important**');
    });

    it('removes link syntax but keeps text', async () => {
      const result = await service.parse(
        __dirname + '/fixtures/sample.md',
        'text/markdown',
      );
      expect(result.text).toContain('click here');
      expect(result.text).not.toContain('[click here](');
    });

    it('removes code blocks', async () => {
      const result = await service.parse(
        __dirname + '/fixtures/sample.md',
        'text/markdown',
      );
      expect(result.text).not.toContain('```');
    });
  });

  describe('parse (unsupported)', () => {
    it('throws for unsupported MIME type', async () => {
      await expect(
        service.parse('some.docx', 'application/vnd.openxmlformats'),
      ).rejects.toThrow('Unsupported MIME type');
    });
  });
});
