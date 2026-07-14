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

export const GetAdminOrderDetailSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Get any order details',
      description:
        'Allows an administrator to retrieve the details of any specific order in the system by its ID.',
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
        'Forbidden access - only ADMIN role can view arbitrary order details',
    }),
    ApiNotFoundResponse({ description: 'Order not found' }),
  );
