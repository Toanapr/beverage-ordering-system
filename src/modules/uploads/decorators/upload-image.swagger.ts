import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { UploadImageResponseDto } from '../dto/upload-image-response.dto';

export const UploadImageSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[STAFF] Upload a product image' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        required: ['image'],
        properties: {
          image: { type: 'string', format: 'binary' },
        },
      },
    }),
    ApiSuccessResponse(UploadImageResponseDto, {
      status: 201,
      description: 'Image uploaded successfully',
    }),
    ApiBadRequestResponse({
      description: 'Image is missing or is not a valid JPEG, PNG, or WebP file',
    }),
    ApiPayloadTooLargeResponse({ description: 'Image exceeds the 5 MB limit' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
  );
