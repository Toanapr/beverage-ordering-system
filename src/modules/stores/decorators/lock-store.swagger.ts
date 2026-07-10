import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const LockStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Lock store',
      description:
        'Locked store will not be displayed in public API and cannot receive new orders.',
    }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Store locked successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Not logged in or access token is invalid',
    }),
    ApiForbiddenResponse({ description: 'Forbidden: Admin access required' }),
    ApiNotFoundResponse({ description: 'Store not found' }),
  );
