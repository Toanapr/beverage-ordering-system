import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  ImageMimeType,
  IMAGE_TYPE_BY_MIME,
  getMaxUploadSizeBytes,
  getUploadDirectory,
  isAllowedImageMimeType,
} from './upload.config';
import { UploadImageResponseDto } from './dto/upload-image-response.dto';

interface DetectedImageType {
  mimeType: ImageMimeType;
  extension: string;
}

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(
    file?: Express.Multer.File,
  ): Promise<UploadImageResponseDto> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    if (file.size > getMaxUploadSizeBytes(this.configService)) {
      throw new BadRequestException(
        'Image must not exceed the configured size limit',
      );
    }

    if (!isAllowedImageMimeType(file.mimetype, this.configService)) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP images are allowed',
      );
    }

    const detectedType = this.detectImageType(file.buffer);
    if (!detectedType || detectedType.mimeType !== file.mimetype) {
      throw new BadRequestException(
        'Image content does not match its MIME type',
      );
    }

    const directory = resolve(
      getUploadDirectory(this.configService),
      'products',
    );
    await mkdir(directory, { recursive: true });

    const filename = `${randomUUID()}.${detectedType.extension}`;
    await writeFile(join(directory, filename), file.buffer, { flag: 'wx' });

    return { imageUrl: `/uploads/products/${filename}` };
  }

  private detectImageType(buffer: Buffer): DetectedImageType | null {
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return {
        mimeType: 'image/jpeg',
        extension: IMAGE_TYPE_BY_MIME['image/jpeg'].extension,
      };
    }

    if (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return {
        mimeType: 'image/png',
        extension: IMAGE_TYPE_BY_MIME['image/png'].extension,
      };
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
      buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
    ) {
      return {
        mimeType: 'image/webp',
        extension: IMAGE_TYPE_BY_MIME['image/webp'].extension,
      };
    }

    return null;
  }
}
