import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { OrderResponseDto } from '../dto/responses/order-response.dto';

export const GetCustomerOrderDetailSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[CUSTOMER] Get own order details',
      description:
        'Returns the details and items of an order belonging to the authenticated customer.',
    }),
    ApiSuccessResponse(OrderResponseDto, {
      status: 200,
      description: 'Order details retrieved successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid order ID format' }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden access - only CUSTOMER role can view own orders',
    }),
    ApiNotFoundResponse({
      description:
        'Order not found or does not belong to the authenticated customer',
    }),
  );
