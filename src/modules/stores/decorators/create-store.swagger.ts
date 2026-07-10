import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StoreResponseDto } from '../dto/responses/store-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const CreateStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Create a new store' }),
    ApiSuccessResponse(StoreResponseDto, {
      status: 201,
      description: 'Store created successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid data' }),
    ApiUnauthorizedResponse({
      description: 'Not logged in or access token is invalid',
    }),
    ApiForbiddenResponse({ description: 'Forbidden: Admin access required' }),
    ApiConflictResponse({ description: 'Store name already exists' }),
  );
