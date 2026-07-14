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

export const GetStaffOrderDetailSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] Get order details',
      description:
        'Allows a staff member to retrieve the details of a specific order belonging to their assigned store.',
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
      description:
        'Forbidden access - only STAFF role can access order details, staff member has no assigned store, or order belongs to a different store',
    }),
    ApiNotFoundResponse({ description: 'Order not found' }),
  );
