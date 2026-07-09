import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { UserManagementResponseDto } from '../dto/responses/user-management-response.dto';

export const LockUserSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Lock a customer or staff account',
      description:
        'Locks customer/staff accounts and revokes refresh tokens. Admin accounts cannot be locked through this endpoint.',
    }),
    ApiSuccessResponse(UserManagementResponseDto, {
      description: 'User account locked successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
    ApiNotFoundResponse({ description: 'Lockable user not found' }),
  );
