import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const GetPublicProductSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Product Details (Public)',
      description:
        'Get details of a public product. The product must have an active status, belong to an open store, and not be locked.',
    }),
    ApiSuccessResponse(ProductResponseDto, {
      description: 'Product details retrieved successfully',
    }),
    ApiNotFoundResponse({ description: 'Product not found' }),
  );
