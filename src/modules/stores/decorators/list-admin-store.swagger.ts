import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StoreResponseDto } from '../dto/responses/store-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListAdminStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Store list for admin',
      description:
        'Supports search (by name), sort, and filters (isOpen, isLocked). Returns all stores (including closed and locked ones) matching the filter.',
    }),
    ApiPaginatedResponse(
      StoreResponseDto,
      'Stores retrieved successfully for admin',
    ),
    ApiUnauthorizedResponse({
      description: 'Not logged in or access token is invalid',
    }),
    ApiForbiddenResponse({ description: 'Forbidden: Admin access required' }),
  );
