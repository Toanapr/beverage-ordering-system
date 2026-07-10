import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const UpdateStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Update store information' }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Store updated successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiUnauthorizedResponse({
      description: 'Not logged in or access token is invalid',
    }),
    ApiForbiddenResponse({ description: 'Forbidden: Admin access required' }),
    ApiNotFoundResponse({ description: 'Store not found' }),
    ApiConflictResponse({ description: 'Store name already exists' }),
  );
