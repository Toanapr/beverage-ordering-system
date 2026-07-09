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

export const UnlockUserSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Unlock a customer or staff account',
      description:
        'Unlocks customer/staff accounts. Admin accounts cannot be unlocked through this endpoint.',
    }),
    ApiSuccessResponse(UserManagementResponseDto, {
      description: 'User account unlocked successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
    ApiNotFoundResponse({ description: 'Lockable user not found' }),
  );
