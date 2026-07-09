import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { StoreResponseDto } from '../dto/responses/store-response.dto';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';

export const CreateStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: '[ADMIN] Tạo cửa hàng mới' }),
    ApiSuccessResponse(StoreResponseDto, {
      status: 201,
      description: 'Tạo cửa hàng thành công',
    }),
    ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' }),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc access token không hợp lệ',
    }),
    ApiForbiddenResponse({ description: 'Không có quyền ADMIN' }),
    ApiConflictResponse({ description: 'Tên cửa hàng đã tồn tại' }),
  );
