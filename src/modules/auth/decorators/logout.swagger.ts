import { applyDecorators } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { MessageResponseDto } from '../dto/responses/message-response.dto';

export const LogoutSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Đăng xuất, thu hồi mọi refresh token của user' }),
    ApiSuccessResponse(MessageResponseDto, {
      description: 'Đăng xuất thành công',
    }),
  );
