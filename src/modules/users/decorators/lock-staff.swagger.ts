import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StaffResponseDto } from '../dto/responses/staff-response.dto';

export const LockStaffSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[ADMIN] Lock a staff account',
      description:
        'Locks a staff account and revokes its refresh tokens. Existing access tokens are rejected by the JWT strategy.',
    }),
    ApiSuccessResponse(StaffResponseDto, {
      description: 'Staff account locked successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
    ApiNotFoundResponse({ description: 'Staff not found' }),
  );
