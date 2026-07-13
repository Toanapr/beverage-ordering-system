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

export const CancelOrderSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Cancel a pending order',
      description:
        'Allows a customer to cancel their own order. The order must be in PENDING status, and a valid cancelReason must be provided.',
    }),
    ApiSuccessResponse(OrderResponseDto, {
      status: 200,
      description: 'Order cancelled successfully',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid request data, missing cancel reason, or order is not in PENDING status',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description: 'Forbidden access - only CUSTOMER role can cancel orders',
    }),
    ApiNotFoundResponse({
      description:
        'Order not found or does not belong to the authenticated customer',
    }),
  );
