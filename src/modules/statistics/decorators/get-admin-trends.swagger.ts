import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { AdminTrendItemDto } from '../dto/responses/admin-trends-response.dto';

export const GetAdminTrendsSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Get revenue and order volume trends over time',
    }),
    ApiSuccessResponse(AdminTrendItemDto, {
      status: 200,
      description: 'Trends retrieved successfully',
      isArray: true,
    }),
    ApiBadRequestResponse({
      description: 'Invalid query parameters (range, date format)',
    }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({ description: 'Requires ADMIN role' }),
  );
