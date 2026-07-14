import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { OrderResponseDto } from '../dto/responses/order-response.dto';

export const UpdateOrderStatusSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] Update order status',
      description:
        'Allows a staff member to update the status of an order belonging to their assigned store. Only pending -> preparing and preparing -> completed transitions are allowed.',
    }),
    ApiSuccessResponse(OrderResponseDto, {
      status: 200,
      description: 'Order status updated successfully',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid order ID, invalid status, or invalid transition attempt',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden access - only STAFF role can update status, staff member has no assigned store, or order belongs to a different store',
    }),
    ApiNotFoundResponse({ description: 'Order not found' }),
  );
