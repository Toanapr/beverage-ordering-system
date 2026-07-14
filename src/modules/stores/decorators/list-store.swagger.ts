import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { StoreResponseDto } from '../dto/responses/store-response.dto';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';

export const ListStoreSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Store list (public)',
      description:
        'Supports search (by name) and sort. Only open, unlocked stores appear; isOpen and isLocked query values cannot expose closed or locked stores.',
    }),
    ApiPaginatedResponse(StoreResponseDto, 'Stores retrieved successfully'),
  );
