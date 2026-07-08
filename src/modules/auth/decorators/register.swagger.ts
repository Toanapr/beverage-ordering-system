import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiConflictResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { UserResponseDto } from '../dto/responses/user-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const RegisterSwagger = () =>
    applyDecorators(
        ApiOperation({
            summary: 'Đăng ký tài khoản mới',
            description: 'Tạo tài khoản với role mặc định là "customer". Trả về thông tin user vừa tạo (không bao gồm mật khẩu).',
        }),
        ApiSuccessResponse(UserResponseDto, {
            status: 201,
            description: 'Đăng ký thành công',
        }),
        ApiConflictResponse({ description: 'Email này đã được sử dụng!' }),
        ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ (email sai định dạng, mật khẩu quá ngắn, thiếu trường bắt buộc,...)' }),
    );