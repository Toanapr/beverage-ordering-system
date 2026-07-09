import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StaffResponseDto } from '../dto/responses/staff-response.dto';

export const CreateStaffSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Create a staff account' }),
    ApiSuccessResponse(StaffResponseDto, {
      status: 201,
      description: 'Staff account created successfully',
    }),
    ApiBadRequestResponse({ description: 'Invalid staff data' }),
    ApiUnauthorizedResponse({
      description: 'Missing or invalid access token',
    }),
    ApiForbiddenResponse({ description: 'Admin permission is required' }),
    ApiConflictResponse({ description: 'Email is already in use' }),
    ApiNotFoundResponse({ description: 'Store not found' }),
  );
