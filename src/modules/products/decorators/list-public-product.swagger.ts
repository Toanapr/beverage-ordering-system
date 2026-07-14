import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ProductResponseDto } from '../dto/responses/product-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListPublicProductSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Product List (Public)',
      description:
        'Customers search, filter, and paginate products. Only displays active products belonging to open stores that are not locked.',
    }),
    ApiPaginatedResponse(
      ProductResponseDto,
      'Product list retrieved successfully',
    ),
  );
