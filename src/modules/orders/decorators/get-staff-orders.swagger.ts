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

export const GetStaffOrdersSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] List and filter orders for the assigned store',
      description:
        'Allows a staff member to view and filter orders belonging to their assigned store. Supports pagination and filtering by status.',
    }),
    ApiPaginatedResponse(OrderResponseDto, 'Orders retrieved successfully'),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden access - only STAFF role can list staff orders, or staff member has no assigned store',
    }),
  );
