import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class MimeTypeValidationPipe implements PipeTransform {
  private readonly allowedTypes: string[];

  constructor(allowedTypes: string[]) {
    this.allowedTypes = allowedTypes;
  }

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed types: ${this.allowedTypes.join(', ')}`,
      );
    }

    return file;
  }
}
