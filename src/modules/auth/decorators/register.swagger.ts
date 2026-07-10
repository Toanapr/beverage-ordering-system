import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiConflictResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from '../dto/responses/user-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const RegisterSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new account',
      description:
        'Create account with default role "customer". Returns the created user details (excluding password).',
    }),
    ApiSuccessResponse(UserResponseDto, {
      status: 201,
      description: 'Registration successful',
    }),
    ApiConflictResponse({ description: 'Email is already in use' }),
    ApiBadRequestResponse({
      description:
        'Invalid data (invalid email format, password too short, missing required fields, etc.)',
    }),
  );
