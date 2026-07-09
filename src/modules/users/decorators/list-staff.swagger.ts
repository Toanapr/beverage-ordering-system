import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';
import { StaffResponseDto } from '../dto/responses/staff-response.dto';

export const ListStaffSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] List staff accounts',
      description:
        'Supports pagination, search by email/fullName, filtering by storeId and lock status.',
    }),
    ApiPaginatedResponse(StaffResponseDto),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
  );
