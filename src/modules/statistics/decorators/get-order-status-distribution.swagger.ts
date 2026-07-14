import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { OrderStatusDistributionResponseDto } from '../dto/responses/order-status-response.dto';

export const GetOrderStatusDistributionSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Get distribution of order statuses' }),
    ApiSuccessResponse(OrderStatusDistributionResponseDto, {
      status: 200,
      description: 'Order status distribution retrieved successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({ description: 'Requires ADMIN role' }),
  );
