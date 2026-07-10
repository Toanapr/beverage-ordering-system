import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AccessTokenResponseDto } from '../dto/responses/access-token-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const RefreshSwagger = () =>
  applyDecorators(
    ApiCookieAuth('refreshToken'),
    ApiOperation({
      summary: 'Refresh access token',
      description:
        'Read refreshToken from httpOnly cookie, no longer received via body.',
    }),
    ApiSuccessResponse(AccessTokenResponseDto, {
      description: 'Refresh successful',
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid, expired, or non-existent refresh token',
    }),
    ApiForbiddenResponse({
      description: 'Account does not exist or has been locked',
    }),
  );
