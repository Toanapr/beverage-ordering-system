import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListProductSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF/ADMIN] Product list',
      description:
        'Staff can only see products belonging to their assigned store (passing storeId will cause an error). Admin can filter by any storeId or leave empty to view all stores. Supports search by name, filter by status, sort, and pagination.',
    }),
    ApiPaginatedResponse(
      ProductResponseDto,
      'Product list retrieved successfully',
    ),
    ApiUnauthorizedResponse({
      description: 'Not logged in or access token is invalid',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden: Requires STAFF/ADMIN role, or staff not assigned to any store',
    }),
  );
