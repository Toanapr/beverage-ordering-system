import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';
import { OrderResponseDto } from '../dto/responses/order-response.dto';

export const GetAdminOrdersSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] List and filter all orders in the system',
      description:
        'Allows an administrator to view and filter all orders across all stores. Supports pagination and filtering by status, storeId, and customerId.',
    }),
    ApiPaginatedResponse(OrderResponseDto, 'All orders retrieved successfully'),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden access - only ADMIN role can retrieve all orders',
    }),
  );
