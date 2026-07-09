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
      summary: 'Làm mới access token',
      description:
        'Đọc refreshToken từ httpOnly cookie, không nhận qua body nữa.',
    }),
    ApiSuccessResponse(AccessTokenResponseDto, {
      description: 'Refresh thành công',
    }),
    ApiUnauthorizedResponse({
      description: 'Refresh token không hợp lệ, đã hết hạn hoặc không tồn tại',
    }),
    ApiForbiddenResponse({
      description: 'Account does not exist or has been locked',
    }),
  );
