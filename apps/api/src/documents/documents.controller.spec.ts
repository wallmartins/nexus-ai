import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

describe('DocumentsController', () => {
  let controller: DocumentsController;

  const mockCreate = jest.fn();
  const mockFindAll = jest.fn();
  const mockFindById = jest.fn();
  const mockDelete = jest.fn();

  beforeEach(async () => {
    mockCreate.mockClear();
    mockFindAll.mockClear();
    mockFindById.mockClear();
    mockDelete.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DocumentsController],
      providers: [
        {
          provide: DocumentsService,
          useValue: {
            create: mockCreate,
            findAll: mockFindAll,
            findById: mockFindById,
            delete: mockDelete,
          },
        },
      ],
    }).compile();

    controller = module.get<DocumentsController>(DocumentsController);
  });

  it('instantiates', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /api/v1/documents', () => {
    it('returns all documents', async () => {
      const documents = [
        { id: 'doc-1', originalName: 'a.pdf', status: 'completed', createdAt: new Date() },
      ];
      mockFindAll.mockResolvedValueOnce(documents);

      const result = await controller.findAll();

      expect(mockFindAll).toHaveBeenCalled();
      expect(result).toEqual(documents);
    });
  });

  describe('GET /api/v1/documents/:id', () => {
    it('returns a document by id', async () => {
      const document = {
        id: 'doc-1',
        filename: 'a.pdf',
        originalName: 'a.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1024,
        status: 'completed',
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockFindById.mockResolvedValueOnce(document);

      const result = await controller.findOne('doc-1');

      expect(mockFindById).toHaveBeenCalledWith('doc-1');
      expect(result).toEqual(document);
    });

    it('throws when document is not found', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(controller.findOne('missing-id')).rejects.toThrow('Document not found');
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    it('returns 204 and deletes the document', async () => {
      mockFindById.mockResolvedValueOnce({ id: 'doc-1' });
      mockDelete.mockResolvedValueOnce(undefined);

      const result = await controller.remove('doc-1');

      expect(mockFindById).toHaveBeenCalledWith('doc-1');
      expect(mockDelete).toHaveBeenCalledWith('doc-1');
      expect(result).toBeUndefined();
    });

    it('throws when document does not exist', async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(controller.remove('missing-id')).rejects.toThrow('Document not found');
      expect(mockDelete).not.toHaveBeenCalled();
    });
  });
});
