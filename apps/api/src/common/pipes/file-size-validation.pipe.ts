import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
  private readonly maxSizeBytes: number;

  constructor(maxSizeMb: number) {
    this.maxSizeBytes = maxSizeMb * 1024 * 1024;
  }

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException(
        `File exceeds maximum size of ${this.maxSizeBytes / (1024 * 1024)}MB`,
      );
    }

    return file;
  }
}
