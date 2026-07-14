import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { TopStoreItemDto } from '../dto/responses/top-stores-response.dto';

export const GetTopStoresSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Get top performing stores leaderboard' }),
    ApiSuccessResponse(TopStoreItemDto, {
      status: 200,
      description: 'Stores leaderboard retrieved successfully',
      isArray: true,
    }),
    ApiBadRequestResponse({ description: 'Invalid query parameters' }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({ description: 'Requires ADMIN role' }),
  );
