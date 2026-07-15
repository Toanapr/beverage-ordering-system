import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserResponseDto } from '../dto/responses/user-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const GetMeSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get current user profile',
      description:
        'Get profile information of the currently authenticated user.',
    }),
    ApiSuccessResponse(UserResponseDto, {
      description: 'Profile retrieved successfully',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access',
    }),
  );
