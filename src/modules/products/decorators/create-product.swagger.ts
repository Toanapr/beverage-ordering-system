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

export const CreateProductSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[STAFF] Create a product in the assigned store' }),
    ApiSuccessResponse(ProductResponseDto, {
      status: 201,
      description: 'Product created successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid product data' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({
      description: 'Requires STAFF role and an assigned store',
    }),
    ApiNotFoundResponse({
      description: 'Category was not found in the assigned store',
    }),
  );
