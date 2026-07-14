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

export const CancelStaffOrderSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] Cancel an order in the assigned store',
      description:
        'Allows staff to cancel a pending or preparing order from their assigned store. A cancel reason is required.',
    }),
    ApiSuccessResponse(OrderResponseDto, {
      status: 200,
      description: 'Order cancelled successfully',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid order ID, missing cancel reason, or order is not pending or preparing',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden access - only STAFF role can cancel orders, staff member has no assigned store, or order belongs to a different store',
    }),
    ApiNotFoundResponse({ description: 'Order not found' }),
  );
