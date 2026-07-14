import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { AdminStatisticsResponseDto } from '../dto/responses/admin-statistics-response.dto';

export const GetAdminStatisticsSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Get total counts and revenue overview' }),
    ApiSuccessResponse(AdminStatisticsResponseDto, {
      status: 200,
      description: 'Statistics retrieved successfully',
    }),
    ApiUnauthorizedResponse({ description: 'Missing or invalid access token' }),
    ApiForbiddenResponse({ description: 'Requires ADMIN role' }),
  );
