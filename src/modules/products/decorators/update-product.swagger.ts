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
import { ProductResponseDto } from '../dto/responses/product-response.dto';

export const UpdateProductSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[STAFF] Update a product in the assigned store' }),
    ApiSuccessResponse(ProductResponseDto, {
      description: 'Product updated successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid or empty update payload' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
    ApiNotFoundResponse({
      description: 'Product or category was not found in the assigned store',
    }),
  );
