import { ConfigService } from '@nestjs/config';

const DEFAULT_MAX_SIZE_MB = 5;
const DEFAULT_ALLOWED_TYPES = ['jpg', 'jpeg', 'png', 'webp'];

export const IMAGE_TYPE_BY_MIME = {
  'image/jpeg': { extension: 'jpg', configTypes: ['jpg', 'jpeg'] },
  'image/png': { extension: 'png', configTypes: ['png'] },
  'image/webp': { extension: 'webp', configTypes: ['webp'] },
} as const;

export type ImageMimeType = keyof typeof IMAGE_TYPE_BY_MIME;

export const getUploadDirectory = (configService: ConfigService): string =>
  configService.get<string>('UPLOAD_DIR') ?? './uploads';

export const getMaxUploadSizeBytes = (configService: ConfigService): number => {
  const configuredSize = Number(
    configService.get<string>('UPLOAD_MAX_SIZE_MB') ?? DEFAULT_MAX_SIZE_MB,
  );
  const sizeInMb =
    Number.isFinite(configuredSize) && configuredSize > 0
      ? configuredSize
      : DEFAULT_MAX_SIZE_MB;

  return sizeInMb * 1024 * 1024;
};

export const getAllowedImageTypes = (
  configService: ConfigService,
): Set<string> => {
  const configuredTypes = configService.get<string>('UPLOAD_ALLOWED_TYPES');
  const types = (configuredTypes ?? DEFAULT_ALLOWED_TYPES.join(','))
    .split(',')
    .map((type) => type.trim().toLowerCase())
    .filter(Boolean);

  return new Set(types);
};

export const isAllowedImageMimeType = (
  mimeType: string,
  configService: ConfigService,
): mimeType is ImageMimeType => {
  if (!(mimeType in IMAGE_TYPE_BY_MIME)) {
    return false;
  }

  const allowedTypes = getAllowedImageTypes(configService);
  const configTypes: readonly string[] =
    IMAGE_TYPE_BY_MIME[mimeType as ImageMimeType].configTypes;
  return configTypes.some((type) => allowedTypes.has(type));
};
