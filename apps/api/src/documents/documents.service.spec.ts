import { Test, TestingModule } from '@nestjs/testing';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../database/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: PrismaService;

  const mockDocumentCreate = jest.fn();
  const mockDocumentFindMany = jest.fn();
  const mockDocumentFindUnique = jest.fn();
  const mockDocumentDelete = jest.fn();

  beforeEach(async () => {
    mockDocumentCreate.mockClear();
    mockDocumentFindMany.mockClear();
    mockDocumentFindUnique.mockClear();
    mockDocumentDelete.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: PrismaService,
          useValue: {
            document: {
              create: mockDocumentCreate,
              findMany: mockDocumentFindMany,
              findUnique: mockDocumentFindUnique,
              delete: mockDocumentDelete,
            },
          },
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('instantiates', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a document with pending status', async () => {
      const input = {
        filename: 'uuid.pdf',
        originalName: 'report.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2048,
      };
      const created = {
        id: 'doc-1',
        originalName: 'report.pdf',
        status: 'pending',
        createdAt: new Date(),
      };
      mockDocumentCreate.mockResolvedValueOnce(created);

      const result = await service.create(input);

      expect(mockDocumentCreate).toHaveBeenCalledWith({
        data: {
          filename: input.filename,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          status: 'pending',
          metadata: {},
        },
        select: {
          id: true,
          originalName: true,
          status: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('returns documents ordered by createdAt desc', async () => {
      const documents = [
        { id: 'doc-2', originalName: 'b.pdf', status: 'completed', createdAt: new Date() },
        { id: 'doc-1', originalName: 'a.pdf', status: 'pending', createdAt: new Date() },
      ];
      mockDocumentFindMany.mockResolvedValueOnce(documents);

      const result = await service.findAll();

      expect(mockDocumentFindMany).toHaveBeenCalledWith({
        select: {
          id: true,
          originalName: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(documents);
    });
  });

  describe('findById', () => {
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
      mockDocumentFindUnique.mockResolvedValueOnce(document);

      const result = await service.findById('doc-1');

      expect(mockDocumentFindUnique).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(result).toEqual(document);
    });

    it('returns null when document is not found', async () => {
      mockDocumentFindUnique.mockResolvedValueOnce(null);

      const result = await service.findById('missing');

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes a document by id', async () => {
      mockDocumentDelete.mockResolvedValueOnce(undefined);

      await service.delete('doc-1');

      expect(mockDocumentDelete).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
    });

    it('propagates Prisma error when document does not exist', async () => {
      const prismaError = new Error('Record to delete does not exist');
      mockDocumentDelete.mockRejectedValueOnce(prismaError);

      await expect(service.delete('missing')).rejects.toThrow('Record to delete does not exist');
    });
  });
});
