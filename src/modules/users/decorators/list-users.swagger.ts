import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/common/decorators/swagger/api-paginated-response.decorator';
import { UserManagementResponseDto } from '../dto/responses/user-management-response.dto';

export const ListUsersSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] List users',
      description:
        'Supports pagination, search by email/fullName, filtering by role and lock status.',
    }),
    ApiPaginatedResponse(UserManagementResponseDto),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
  );
