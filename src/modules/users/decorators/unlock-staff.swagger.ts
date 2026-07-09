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

export const UnlockStaffSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Unlock a staff account' }),
    ApiSuccessResponse(StaffResponseDto, {
      description: 'Staff account unlocked successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
    ApiNotFoundResponse({ description: 'Staff not found' }),
  );
