import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StaffOrderStatisticsResponseDto } from '../dto/responses/staff-order-statistics-response.dto';

export const GetStaffOrderStatisticsSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] Get order statistics for assigned store',
      description:
        'Returns all-time statistics by default. Optional from/to dates use Asia/Ho_Chi_Minh calendar days; completed revenue is the sum of totalAmount for completed orders only.',
    }),
    ApiSuccessResponse(StaffOrderStatisticsResponseDto, {
      description: 'Order statistics retrieved successfully',
    }),
    ApiBadRequestResponse({
      description: 'Invalid date format or from date is after to date',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access due to missing or invalid token',
    }),
    ApiForbiddenResponse({
      description:
        'Forbidden access - only STAFF role can view statistics, or staff member has no assigned store',
    }),
  );
