import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const GetProductSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF/ADMIN] Product details',
      description:
        'Staff can only view products belonging to their assigned store.',
    }),
    ApiSuccessResponse(ProductResponseDto, {
      description: 'Product details retrieved successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Not logged in or access token is invalid',
    }),
    ApiForbiddenResponse({
      description:
        'Product belongs to another store - forbidden (store ownership)',
    }),
    ApiNotFoundResponse({ description: 'Product not found' }),
  );
