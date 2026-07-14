import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';
import { OrderHistoryResponseDto } from '../dto/responses/order-history-response.dto';

export const GetCustomerOrderHistorySwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[CUSTOMER] List own order history',
      description:
        'Returns only orders belonging to the authenticated customer. Supports pagination and filtering by status.',
    }),
    ApiPaginatedResponse(
      OrderHistoryResponseDto,
      'Order history retrieved successfully',
    ),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden access - only CUSTOMER role can view order history',
    }),
  );
