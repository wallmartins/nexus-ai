import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateDocumentInput {
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateDocumentInput) {
    return this.prisma.document.create({
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
  }

  async findAll() {
    return this.prisma.document.findMany({
      select: {
        id: true,
        originalName: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.document.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    await this.prisma.document.delete({
      where: { id },
    });
  }
}
