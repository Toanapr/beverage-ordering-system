import { BadRequestException, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { getMaxUploadSizeBytes, isAllowedImageMimeType } from './upload.config';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: memoryStorage(),
        limits: { fileSize: getMaxUploadSizeBytes(configService), files: 1 },
        fileFilter: (_request, file, callback) => {
          if (!isAllowedImageMimeType(file.mimetype, configService)) {
            callback(
              new BadRequestException(
                'Only JPEG, PNG, and WebP images are allowed',
              ),
              false,
            );
            return;
          }

          callback(null, true);
        },
      }),
    }),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
