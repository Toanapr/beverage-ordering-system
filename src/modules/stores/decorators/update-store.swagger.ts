import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const UpdateStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Cập nhật thông tin cửa hàng' }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Cập nhật thành công',
    }),
    ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' }),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc access token không hợp lệ',
    }),
    ApiForbiddenResponse({ description: 'Không có quyền ADMIN' }),
    ApiNotFoundResponse({ description: 'Không tìm thấy cửa hàng' }),
    ApiConflictResponse({ description: 'Tên cửa hàng đã tồn tại' }),
  );
