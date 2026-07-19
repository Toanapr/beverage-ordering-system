import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { MessageResponseDto } from '../dto/responses/message-response.dto';

export const LogoutSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Logout, revoke all refresh tokens of the user' }),
    ApiSuccessResponse(MessageResponseDto, {
      description: 'Logout successful',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized access',
    }),
  );
