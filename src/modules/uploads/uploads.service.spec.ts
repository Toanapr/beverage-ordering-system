import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { UploadsService } from './uploads.service';

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const webp = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.alloc(4),
  Buffer.from('WEBP'),
]);

describe('UploadsService', () => {
  let uploadDir: string;
  let service: UploadsService;

  beforeEach(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'beverage-upload-'));
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          UPLOAD_DIR: uploadDir,
          UPLOAD_MAX_SIZE_MB: '5',
          UPLOAD_ALLOWED_TYPES: 'jpg,jpeg,png,webp',
        };
        return values[key];
      }),
    } as unknown as ConfigService;
    service = new UploadsService(configService);
  });

  afterEach(async () => {
    await rm(uploadDir, { recursive: true, force: true });
  });

  const file = (buffer: Buffer, mimetype: string): Express.Multer.File =>
    ({ buffer, mimetype, size: buffer.length }) as Express.Multer.File;

  it.each([
    ['image/jpeg', jpeg, 'jpg'],
    ['image/png', png, 'png'],
    ['image/webp', webp, 'webp'],
  ])(
    'stores a valid %s image and returns its relative URL',
    async (mimetype, buffer, extension) => {
      const result = await service.uploadImage(file(buffer, mimetype));

      expect(result.imageUrl).toMatch(
        new RegExp(`^/uploads/products/[0-9a-f-]{36}\\.${extension}$`),
      );
      const filename = result.imageUrl.split('/').at(-1)!;
      await expect(
        readFile(join(uploadDir, 'products', filename)),
      ).resolves.toEqual(buffer);
    },
  );

  it('rejects a missing file', async () => {
    await expect(service.uploadImage()).rejects.toThrow(BadRequestException);
  });

  it('rejects an unsupported MIME type', async () => {
    await expect(service.uploadImage(file(jpeg, 'image/gif'))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a MIME type that does not match the file signature', async () => {
    await expect(service.uploadImage(file(png, 'image/jpeg'))).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects a file larger than the configured limit', async () => {
    const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);
    oversized.set(jpeg, 0);

    await expect(
      service.uploadImage(file(oversized, 'image/jpeg')),
    ).rejects.toThrow(BadRequestException);
  });
});
