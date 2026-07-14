import { applyDecorators } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const GetStoreSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Store details (public)' }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Store details retrieved successfully',
    }),
    ApiNotFoundResponse({
      description: 'Store not found (does not exist, is closed, or is locked)',
    }),
  );
