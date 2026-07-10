import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { StoreResponseDto } from '../dto/responses/store-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListStoreSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Store list (public)',
      description:
        'Supports search (by name), filter (isOpen), and sort. Locked stores (isLocked=true) never appear in the results, even if isLocked=true is passed.',
    }),
    ApiPaginatedResponse(StoreResponseDto, 'Stores retrieved successfully'),
  );
