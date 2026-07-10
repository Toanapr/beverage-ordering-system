import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';
import { CategoryResponseDto } from '../dto/responses/category-response.dto';

export const ListCategorySwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] List assigned store categories',
      description:
        'Returns only categories belonging to the authenticated Staff member’s assigned store. Supports search, pagination, and sorting.',
    }),
    ApiPaginatedResponse(
      CategoryResponseDto,
      'Category list retrieved successfully',
    ),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
  );
