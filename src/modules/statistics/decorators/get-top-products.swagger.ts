import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { TopProductItemDto } from '../dto/responses/top-products-response.dto';

export const GetTopProductsSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Get top selling products leaderboard' }),
    ApiSuccessResponse(TopProductItemDto, {
      status: 200,
      description: 'Products leaderboard retrieved successfully',
      isArray: true,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({ description: 'Requires ADMIN role' }),
  );
