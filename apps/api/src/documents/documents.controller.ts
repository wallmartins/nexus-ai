import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { DocumentsService } from './documents.service';
import { FileSizeValidationPipe } from '../common/pipes/file-size-validation.pipe';
import { MimeTypeValidationPipe } from '../common/pipes/mime-type-validation.pipe';
import { throttlerConfig } from '../config/throttler.config';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
];

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Throttle({
    default: {
      limit: throttlerConfig.upload.limit,
      ttl: throttlerConfig.upload.ttl,
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  async upload(
    @UploadedFile(
      new FileSizeValidationPipe(10),
      new MimeTypeValidationPipe(ALLOWED_MIME_TYPES),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const document = await this.documentsService.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    });

    return document;
  }

  @Get()
  async findAll() {
    return this.documentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const document = await this.documentsService.findById(id);
    if (!document) {
      throw new BadRequestException('Document not found');
    }
    return document;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    const document = await this.documentsService.findById(id);
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    await this.documentsService.delete(id);
  }
}
