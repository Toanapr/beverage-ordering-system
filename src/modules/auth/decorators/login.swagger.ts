import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { LoginResponseDto } from '../dto/responses/login-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const LoginSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Đăng nhập',
            description: 'Api đăng nhập',
        }),
        ApiSuccessResponse(LoginResponseDto, { description: 'Đăng nhập thành công' }),
        ApiUnauthorizedResponse({ description: 'Email hoặc mật khẩu không chính xác' }),
        ApiForbiddenResponse({ description: 'Tài khoản đã bị khóa' }),
    );