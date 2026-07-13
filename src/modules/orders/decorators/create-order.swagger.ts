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

export const CreateOrderSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new order (COD)',
      description:
        'The customerId is retrieved from the access token and not from the request body. The server automatically calculates the subtotal/totalAmount and snapshots the product name and price at the time of order placement.',
    }),
    ApiSuccessResponse(OrderResponseDto, {
      status: 201,
      description: 'Order created successfully',
    }),
    ApiBadRequestResponse({
      description:
        'Invalid request data, product does not exist, product does not belong to the store, or product is unavailable',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description:
        'Store is currently locked, closed, or user does not have the CUSTOMER role',
    }),
    ApiNotFoundResponse({
      description: 'Store not found',
    }),
  );
