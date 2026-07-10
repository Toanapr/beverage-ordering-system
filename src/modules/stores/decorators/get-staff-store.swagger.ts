import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/swagger/api-success-response.decorator';
import { StoreResponseDto } from '../dto/responses/store-response.dto';

export const GetStaffStoreSwagger = () =>
  applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: '[STAFF] Xem cửa hàng được phân công',
      description:
        'Cửa hàng được xác định từ tài khoản Staff đang đăng nhập; client không cần truyền storeId.',
    }),
    ApiSuccessResponse(StoreResponseDto, {
      description: 'Lấy thông tin cửa hàng được phân công thành công',
    }),
    ApiUnauthorizedResponse({
      description: 'Chưa đăng nhập hoặc access token không hợp lệ',
    }),
    ApiForbiddenResponse({
      description:
        'Không có quyền STAFF hoặc Staff chưa được phân công cửa hàng',
    }),
    ApiNotFoundResponse({
      description: 'Cửa hàng được phân công không tồn tại',
    }),
  );
